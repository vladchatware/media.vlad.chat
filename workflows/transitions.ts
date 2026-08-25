import { sleep } from 'workflow';
import { head, put } from '@vercel/blob';

import {
    rendererUrl,
    authHeaders,
} from './render';
import {
    type EnergyArc,
    MUSIC_ORIGIN,
    type TransitionPayload,
    resolveTransitionPayload,
} from '../remotion/BackroomFilm/payload';

// Materialize a track's audio as a composition-owned Blob asset so renders
// never depend on the shared stream route (dedup per track ID).
const materializeAudio = async (trackId: string) => {
    'use step';

    const pathname = `backroom-audio/${trackId}.mp3`;
    try {
        const existing = await head(pathname);
        return existing.downloadUrl ?? existing.url;
    } catch {
        // Not stored yet — fetch and upload below.
    }

    const response = await fetch(`${MUSIC_ORIGIN}/api/tracks/${trackId}/stream`, {
        redirect: 'follow',
    });
    if (!response.ok || !response.body) {
        throw new Error(`Audio request failed (${response.status}) for ${trackId}`);
    }

    const blob = await put(pathname, response.body, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
    });
    return blob.url;
};

const withMaterializedAudio = async (
    payload: TransitionPayload,
): Promise<TransitionPayload> => {
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

const submitTransitionRender = async (id: string, payload: unknown, outputName: string) => {
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

const getTransitionRenderStatus = async (jobId: string) => {
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

export const transitionBatch = async (
    outgoingTrackId: string,
    candidateTrackIds: string[],
    energyArc: EnergyArc,
) => {
    'use workflow';

    const outputs = [];
    for (const candidateTrackId of candidateTrackIds) {
        const resolved = await resolveTransitionPayload({
            outgoingTrackId,
            candidateTrackId,
            energyArc,
        });
        const payload = await withMaterializedAudio(resolved);

        const outputName = `transition-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
        const jobId = await submitTransitionRender('BackroomTransitionOnly', payload, outputName);

        let result = null;
        for (let attempt = 0; attempt < 120; attempt++) {
            await sleep(5000);

            result = await getTransitionRenderStatus(jobId);

            if (result.status === 'done') {
                if (!result.path) {
                    throw new Error(`Render completed without output path: ${jobId}`);
                }
                outputs.push({ candidateTrackId, jobId, path: result.path });
                break;
            }
            if (result.status === 'error') {
                throw new Error(result.error || `Render failed for ${candidateTrackId}`);
            }
        }
        if (result?.status !== 'done') {
            throw new Error(`Render timed out: ${jobId}`);
        }
    }

    return outputs;
};
