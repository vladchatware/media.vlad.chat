import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getWaveformPortion, useAudioData } from '@remotion/media-utils';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import candidatePayloadsJson from './transition-candidates-2260180544.live.json';

export type TransitionPayload = {
  source: { page: string };
  outgoing: {
    id: string;
    artist: string;
    title: string;
    durationSec: number;
    audioFile: string;
    window: { startSec: number; endSec: number };
  };
  incoming: {
    id: string;
    artist: string;
    title: string;
    durationSec: number;
    audioFile: string;
    window: { startSec: number; endSec: number };
  };
  transition: {
    score: number;
    blendSec: number;
    incomingPlaybackRate: number;
    reasons: string[];
  };
};

const candidatePayloads = candidatePayloadsJson as Record<string, TransitionPayload>;
const DEFAULT_CANDIDATE_TRACK_ID = '719940274';

// Payloads carry absolute stream URLs; committed demo assets stay relative.
const resolveAudioSrc = (audioFile: string) =>
  /^https?:\/\//.test(audioFile) ? audioFile : staticFile(audioFile);
const getCandidatePayload = (candidateTrackId = DEFAULT_CANDIDATE_TRACK_ID) =>
  candidatePayloads[candidateTrackId] ?? candidatePayloads[DEFAULT_CANDIDATE_TRACK_ID];

export type TransitionCandidateProps = {
  leadInSec: number;
  postTransitionSec: number;
  transitionOnly?: boolean;
  candidateTrackId?: string;
  payload?: TransitionPayload;
};

// The outgoing cue is the deadline. This runway is built backwards from it:
// every analysis stop, every scroll move, and the final deck settle fits here.
const ANALYSIS_RUNWAY_SEC = 19.3;

export const TRANSITION_CANDIDATE_DEFAULT_PROPS: TransitionCandidateProps = {
  leadInSec: ANALYSIS_RUNWAY_SEC,
  postTransitionSec: 8.8,
  transitionOnly: false,
  candidateTrackId: DEFAULT_CANDIDATE_TRACK_ID,
};

export const TRANSITION_ONLY_DEFAULT_PROPS: TransitionCandidateProps = {
  leadInSec: 1.2,
  postTransitionSec: 8.8,
  transitionOnly: true,
  candidateTrackId: DEFAULT_CANDIDATE_TRACK_ID,
};

export const getTransitionCandidateDurationInFrames = (
  { leadInSec, postTransitionSec, candidateTrackId, payload }: TransitionCandidateProps,
  fps: number,
) =>
  Math.ceil(
    (leadInSec +
      (payload ?? getCandidatePayload(candidateTrackId)).transition.blendSec +
      postTransitionSec) *
      fps,
  );

const PAPER = '#0e100d';
const INK = '#e9eadf';
const ACID = '#d7ff3f';
const AMBER = '#ffb648';
const MONO = '"Courier New", Courier, monospace';

// Match Safari's CSS viewport, not the 591px downsampled screenshot width.
// iPhone renders the page at ~393 CSS px, then device pixels provide density.
const BROWSER_WIDTH = 393;
const BROWSER_HEIGHT = 14000;
const BROWSER_SCALE = 1080 / BROWSER_WIDTH;
const CANDIDATE_SCROLL = 0;
const METRICS_SCROLL = 1710;
const ENERGY_SCROLL = 2340;
const ENERGY_DETAIL_SCROLL = 2725;
const BEHAVIOR_SCROLL = 3780;
const SEMANTIC_SCROLL = 4300;
const SEMANTIC_DETAIL_SCROLL = 4785;
const DECK_SCROLL = 5450;
const INCOMING_FOCUS_SCROLL = 6080;
const OUT_PLAYHEAD_Y_AT_DECK = 1418;
const IN_PLAYHEAD_Y_AT_DECK = 2403;
const CHART_LEFT = 85;
const CHART_WIDTH = 910;
const ANALYSIS_SCROLL_KEYFRAMES = [
  [0, CANDIDATE_SCROLL],
  [2.8, CANDIDATE_SCROLL],
  [3.5, METRICS_SCROLL],
  [4.9, METRICS_SCROLL],
  [5.55, ENERGY_SCROLL],
  [7.75, ENERGY_SCROLL],
  [8.4, ENERGY_DETAIL_SCROLL],
  [9.9, ENERGY_DETAIL_SCROLL],
  [10.55, BEHAVIOR_SCROLL],
  [12.75, BEHAVIOR_SCROLL],
  [13.4, SEMANTIC_SCROLL],
  [15.6, SEMANTIC_SCROLL],
  [16.25, SEMANTIC_DETAIL_SCROLL],
  [17.65, SEMANTIC_DETAIL_SCROLL],
  [18.3, DECK_SCROLL],
  [ANALYSIS_RUNWAY_SEC, DECK_SCROLL],
] as const;

const chartX = (seconds: number, durationSec: number) =>
  CHART_LEFT + (seconds / durationSec) * CHART_WIDTH;
