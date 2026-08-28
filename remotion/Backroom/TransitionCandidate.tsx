import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { Chrome, Paper, PhoneCanvas, WaveformDeck } from './components';
import { COLORS, MONO, SERIF, clamp, formatClock, monoLabel, resolveAudioSrc } from './theme';
import { transitionClock, outClock } from './timeline';
import { resolveTransitionPayload, type EnergyArc, type TransitionPayload } from './payload';

// One composition for the whole transition:
//   approach (decks build, playheads run to their cue points)
//   → blend (equal-power crossfade, tempo-locked incoming)
//   → post-roll (incoming continues alone)
// Laid out as the page's "04 Mix suggestions" section at iPhone CSS scale,
// panning from the heading down to the ranked suggestion row.
// Rendered embedded inside the Backroom film it contributes visuals only —
// the film owns the audio so it stays continuous across scenes.

export type TransitionCandidateProps = {
  /** Render-ready payload. Omit to resolve from the track IDs at render time. */
  payload?: TransitionPayload;
  outgoingTrackId: string;
  candidateTrackId: string;
  energyArc?: EnergyArc;
  leadInSec?: number;
  postSec?: number;
  /** Visuals only, no own PhoneCanvas/chrome/audio — for embedding in the film. */
  embedded?: boolean;
};

const DEFAULT_LEAD_IN_SEC = 6;
const DEFAULT_POST_SEC = 6;
const PAGE_PADDING = 16;

export const transitionDurationInFrames = (
  { payload, leadInSec = DEFAULT_LEAD_IN_SEC, postSec = DEFAULT_POST_SEC }: TransitionCandidateProps,
  fps: number,
) => Math.ceil((leadInSec + payload.transition.blendSec + postSec) * fps);

const MetricCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: '7px 8px', borderRight: `1px solid ${COLORS.line}` }}>
    <small style={{ color: COLORS.muted, fontSize: 5.5, display: 'block', marginBottom: 4, ...monoLabel }}>
      {label}
    </small>
    <strong
      style={{
        fontFamily: SERIF,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </strong>
  </div>
);

const SuggestionRow: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const { outgoing, incoming } = payload.windows;
  return (
    <div
      style={{
        border: `1px solid ${COLORS.line}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
      }}
    >
      <span style={{ color: COLORS.acid, fontFamily: MONO, fontSize: 9, ...monoLabel }}>01</span>
      <div style={{ fontFamily: MONO, fontSize: 9, lineHeight: 1.7, ...monoLabel }}>
        <span>
          OUT {formatClock(outgoing.startSec)}–{formatClock(outgoing.endSec)}
        </span>
        <span style={{ display: 'block', color: COLORS.muted }}>
          IN {formatClock(incoming.startSec)}–{formatClock(incoming.endSec)}
        </span>
      </div>
      <strong
        style={{
          marginLeft: 'auto',
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 26,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(Math.round(payload.transition.score * 100))}
      </strong>
    </div>
  );
};

// The page section layout, in phone CSS px. Scrolls from the heading down to
// the ranked suggestion row.
const Desk: React.FC<{
  payload: TransitionPayload;
  outClock: number;
  inClock: number;
  frame: number;
  fps: number;
  scroll: number;
  scoreReveal: number;
}> = ({ payload, outClock, inClock, frame, fps, scroll, scoreReveal }) => {
  const { outgoing, incoming, windows, transition } = payload;
  const tempoDelta = (transition.incomingPlaybackRate - 1) * 100;
  const reveal = interpolate(frame, [4, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <div
      style={{
        // Scroll viewport between the topbar and footer — content slides
        // underneath both instead of overlapping them.
        position: 'absolute',
        left: 0,
        right: 0,
        top: 44,
        bottom: 36,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${-scroll}px)`,
        }}
      >
      <div style={{ padding: `0 ${PAGE_PADDING}px`, opacity: reveal }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, paddingLeft: 24 }}>
          <span style={{ color: COLORS.acid, fontFamily: MONO, fontSize: 10, ...monoLabel }}>04</span>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 38,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              margin: 0,
            }}
          >
            Mix suggestions
          </h2>
        </div>
        <p
          style={{
            color: COLORS.muted,
            fontFamily: MONO,
            fontSize: 8,
            letterSpacing: '0.22em',
            textAlign: 'center',
            margin: '10px 0 0',
            textTransform: 'uppercase',
          }}
        >
          Two source clocks. One shared transition window.
        </p>

        <div
          style={{
            border: `1px solid ${COLORS.line}`,
            marginTop: 22,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            minHeight: 64,
          }}
        >
          <span style={{ color: COLORS.ink, fontFamily: MONO, fontSize: 9.5, ...monoLabel }}>
            {payload.energyArc.toUpperCase()} ENERGY ARC
          </span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 9,
              fontFamily: MONO,
              fontSize: 8.5,
              ...monoLabel,
            }}
          >
            <span style={{ color: COLORS.muted }}>← All suggestions</span>
            <span style={{ color: COLORS.muted }}>DJ agent ↗</span>
            <span style={{ color: COLORS.acid }}>⇄ Swap direction</span>
          </div>
        </div>

        <div
          style={{
            background: COLORS.acid,
            color: COLORS.cueInk,
            display: 'grid',
            placeItems: 'center',
            height: 36,
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.22em',
            ...monoLabel,
          }}
        >
          ▶ Play transition
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderLeft: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          {(
            [
              ['Blend', `${transition.blendSec.toFixed(1)}s`],
              ['Tempo', `${tempoDelta >= 0 ? '+' : '−'}${Math.abs(tempoDelta).toFixed(1)}%`],
              ['Score', String(Math.round(transition.score * 100))],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} style={{ borderRight: `1px solid ${COLORS.line}`, padding: '9px 12px' }}>
              <small style={{ color: COLORS.muted, fontSize: 7, display: 'block', marginBottom: 4, ...monoLabel }}>
                {label}
              </small>
              <strong style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 23, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </strong>
            </div>
          ))}
        </div>

        <div
          style={{
            borderLeft: `1px solid ${COLORS.line}`,
            borderRight: `1px solid ${COLORS.line}`,
            borderBottom: `1px solid ${COLORS.line}`,
            padding: '9px 12px',
            fontFamily: MONO,
            fontSize: 7.5,
            lineHeight: 1.8,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
          }}
        >
          {transition.reasons.join(' · ')} · {payload.energyArc}
        </div>
      </div>

      <div style={{ padding: `14px ${PAGE_PADDING}px 0`, display: 'grid', gap: 14 }}>
        <WaveformDeck
          label="OUT"
          track={outgoing}
          color={COLORS.acid}
          positionSec={outClock}
          windowRange={windows.outgoing}
          reveal={interpolate(frame, [4, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })}
        />
        <WaveformDeck
          label="IN"
          track={incoming}
          color={COLORS.amber}
          positionSec={inClock}
          windowRange={windows.incoming}
          reveal={interpolate(frame, [16, 48], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })}
        />
      </div>

      <div style={{ padding: `14px ${PAGE_PADDING}px 40px`, opacity: scoreReveal }}>
        <div style={{ height: 3, background: COLORS.acid, marginBottom: 12 }} />
        <SuggestionRow payload={payload} />
      </div>
      </div>
    </div>
  );
};

