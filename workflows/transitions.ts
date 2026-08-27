import { sleep } from 'workflow';
import { head, put } from '@vercel/blob';

import {
    rendererUrl,
    authHeaders,
} from './render';
import {
    type EnergyArc,
    type TransitionPayload,
    enqueueAnalysis,
    fetchFullAudioBytes,
    fetchRankedCandidates,
    missingAnalyses,
    resolveTransitionPayload,
} from '../remotion/Backroom/payload';

// --- Analysis ---------------------------------------------------------------
// Tracks must have a stored analysis (essentia-dj-v8) before a transition can
// be resolved. Missing analyses are enqueued the same way the backroom desk's
// enqueue button does, then polled via the public analysis API.

const getMissingAnalyses = async (trackIds: string[]) => {
    'use step';
    return missingAnalyses(trackIds);
};

const enqueueTrackAnalysis = async (trackId: string) => {
    'use step';
    await enqueueAnalysis(trackId);
    return { trackId, enqueued: true as const };
};

const ensureAnalyses = async (trackIds: string[]) => {
    'use workflow';

    let missing = await getMissingAnalyses(trackIds);
    if (missing.length === 0) return { scheduled: false };

    for (const trackId of missing) {
        await enqueueTrackAnalysis(trackId);
    }

    // Analysis decodes up to 10 minutes of audio per track; poll up to ~15 min.
    for (let attempt = 0; attempt < 90; attempt++) {
        await sleep(10_000);
        missing = await getMissingAnalyses(trackIds);
        if (missing.length === 0) return { scheduled: true };
    }

    throw new Error(`Analysis not ready after timeout for tracks: ${missing.join(', ')}`);
};

// --- Payload ----------------------------------------------------------------

const resolvePayload = async (
    outgoingTrackId: string,
    candidateTrackId: string,
    energyArc: EnergyArc,
) => {
    'use step';
    return resolveTransitionPayload({ outgoingTrackId, candidateTrackId, energyArc });
};

// Materialize a track's FULL audio as a composition-owned Blob asset so
// renders never depend on the shared stream route (dedup per track ID).
// Uses the service-credential flow (progressive or HLS-concatenated) — never
// the 30s preview.
const materializeAudio = async (trackId: string) => {
    'use step';

    const pathname = `backroom-audio/${trackId}-full.mp3`;
    try {
        const existing = await head(pathname);
        return existing.downloadUrl ?? existing.url;
    } catch {
        // Not stored yet — fetch and upload below.
    }

    const bytes = await fetchFullAudioBytes(trackId);
    const blob = await put(pathname, bytes, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
    });
    return blob.url;
};

const withMaterializedAudio = async (payload: TransitionPayload): Promise<TransitionPayload> => {
    const [outgoingAudioFile, incomingAudioFile] = await Promise.all([
        materializeAudio(payload.outgoing.id),
        materializeAudio(payload.incoming.id),
    ]);
    return {
        ...payload,
        outgoing: { ...payload.outgoing, audioFile: outgoingAudioFile },
        incoming: { ...payload.incoming, audioFile: incomingAudioFile },
    };
};

// --- Render -----------------------------------------------------------------

const submitRender = async (id: string, payload: unknown, outputName: string) => {
    'use step';

    const response = await fetch(`${rendererUrl}/api/render`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            id,
            inputProps: { payload },
            outputName,
            type: 'video',
        }),
    });
    const submitted = await response.json() as { success: boolean; jobId?: string; error?: string };

    if (!response.ok || !submitted.success || !submitted.jobId) {
        throw new Error(submitted.error ?? `Render submission failed for ${outputName}`);
    }

    return submitted.jobId;
};

const getRenderStatus = async (jobId: string) => {
    'use step';

    const response = await fetch(`${rendererUrl}/api/render/${jobId}`, {
        headers: authHeaders(),
    });
    const result = await response.json() as { status?: string; path?: string; error?: string };

    if (!response.ok) {
        throw new Error(result.error ?? `Render status failed for job ${jobId}`);
    }

    return result;
};

const waitForRender = async (jobId: string) => {
    for (let attempt = 0; attempt < 120; attempt++) {
        await sleep(5000);
        const result = await getRenderStatus(jobId);

        if (result.status === 'done') {
            if (!result.path) {
                throw new Error(`Render completed without output path: ${jobId}`);
            }
            return result.path;
        }
        if (result.status === 'error') {
            throw new Error(result.error || `Render failed: ${jobId}`);
        }
    }
    throw new Error(`Render timed out: ${jobId}`);
};

// --- Workflows --------------------------------------------------------------
// One composition for the whole transition: approach → blend → post-roll,
// audio-matched to each pair's best transition window.

export const transitionBatch = async (
    outgoingTrackId: string,
    candidateTrackIds: string[],
    energyArc: EnergyArc,
) => {
    'use workflow';

    await ensureAnalyses([outgoingTrackId, ...candidateTrackIds]);

    const outputs = [];
    for (const candidateTrackId of candidateTrackIds) {
        const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
        const payload = await withMaterializedAudio(resolved);

        const outputName = `transition-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
        const jobId = await submitRender('TransitionCandidate', payload, outputName);
        const path = await waitForRender(jobId);

        outputs.push({ candidateTrackId, jobId, path });
    }

    return outputs;
};

// The full Backroom film: intro → analysis (synced to the outgoing track's
// audio) → the same transition → outro.
export const backroomFilm = async (
    outgoingTrackId: string,
    candidateTrackId: string,
    energyArc: EnergyArc,
) => {
    'use workflow';

    await ensureAnalyses([outgoingTrackId, candidateTrackId]);

    const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
    const payload = await withMaterializedAudio(resolved);

    const outputName = `backroom-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
    const jobId = await submitRender('Backroom', payload, outputName);
    const path = await waitForRender(jobId);

    return { outgoingTrackId, candidateTrackId, energyArc, jobId, path };
};

// Candidate discovery + the full film from a single track ID.
const pickBestCandidate = async (outgoingTrackId: string, energyArc: EnergyArc) => {
    'use step';
    const candidates = await fetchRankedCandidates(outgoingTrackId, energyArc, 5);
    if (candidates.length === 0) {
        throw new Error(`No analyzed transition candidates for ${outgoingTrackId}`);
    }
    return candidates[0];
};

export const backroomForTrack = async (outgoingTrackId: string, energyArc: EnergyArc = 'preserve') => {
    'use workflow';

    const best = await pickBestCandidate(outgoingTrackId, energyArc);
    const candidateTrackId = best.trackId;
    console.log(`Best candidate for ${outgoingTrackId}: ${candidateTrackId} (score ${best.score.toFixed(3)})`);

    return backroomFilm(outgoingTrackId, candidateTrackId, energyArc);
};