const waveformPath = (peaks: number[]) =>
  peaks
    .map((peak, index) => {
      const x = index + 0.5;
      const amplitude = Math.max(1.5, peak * 42);
      return `M${x.toFixed(1)} ${(50 - amplitude).toFixed(1)}V${(
        50 + amplitude
      ).toFixed(1)}`;
    })
    .join('');

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

const EmbeddedBackroom: React.FC<{ scroll: number; page: string }> = ({
  scroll,
  page,
}) => {
  const [handle] = useState(() => delayRender('Loading live music.vlad.chat backroom'));
  const continued = useRef(false);
  const onLoad = useCallback(() => {
    if (continued.current) return;
    continued.current = true;
    continueRender(handle);
  }, [handle]);

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        background: PAPER,
        colorScheme: 'dark',
      }}
    >
      <iframe
        src={page}
        title="Live Revibe Backroom"
        onLoad={onLoad}
        loading="eager"
        style={{
          width: BROWSER_WIDTH,
          height: BROWSER_HEIGHT,
          border: 0,
          pointerEvents: 'none',
          transformOrigin: 'top left',
          transform: `translateY(${-scroll * BROWSER_SCALE}px) scale(${BROWSER_SCALE})`,
          background: PAPER,
          colorScheme: 'dark',
        }}
      />
    </div>
  );
};

