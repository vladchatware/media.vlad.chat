import { sleep } from 'workflow';

import {
    rendererUrl,
    authHeaders,
} from './render';
import {
    type EnergyArc,
    resolveTransitionPayload,
} from '../src/transition-pipeline';

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
        const payload = await resolveTransitionPayload({
            outgoingTrackId,
            candidateTrackId,
            energyArc,
        });

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
