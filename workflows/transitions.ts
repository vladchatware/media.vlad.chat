import { head, put } from '@vercel/blob';
import { sleep } from 'workflow';

import { video as renderVideo } from './render';
import {
    type EnergyArc,
    MUSIC_ORIGIN,
    type TransitionPayload,
    fetchFullAudioBytes,
    fetchRankedCandidates,
    missingAnalyses,
    resolveTransitionPayload,
} from '../remotion/Backroom/payload';

// --- Analysis ---------------------------------------------------------------
// music.vlad.chat owns the analysis pipeline. Media asks its service API to
// enqueue missing tracks (`POST /api/analysis/enqueue`, authenticated with the
// shared ANALYSIS_SERVICE_SECRET); music performs the Convex bookkeeping and
// publishes the queue messages with correctly-scoped credentials. Queue
// visibility is partitioned by the publisher token's project claim, so
// publishing from here would strand messages the analysis worker can never
// see. There is no completion webhook: workflows poll readiness on a bounded
// loop (`missingAnalyses` reads music's public analysis endpoint).

const ANALYSIS_POLL_INTERVAL_MS = 30_000;
const ANALYSIS_POLL_ATTEMPTS = 120; // 60 min ceiling

type AnalysisSchedule = { ready: boolean };

const scheduleAnalyses = async (trackIds: string[]) => {
    'use step';
    const missing = await missingAnalyses(trackIds);
    if (missing.length === 0) return { ready: true } satisfies AnalysisSchedule;

    const secret = process.env.ANALYSIS_SERVICE_SECRET || '';
    if (!secret) throw new Error('ANALYSIS_SERVICE_SECRET is required for analysis scheduling');
    const response = await fetch(`${MUSIC_ORIGIN}/api/analysis/enqueue`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
        body: JSON.stringify({ trackIds: missing, priority: 100 }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
        throw new Error(`Analysis enqueue failed (${response.status}) for ${missing.join(', ')}`);
    }
    return { ready: false } satisfies AnalysisSchedule;
};

const missingAnalysisIds = async (trackIds: string[]) => {
    'use step';
    return { missing: await missingAnalyses(trackIds) };
};

const waitForAnalyses = async (trackIds: string[]) => {
    for (let attempt = 0; attempt < ANALYSIS_POLL_ATTEMPTS; attempt++) {
        await sleep(ANALYSIS_POLL_INTERVAL_MS);
        const { missing } = await missingAnalysisIds(trackIds);
        if (missing.length === 0) return;
    }
    throw new Error(
        `Analyses not ready after ${Math.round((ANALYSIS_POLL_ATTEMPTS * ANALYSIS_POLL_INTERVAL_MS) / 60_000)} min: ${trackIds.join(', ')}`,
    );
};

// --- Render -----------------------------------------------------------------

const MEDIA_ORIGIN = (process.env.MEDIA_ORIGIN || 'https://media.vlad.chat').trim().replace(/\/+$/, '');

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

// --- Workflows --------------------------------------------------------------
// One composition for the whole transition: approach → blend → post-roll,
// audio-matched to each pair's best transition window.

export const transitionBatch = async (
    outgoingTrackId: string,
    candidateTrackIds: string[],
    energyArc: EnergyArc,
) => {
    'use workflow';

    const trackIds = [outgoingTrackId, ...candidateTrackIds];
    const schedule = await scheduleAnalyses(trackIds);
    if (!schedule.ready) await waitForAnalyses(trackIds);

    const outputs = [];
    for (const candidateTrackId of candidateTrackIds) {
        const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
        // Sequential materialization avoids racing SoundCloud's single-use
        // refresh-token rotation when both cached access tokens have expired.
        const outgoingAudioFile = await materializeAudio(outgoingTrackId);
        const incomingAudioFile = await materializeAudio(candidateTrackId);
        const payload = withMaterializedAudio(resolved, outgoingAudioFile, incomingAudioFile);
        const outputName = `transition-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
        const render = await renderVideo(
            'TransitionCandidate',
            { outgoingTrackId, candidateTrackId, energyArc, payload },
            outputName,
        );

        outputs.push({
            candidateTrackId,
            jobId: render.jobId,
            path: render.path,
            blobUrl: render.url,
            url: render.pathname ? `${MEDIA_ORIGIN}/public/${render.pathname}` : render.url,
        });
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

    const trackIds = [outgoingTrackId, candidateTrackId];
    const schedule = await scheduleAnalyses(trackIds);
    if (!schedule.ready) await waitForAnalyses(trackIds);

    const resolved = await resolvePayload(outgoingTrackId, candidateTrackId, energyArc);
    const outgoingAudioFile = await materializeAudio(outgoingTrackId);
    const incomingAudioFile = await materializeAudio(candidateTrackId);
    const payload = withMaterializedAudio(resolved, outgoingAudioFile, incomingAudioFile);
    const outputName = `backroom-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
    const render = await renderVideo(
        'Backroom',
        { outgoingTrackId, candidateTrackId, energyArc, payload },
        outputName,
    );

    return {
        outgoingTrackId,
        candidateTrackId,
        energyArc,
        jobId: render.jobId,
        path: render.path,
        blobUrl: render.url,
        url: render.pathname ? `${MEDIA_ORIGIN}/public/${render.pathname}` : render.url,
    };
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

    const outgoingSchedule = await scheduleAnalyses([outgoingTrackId]);
    if (!outgoingSchedule.ready) await waitForAnalyses([outgoingTrackId]);

    const best = await pickBestCandidate(outgoingTrackId, energyArc);
    const candidateTrackId = best.trackId;
    console.log(`Best candidate for ${outgoingTrackId}: ${candidateTrackId} (score ${best.score.toFixed(3)})`);

    const candidateSchedule = await scheduleAnalyses([outgoingTrackId, candidateTrackId]);
    if (!candidateSchedule.ready) await waitForAnalyses([outgoingTrackId, candidateTrackId]);

    return backroomFilm(outgoingTrackId, candidateTrackId, energyArc);
};
