import { fetch as fetchWorkflow } from 'workflow';

import {
  type EnergyArc,
  resolveTransitionPayload,
} from '../src/transition-pipeline';

const renderTransition = async (
  outgoingTrackId: string,
  candidateTrackId: string,
  energyArc: EnergyArc,
) => {
  'use step';

  const payload = await resolveTransitionPayload({
    outgoingTrackId,
    candidateTrackId,
    energyArc,
  });
  const outputName = `transition-${outgoingTrackId}-to-${candidateTrackId}-${energyArc}.mp4`;
  const response = await fetchWorkflow('http://localhost:3001/api/render', {
    method: 'POST',
    body: JSON.stringify({
      id: 'BackroomTransitionOnly',
      inputProps: { payload },
      outputName,
      type: 'video',
    }),
  });
  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.error ?? `Render failed for ${candidateTrackId}`);
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
    outputs.push(
      await renderTransition(outgoingTrackId, candidateTrackId, energyArc),
    );
  }
  return outputs;
};
