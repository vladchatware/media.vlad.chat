import { sleep } from 'workflow';
import { head, put } from '@vercel/blob';
import { basename } from 'path';

import {
    rendererUrl,
    authHeaders,
} from './render';
import {
    type EnergyArc,
    type TransitionPayload,
    fetchFullAudioBytes,
    fetchRankedCandidates,
    missingAnalyses,
    resolveTransitionPayload,
} from '../remotion/Backroom/payload';

// --- Analysis ---------------------------------------------------------------
// Never polled. Missing analyses are enqueued once with a callbackUrl; the
// worker POSTs that URL when the analysis completes (or dies), and the
// callback endpoint re-runs this workflow. One enqueue call per run — no
// repeated Convex reads.

const MEDIA_ORIGIN = (process.env.MEDIA_ORIGIN || 'https://media.vlad.chat').trim().replace(/\/+$/, '');
const CALLBACK_SECRET = process.env.ANALYSIS_SERVICE_SECRET || '';
const CONVEX_SITE_URL = (process.env.CONVEX_SITE_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
const SERVICE_SECRET = process.env.ANALYSIS_SERVICE_SECRET || '';

const ensureScheduled = async (trackIds: string[], callbackUrl: string) => {
    'use step';
    const missing = await missingAnalyses(trackIds);
    if (missing.length === 0) return { ready: true };

    if (!CONVEX_SITE_URL || !SERVICE_SECRET) {
        throw new Error('CONVEX_SITE_URL / ANALYSIS_SERVICE_SECRET not configured');
    }
    const res = await fetch(`${CONVEX_SITE_URL}/analysis/enqueue`, {
        method: 'POST',
        headers: { authorization: `Bearer ${SERVICE_SECRET}`, 'content-type': 'application/json' },
        body: JSON.stringify({ trackIds: missing, callbackUrl }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Analysis enqueue failed (${res.status})`);
    const result = await res.json() as { enqueued: number; existing: number };
    // enqueued > 0 or existing > 0 → at least one analysis is not ready yet.
    return { ready: result.enqueued === 0 && result.existing === 0 };
};

// --- Render -----------------------------------------------------------------

const resolvePayload = async (
    outgoingTrackId: string,
    candidateTrackId: string,
    energyArc: EnergyArc,
) => {
    'use step';
    return resolveTransitionPayload({ outgoingTrackId, candidateTrackId, energyArc });
};

const materializeAudio = async (trackId: string) => {
    'use step';

    const pathname = `backroom-audio/${trackId}-full.mp3`;
    try {
        const existing = await head(pathname);
        return existing.downloadUrl ?? existing.url;
    } catch {
        // Missing from Blob; resolve SoundCloud HLS and upload below.
    }

    const bytes = await fetchFullAudioBytes(trackId);
    try {
        const blob = await put(pathname, bytes, {
            access: 'public',
            contentType: 'audio/mpeg',
            addRandomSuffix: false,
        });
        return blob.downloadUrl ?? blob.url;
    } catch (error) {
        // Concurrent workflow may have won the deterministic-path upload.
        try {
            const existing = await head(pathname);
            return existing.downloadUrl ?? existing.url;
        } catch {
            throw error;
        }
    }
};

const withMaterializedAudio = (
    payload: TransitionPayload,
    outgoingAudioFile: string,
    incomingAudioFile: string,
): TransitionPayload => ({
    ...payload,
    outgoing: { ...payload.outgoing, audioFile: outgoingAudioFile },
    incoming: { ...payload.incoming, audioFile: incomingAudioFile },
});

const submitRender = async (
    id: string,
    inputProps: Record<string, unknown>,
    outputName: string,
) => {
    'use step';

    const response = await fetch(`${rendererUrl}/api/render`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id, inputProps, outputName, type: 'video' }),
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

const uploadRender = async (path: string) => {
    'use step';

    const response = await fetch(`${rendererUrl}/api/file?path=${encodeURIComponent(path)}`, {
        headers: authHeaders(),
    });
    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch rendered file (${response.status}): ${path}`);
    }

    const blob = await put(`renders/backroom/${basename(path)}`, response.body, {
        access: 'public',
        addRandomSuffix: true,
    });
    return {
        blobUrl: blob.url,
        url: `${MEDIA_ORIGIN}/public/${blob.pathname}`,
    };
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

    const callbackUrl = `${MEDIA_ORIGIN}/api/analysis-callback?mode=batch&outgoingTrackId=${outgoingTrackId}&candidateTrackIds=${candidateTrackIds.join(',')}&arc=${energyArc}&key=${CALLBACK_SECRET}`;
    const schedule = await ensureScheduled([outgoingTrackId, ...candidateTrackIds], callbackUrl);
    if (!schedule.ready) {
        return { status: 'scheduled' as const, message: 'Analyses enqueued — the render starts automatically when they complete', waitingOn: callbackUrl };
    }

    const outputs = [];
    for (const candidateTrackId of candidateTrackIds) {
        const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
        // Sequential materialization avoids racing SoundCloud's single-use
        // refresh-token rotation when both cached access tokens have expired.
        const outgoingAudioFile = await materializeAudio(outgoingTrackId);
        const incomingAudioFile = await materializeAudio(candidateTrackId);
        const payload = withMaterializedAudio(resolved, outgoingAudioFile, incomingAudioFile);
        const outputName = `transition-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
        const jobId = await submitRender(
            'TransitionCandidate',
            { outgoingTrackId, candidateTrackId, energyArc, payload },
            outputName,
        );
        const path = await waitForRender(jobId);
        const uploaded = await uploadRender(path);

        outputs.push({ candidateTrackId, jobId, path, ...uploaded });
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

    const callbackUrl = `${MEDIA_ORIGIN}/api/analysis-callback?mode=film&outgoingTrackId=${outgoingTrackId}&candidateTrackId=${candidateTrackId}&arc=${energyArc}&key=${CALLBACK_SECRET}`;
    const schedule = await ensureScheduled([outgoingTrackId, candidateTrackId], callbackUrl);
    if (!schedule.ready) {
        return { status: 'scheduled' as const, message: 'Analyses enqueued — the render starts automatically when they complete', waitingOn: callbackUrl };
    }

    const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
    const outgoingAudioFile = await materializeAudio(outgoingTrackId);
    const incomingAudioFile = await materializeAudio(candidateTrackId);
    const payload = withMaterializedAudio(resolved, outgoingAudioFile, incomingAudioFile);
    const outputName = `backroom-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
    const jobId = await submitRender(
        'Backroom',
        { outgoingTrackId, candidateTrackId, energyArc, payload },
        outputName,
    );
    const path = await waitForRender(jobId);
    const uploaded = await uploadRender(path);

    return { outgoingTrackId, candidateTrackId, energyArc, jobId, path, ...uploaded };
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

    const callbackUrl = `${MEDIA_ORIGIN}/api/analysis-callback?mode=film&outgoingTrackId=${outgoingTrackId}&arc=${energyArc}&key=${CALLBACK_SECRET}`;
    const schedule = await ensureScheduled([outgoingTrackId], callbackUrl);
    if (!schedule.ready) {
        return { status: 'scheduled' as const, message: 'Outgoing analysis enqueued — candidate discovery and render start automatically when it completes' };
    }

    const best = await pickBestCandidate(outgoingTrackId, energyArc);
    const candidateTrackId = best.trackId;
    console.log(`Best candidate for ${outgoingTrackId}: ${candidateTrackId} (score ${best.score.toFixed(3)})`);

    const candidateSchedule = await ensureScheduled(
        [outgoingTrackId, candidateTrackId],
        `${MEDIA_ORIGIN}/api/analysis-callback?mode=film&outgoingTrackId=${outgoingTrackId}&candidateTrackId=${candidateTrackId}&arc=${energyArc}&key=${CALLBACK_SECRET}`,
    );
    if (!candidateSchedule.ready) {
        return { status: 'scheduled' as const, message: `Candidate ${candidateTrackId} analysis enqueued — render starts automatically when it completes` };
    }

    return backroomFilm(outgoingTrackId, candidateTrackId, energyArc);
};