export const TransitionCandidate: React.FC<TransitionCandidateProps> = ({
  payload,
  leadInSec = DEFAULT_LEAD_IN_SEC,
  postSec = DEFAULT_POST_SEC,
  embedded = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const clock = transitionClock(payload, frame, fps, leadInSec);

  const transitionFrame = Math.round(leadInSec * fps);
  const scoreReveal = spring({
    frame: frame - transitionFrame,
    fps,
    durationInFrames: 40,
    config: { damping: 200 },
  });

  // Pan through the section: heading → OUT deck during the approach, then
  // down to frame BOTH decks as the blend begins, settling on the ranked
  // suggestion row shortly after the blend ends.
  const blendFrame = Math.round(leadInSec * fps);
  const blendEndFrame = blendFrame + Math.round(payload.transition.blendSec * fps);
  const settleFrame = blendEndFrame + 2 * fps;
  const scroll = interpolate(
    frame,
    [0, blendFrame - 0.8 * fps, blendFrame + 0.4 * fps, settleFrame],
    [0, 130, 400, 440],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );

  const desk = (
    <Desk
      payload={payload}
      outClock={outClock(clock, payload)}
      inClock={clock.inSec}
      frame={frame}
      fps={fps}
      scroll={scroll}
      scoreReveal={scoreReveal}
    />
  );

  return (
    <AbsoluteFill style={{ background: COLORS.paper, color: COLORS.ink, overflow: 'hidden' }}>
      {!embedded ? (
        <>
          <Sequence from={Math.max(0, Math.round((leadInSec - payload.windows.outgoing.startSec) * fps))}>
            <Audio
              src={resolveAudioSrc(payload.outgoing.audioFile)}
              trimBefore={Math.max(0, Math.round((payload.windows.outgoing.startSec - leadInSec) * fps))}
              volume={clock.outVolume}
            />
          </Sequence>
          <Sequence from={transitionFrame} premountFor={fps}>
            <Audio
              src={resolveAudioSrc(payload.incoming.audioFile)}
              trimBefore={Math.round(payload.windows.incoming.startSec * fps)}
              playbackRate={payload.transition.incomingPlaybackRate}
              volume={clock.inVolume}
            />
          </Sequence>
        </>
      ) : null}

      <Paper />

      {embedded ? (
        desk
      ) : (
        <PhoneCanvas>
          {desk}
          <Chrome section="TRANSITION" progress={durationInFrames ? frame / durationInFrames : 0} />
        </PhoneCanvas>
      )}


      <AbsoluteFill
        style={{
          background: COLORS.paper,
          opacity: interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], clamp),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
