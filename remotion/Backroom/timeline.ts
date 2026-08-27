import { interpolate } from 'remotion';

import { clamp, equalPower } from './theme';
import type { TransitionPayload } from './payload';

// Pure timeline math shared by the Backroom film and the TransitionCandidate
// composition. No React, no side effects — frame in, media state out.

export const MASTER_VOLUME = 0.9;

export type TransitionClock = {
  /** 0..1 blend progress */
  progress: number;
  /** equal-power gains for the crossfade */
  gains: { outgoing: number; incoming: number };
  /** true between blend start and blend end */
  inBlend: boolean;
  /** outgoing deck position in seconds (runs to its cue during approach) */
  outSec: number;
  /** incoming deck position in seconds (window traverse + post-roll) */
  inSec: number;
  /** section label for chrome/overlays */
  section: 'APPROACH' | 'BLEND' | 'INCOMING';
  /** static per-frame volume numbers (deterministic across Sequence offsets) */
  outVolume: number;
  inVolume: number;
};

export const transitionClock = (
  payload: TransitionPayload,
  frame: number,
  fps: number,
  /** seconds of runway before the blend begins (local frame 0 = blend − leadIn) */
  leadInSec: number,
): TransitionClock => {
  const { windows, transition } = payload;
  const blendSec = transition.blendSec;
  const transitionFrame = Math.round(leadInSec * fps);
  const blendFrames = Math.round(blendSec * fps);

  const progress = interpolate(frame, [transitionFrame, transitionFrame + blendFrames], [0, 1], clamp);
  const gains = equalPower(progress);
  const inBlend = frame >= transitionFrame && frame <= transitionFrame + blendFrames;

  const { outgoing, incoming } = windows;
  const outSec = Math.max(
    0,
    Math.min(payload.outgoing.durationSec, outgoing.startSec - (transitionFrame - frame) / fps),
  );
  const postElapsed = Math.max(0, (frame - transitionFrame - blendFrames) / fps);
  const inSec =
    frame < transitionFrame
      ? incoming.startSec
      : incoming.startSec + progress * (incoming.endSec - incoming.startSec) + postElapsed * transition.incomingPlaybackRate;

  const section = frame < transitionFrame ? 'APPROACH' : inBlend ? 'BLEND' : 'INCOMING';

  return {
    progress,
    gains,
    inBlend,
    outSec,
    inSec,
    section,
    outVolume: frame < transitionFrame ? MASTER_VOLUME : inBlend ? gains.outgoing * MASTER_VOLUME : 0,
    inVolume: inBlend ? gains.incoming * MASTER_VOLUME : frame > transitionFrame ? MASTER_VOLUME : 0,
  };
};

// The outgoing deck clock freezes at its window end once the blend finishes.
export const outClock = (clock: TransitionClock, payload: TransitionPayload): number =>
  clock.outSec < payload.windows.outgoing.endSec || clock.inBlend ? clock.outSec : payload.windows.outgoing.endSec;