const Playhead: React.FC<{
  x: number;
  y: number;
  height: number;
  label: string;
  color: string;
  opacity: number;
}> = ({ x, y, height, label, color, opacity }) => (
  <div
    style={{
      position: 'absolute',
      zIndex: 80,
      left: x,
      top: y,
      width: 4,
      height,
      opacity,
      background: INK,
      boxShadow: `0 0 0 1px ${PAPER}`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: -7,
        top: -7,
        width: 16,
        height: 16,
        transform: 'rotate(45deg)',
        background: INK,
      }}
    />
    <span
      style={{
        position: 'absolute',
        left: 11,
        top: 34,
        padding: '7px 9px 6px',
        color: color === AMBER ? PAPER : INK,
        background: color,
        fontFamily: MONO,
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  </div>
);

const WaveformOverlay: React.FC<{
  peaks: number[];
  y: number;
  progress: number;
  startProgress?: number;
  color: string;
  opacity: number;
}> = ({ peaks, y, progress, startProgress = 0, color, opacity }) => {
  const path = waveformPath(peaks);
  const width = peaks.length;
  const startX = Math.max(0, Math.min(width, startProgress * width));
  const progressX = Math.max(startX, Math.min(width, progress * width));
  const id = color.replace('#', '');

  return (
    <svg
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        zIndex: 65,
        left: CHART_LEFT,
        top: y,
        width: CHART_WIDTH,
        height: 360,
        overflow: 'hidden',
        opacity,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    >
      <defs>
        <clipPath id={`wave-visible-${id}`}>
          <rect x={startX} width={width - startX} height="100" />
        </clipPath>
        <clipPath id={`wave-progress-${id}`}>
          <rect x={startX} width={progressX - startX} height="100" />
        </clipPath>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={INK}
        strokeWidth="0.55"
        vectorEffect="non-scaling-stroke"
        clipPath={`url(#wave-visible-${id})`}
        opacity="0.34"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.05"
        vectorEffect="non-scaling-stroke"
        clipPath={`url(#wave-progress-${id})`}
        opacity="0.92"
      />
    </svg>
  );
};

export const BackroomTransitionCandidate: React.FC<TransitionCandidateProps> = ({
  leadInSec,
  postTransitionSec,
  transitionOnly = false,
  candidateTrackId = DEFAULT_CANDIDATE_TRACK_ID,
  payload,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const livePayload = payload ?? getCandidatePayload(candidateTrackId);
  const OUT_START_SEC = livePayload.outgoing.window.startSec;
  const OUT_END_SEC = livePayload.outgoing.window.endSec;
  const IN_START_SEC = livePayload.incoming.window.startSec;
  const IN_END_SEC = livePayload.incoming.window.endSec;
  const BLEND_SEC = livePayload.transition.blendSec;
  const incomingPlaybackRate = livePayload.transition.incomingPlaybackRate;
  const transitionFrame = leadInSec * fps;
  const blendFrames = BLEND_SEC * fps;
  const runwayScale = leadInSec / ANALYSIS_RUNWAY_SEC;
  const focusStartSec = leadInSec + BLEND_SEC + Math.min(0.5, postTransitionSec * 0.15);
  const focusEndSec = Math.min(
    leadInSec + BLEND_SEC + postTransitionSec,
    focusStartSec + 1.1,
  );
  const scrollFrames = transitionOnly
    ? [0, focusStartSec * fps, focusEndSec * fps]
    : [
        ...ANALYSIS_SCROLL_KEYFRAMES.map(([seconds]) => seconds * runwayScale * fps),
        focusStartSec * fps,
        focusEndSec * fps,
      ];
  const scrollPositions = transitionOnly
    ? [DECK_SCROLL, DECK_SCROLL, INCOMING_FOCUS_SCROLL]
    : [
        ...ANALYSIS_SCROLL_KEYFRAMES.map(([, position]) => position),
        DECK_SCROLL,
        INCOMING_FOCUS_SCROLL,
      ];
  const scroll = interpolate(
    frame,
    scrollFrames,
    scrollPositions,
    {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    },
  );
  const progress = interpolate(
    frame,
    [transitionFrame, transitionFrame + blendFrames],
    [0, 1],
    clamp,
  );
  const deckOpacity = transitionOnly
    ? 1
    : interpolate(
        frame,
        [transitionFrame - 4, transitionFrame + 10],
        [0, 1],
        clamp,
      );
  const outX = interpolate(
    progress,
    [0, 1],
    [
      chartX(OUT_START_SEC, livePayload.outgoing.durationSec),
      chartX(OUT_END_SEC, livePayload.outgoing.durationSec),
    ],
    clamp,
  );
  const postBlendSec = Math.max(
    0,
    frame / fps - (leadInSec + BLEND_SEC),
  );
  const inX =
    interpolate(
      progress,
      [0, 1],
      [
        chartX(IN_START_SEC, livePayload.incoming.durationSec),
        chartX(IN_END_SEC, livePayload.incoming.durationSec),
      ],
      clamp,
    ) +
    postBlendSec * (CHART_WIDTH / livePayload.incoming.durationSec) *
      incomingPlaybackRate;
  const scrollOffset = (scroll - DECK_SCROLL) * BROWSER_SCALE;
  const outTime = OUT_START_SEC + progress * (OUT_END_SEC - OUT_START_SEC);
  const inTime =
    IN_START_SEC + progress * (IN_END_SEC - IN_START_SEC) + postBlendSec;
  const finalFade = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [0, 1],
    clamp,
  );
  const outgoingAudioSrc = resolveAudioSrc(livePayload.outgoing.audioFile);
  const incomingAudioSrc = resolveAudioSrc(livePayload.incoming.audioFile);
  const outgoingAudioData = useAudioData(outgoingAudioSrc);
  const incomingAudioData = useAudioData(incomingAudioSrc);
  const outgoingWaveform = useMemo(
    () =>
      outgoingAudioData
        ? getWaveformPortion({
            audioData: outgoingAudioData,
            startTimeInSeconds: 0,
            durationInSeconds: livePayload.outgoing.durationSec,
            numberOfSamples: 360,
            normalize: true,
          }).map(({ amplitude }) => amplitude)
        : [],
    [outgoingAudioData],
  );
  const incomingWaveform = useMemo(
    () =>
      incomingAudioData
        ? getWaveformPortion({
            audioData: incomingAudioData,
            startTimeInSeconds: 0,
            durationInSeconds: livePayload.incoming.durationSec,
            numberOfSamples: 360,
            normalize: true,
          }).map(({ amplitude }) => amplitude)
        : [],
    [incomingAudioData],
  );

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
      <Audio
        src={outgoingAudioSrc}
        trimBefore={Math.max(0, Math.round((OUT_START_SEC - leadInSec) * fps))}
        volume={(audioFrame) =>
          Math.cos(
            interpolate(
              audioFrame,
              [transitionFrame, transitionFrame + blendFrames],
              [0, Math.PI / 2],
              clamp,
            ),
          ) * 0.92
        }
      />
      <Sequence from={transitionFrame} premountFor={fps}>
        <Audio
          src={incomingAudioSrc}
          trimBefore={Math.round(IN_START_SEC * fps)}
          playbackRate={incomingPlaybackRate}
          volume={(audioFrame) =>
            Math.sin(
              interpolate(
                audioFrame,
                [0, blendFrames],
                [0, Math.PI / 2],
                clamp,
              ),
            ) * 0.92
          }
        />
      </Sequence>

      <EmbeddedBackroom scroll={scroll} page={livePayload.source.page} />
      <WaveformOverlay
        peaks={outgoingWaveform}
        y={OUT_PLAYHEAD_Y_AT_DECK - scrollOffset}
        progress={outTime / livePayload.outgoing.durationSec}
        color={ACID}
        opacity={deckOpacity}
      />
      <WaveformOverlay
        peaks={incomingWaveform}
        y={IN_PLAYHEAD_Y_AT_DECK - scrollOffset}
        progress={inTime / livePayload.incoming.durationSec}
        startProgress={IN_START_SEC / livePayload.incoming.durationSec}
        color={AMBER}
        opacity={deckOpacity}
      />
      <Playhead
        x={outX}
        y={OUT_PLAYHEAD_Y_AT_DECK - scrollOffset}
        height={448}
        label={time(outTime)}
        color={ACID}
        opacity={deckOpacity}
      />
      <Playhead
        x={inX}
        y={IN_PLAYHEAD_Y_AT_DECK - scrollOffset}
        height={420}
        label={time(inTime)}
        color={AMBER}
        opacity={deckOpacity}
      />

      <AbsoluteFill
        style={{
          zIndex: 200,
          pointerEvents: 'none',
          background: PAPER,
          opacity: finalFade,
        }}
      />
    </AbsoluteFill>
  );
};
