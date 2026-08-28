import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import {
  Artwork,
  Chrome,
  CueBlock,
  EnergyChart,
  MetricStrip,
  Paper,
  PhoneCanvas,
  ScoreBars,
  SectionRail,
  TagGrid,
} from './components';
import {
  TransitionCandidate,
  transitionDurationFromPayloadInFrames,
} from './TransitionCandidate';
import { COLORS, MONO, SERIF, clamp, formatClock, monoLabel, resolveAudioSrc } from './theme';
import { MASTER_VOLUME, transitionClock } from './timeline';
import {
  fetchBestSuggestion,
  resolveTransitionPayload,
  type EnergyArc,
  type TransitionPayload,
} from './payload';

// The Backroom film: one continuous piece of music.
//   intro → track analysis (visuals synced to the outgoing track's clock)
//   → the transition (embedded TransitionCandidate, same payload) → outro.
// Audio is owned HERE so the outgoing track plays uninterrupted under the
// analysis scenes and lands on its mix-out cue exactly when the blend begins.
// Scenes lay out at iPhone CSS scale (PhoneCanvas) to match the desk.

export type BackroomProps = {
  outgoingTrackId: string;
  candidateTrackId: string;
  energyArc?: EnergyArc;
  /** Renderer-hydrated payload. External callers only pass track IDs. */
  payload?: TransitionPayload;
};

// Scene timeline (seconds). The transition approach extends the runway.
const SCENES = [
  { name: 'INPUT', sec: 4 },
  { name: 'RECORD', sec: 4.5 },
  { name: 'STRUCTURE', sec: 5.5 },
  { name: 'BEHAVIOR', sec: 4 },
  { name: 'SEMANTICS', sec: 4.5 },
] as const;
const SCENES_SEC = SCENES.reduce((sum, s) => sum + s.sec, 0);
const TRANSITION_LEAD_IN_SEC = 2.5;
const POST_SEC = 5;
const OUTRO_SEC = 4.5;

// Total runway before the blend — the audio deadline anchor.
export const leadInSec = SCENES_SEC + TRANSITION_LEAD_IN_SEC;

// Sizing needs only the blend duration, so calculateMetadata fetches just the
// suggestion; the composition resolves the full payload itself.
export const backroomDurationInFrames = async (
  { outgoingTrackId, candidateTrackId, energyArc, payload }: BackroomProps,
  fps: number,
) => {
  const blendSec = payload
    ? payload.transition.blendSec
    : (await fetchBestSuggestion(outgoingTrackId, candidateTrackId, energyArc ?? 'preserve'))
        .wallDurationSec;
  return (
    Math.round(SCENES_SEC * fps) +
    Math.round((TRANSITION_LEAD_IN_SEC + blendSec + POST_SEC) * fps) +
    Math.round(OUTRO_SEC * fps)
  );
};

const sceneAt = (frame: number, fps: number): string => {
  let elapsed = 0;
  for (const scene of SCENES) {
    elapsed += scene.sec;
    if (frame / fps < elapsed) return scene.name;
  }
  return 'TRANSITION';
};

// Frame where each scene starts, derived from the table.
const sceneStart = (index: number, fps: number): number =>
  Math.round(SCENES.slice(0, index).reduce((sum, s) => sum + s.sec, 0) * fps);

const SceneHeading: React.FC<{ index: string; title: string }> = ({ index, title }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 14], [0, 1], {
    ...clamp,
    easing: (t) => 1 - (1 - t) ** 3,
  });
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', opacity: progress }}>
      <span style={{ color: COLORS.acid, fontSize: 8, ...monoLabel }}>{index}</span>
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: '-0.04em',
          margin: '0 0 0 10px',
        }}
      >
        {title}
      </h2>
    </div>
  );
};

const SceneBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ padding: '52px 16px 36px', color: COLORS.ink }}>{children}</AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Scenes (each a pure function of local frame + payload slices)
// ---------------------------------------------------------------------------

const IntroScene: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleReveal = spring({ frame, fps, durationInFrames: 34, config: { damping: 200 } });
  const { outgoing } = payload;
  const typed = Math.floor(interpolate(frame, [40, 74], [0, outgoing.id.length], clamp));

  return (
    <SceneBody>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: '-0.065em',
          lineHeight: 0.88,
          margin: '62px 0 22px',
          transform: `translateY(${(1 - titleReveal) * 18}px)`,
          opacity: titleReveal,
        }}
      >
        Read the record
        <br />
        before the room.
      </h1>
      <div style={{ marginTop: 40 }}>
        <div style={{ color: COLORS.muted, fontSize: 7, marginBottom: 7, ...monoLabel }}>
          Backroom / transition film — track ID
        </div>
        <div
          style={{
            height: 30,
            borderBottom: `1.5px solid ${COLORS.ink}`,
            display: 'flex',
            alignItems: 'center',
            fontFamily: MONO,
            fontSize: 15,
            letterSpacing: '0.16em',
            color: COLORS.lede,
          }}
        >
          {outgoing.id.slice(0, typed)}
          <span
            style={{
              width: 1.5,
              height: 15,
              marginLeft: 2,
              background: COLORS.acid,
              opacity: frame % 18 < 11 ? 1 : 0,
            }}
          />
        </div>
      </div>
    </SceneBody>
  );
};

const HeroScene: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { outgoing } = payload;
  const titleReveal = spring({ frame, fps, durationInFrames: 36, config: { damping: 200 } });

  return (
    <SceneBody>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 12 }}>
        <Artwork src={outgoing.artworkUrl ?? ''} size={110} frame={frame} />
        <div style={{ minWidth: 0, paddingTop: 4 }}>
          <small style={{ color: COLORS.muted, fontSize: 7.5, ...monoLabel }}>{outgoing.artist}</small>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: outgoing.title.length > 26 ? 24 : 28,
              letterSpacing: '-0.06em',
              lineHeight: 0.96,
              margin: '7px 0 0',
              transform: `translateY(${(1 - titleReveal) * 14}px)`,
              opacity: titleReveal,
            }}
          >
            {outgoing.title}
          </h1>
          <span
            style={{
              display: 'inline-block',
              marginTop: 11,
              border: `1px solid ${outgoing.analysisVersion ? COLORS.acid : COLORS.amber}`,
              color: outgoing.analysisVersion ? COLORS.acid : COLORS.amber,
              padding: '3px 5px',
              fontSize: 6.5,
              ...monoLabel,
            }}
          >
            {outgoing.analysisVersion ?? 'analysis pending'}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 26 }}>
        <MetricStrip
          metrics={[
            ['Tempo', outgoing.bpm ? `${outgoing.bpm.toFixed(1)} BPM` : '—'],
            ['Tonal center', outgoing.camelotKey ?? '—'],
            ['Duration', formatClock(outgoing.durationSec)],
            ['Mean energy', outgoing.meanEnergy != null ? `${Math.round(outgoing.meanEnergy * 100)}%` : '—'],
          ]}
        />
      </div>
    </SceneBody>
  );
};

const EnergyScene: React.FC<{ payload: TransitionPayload; clockAudioSec: number; blendInSec: number }> = ({
  payload,
  clockAudioSec,
  blendInSec,
}) => {
  const frame = useCurrentFrame();
  const { outgoing, windows } = payload;
  const reveal = interpolate(frame, [4, 60], [0, 1], {
    ...clamp,
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const playhead = Math.max(0, Math.min(1, clockAudioSec / outgoing.durationSec));

  return (
    <SceneBody>
      <SceneHeading index="01" title="Energy, structure & DJ map" />
      <div style={{ marginTop: 26, paddingTop: 10, overflow: 'hidden' }}>
        <EnergyChart
          values={outgoing.energy}
          color={COLORS.acid}
          height={150}
          reveal={reveal}
          playhead={playhead}
          window={{
            left: windows.outgoing.startSec / outgoing.durationSec,
            width: (windows.outgoing.endSec - windows.outgoing.startSec) / outgoing.durationSec,
          }}
        />
      </div>
      <div style={{ marginTop: 4 }}>
        <SectionRail track={outgoing} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '12px 0' }}>
        <strong style={{ fontFamily: MONO, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
          {formatClock(clockAudioSec)}
        </strong>
        <span style={{ color: COLORS.muted, fontSize: 6.5, ...monoLabel }}>
          mix out {formatClock(outgoing.mixOutSec)} · blend at {formatClock(windows.outgoing.startSec)} in {Math.max(0, blendInSec).toFixed(0)}s
        </span>
      </div>
      <CueBlock track={outgoing} />
    </SceneBody>
  );
};

const BehaviorScene: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  return (
    <SceneBody>
      <SceneHeading index="02" title="Behavioral profile" />
      <p style={{ color: COLORS.muted, fontSize: 8.5, marginTop: 9, ...monoLabel }}>
        Movement, emotional position, crowd-facing character.
      </p>
      <div style={{ marginTop: 26 }}>
        <ScoreBars behavior={payload.outgoing.behavior} frame={frame} />
      </div>
    </SceneBody>
  );
};

const SemanticScene: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  return (
    <SceneBody>
      <SceneHeading index="03" title="Semantic fingerprint" />
      <p style={{ color: COLORS.muted, fontSize: 8.5, marginTop: 9, ...monoLabel }}>
        Dominant evidence only. Low-signal classifier noise omitted.
      </p>
      <div style={{ marginTop: 22 }}>
        <TagGrid taxonomy={payload.outgoing.taxonomy} frame={frame} />
      </div>
    </SceneBody>
  );
};

const OutroScene: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, durationInFrames: 36, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        padding: '52px 16px 36px',
        color: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ color: COLORS.acid, fontSize: 8, ...monoLabel }}>
        Transition ready / score {Math.round(payload.transition.score * 100)}
      </div>
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '-0.06em',
          lineHeight: 0.92,
          margin: '18px 0 22px',
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 16}px)`,
        }}
      >
        Know what fits
        <br />
        before pressing play.
      </h2>
      <div
        style={{
          display: 'flex',
          borderTop: `1.5px solid ${COLORS.ink}`,
          paddingTop: 11,
          alignItems: 'center',
          gap: 12,
          opacity: interpolate(frame, [20, 40], [0, 1], clamp),
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <small style={{ color: COLORS.amber, fontSize: 6.5, ...monoLabel }}>
            NOW PLAYING · {payload.incoming.artist}
          </small>
          <strong
            style={{
              display: 'block',
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 4,
            }}
          >
            {payload.incoming.title}
          </strong>
        </div>
        <div
          style={{
            background: COLORS.acid,
            color: COLORS.cueInk,
            padding: '8px 10px',
            fontWeight: 700,
            fontSize: 7,
            whiteSpace: 'nowrap',
            ...monoLabel,
          }}
        >
          music.vlad.chat/backroom →
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ANALYSIS_SCENES = [
  { body: <IntroSceneName />, name: 'INPUT' },
];

// Placeholder removed — see scene sequence inside Backroom.
function IntroSceneName() {
  return null;
}

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

const BackroomFilm: React.FC<{ payload: TransitionPayload }> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const runwaySec = leadInSec;
  const transitionFrame = Math.round(runwaySec * fps);
  const clock = transitionClock(payload, frame, fps, runwaySec);

  // The outgoing track starts so its window start lands exactly on the blend;
  // if the runway outlasts the pre-cue audio, the track starts later instead
  // (silence under the intro).
  const outStartFrame = Math.max(0, Math.round((runwaySec - payload.windows.outgoing.startSec) * fps));
  const outTrimBefore = Math.max(0, Math.round((payload.windows.outgoing.startSec - runwaySec) * fps));

  const transitionCompDuration = transitionDurationFromPayloadInFrames(
    payload,
    TRANSITION_LEAD_IN_SEC,
    POST_SEC,
    fps,
  );
  const transitionStartFrame = Math.round(SCENES_SEC * fps);
  const outroFrame = transitionStartFrame + transitionCompDuration;

  const sceneBodies = [
    <IntroScene payload={payload} />,
    <HeroScene payload={payload} />,
    <EnergyScene
      payload={payload}
      clockAudioSec={clock.outSec}
      blendInSec={runwaySec - frame / fps}
    />,
    <BehaviorScene payload={payload} />,
    <SemanticScene payload={payload} />,
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, overflow: 'hidden' }}>
      <Sequence from={outStartFrame}>
        <Audio
          src={resolveAudioSrc(payload.outgoing.audioFile)}
          trimBefore={outTrimBefore}
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

      <Paper />

      <PhoneCanvas>
        {sceneBodies.map((body, index) => (
          <Sequence
            key={SCENES[index].name}
            from={sceneStart(index, fps)}
            durationInFrames={Math.round(SCENES[index].sec * fps)}
            premountFor={30}
          >
            {body}
          </Sequence>
        ))}

        <Sequence from={transitionStartFrame} durationInFrames={transitionCompDuration} premountFor={fps}>
          <TransitionCandidate
            payload={payload}
            outgoingTrackId={payload.outgoing.id}
            candidateTrackId={payload.incoming.id}
            leadInSec={TRANSITION_LEAD_IN_SEC}
            postSec={POST_SEC}
            embedded
          />
        </Sequence>

        <Sequence from={outroFrame} durationInFrames={Math.round(OUTRO_SEC * fps)} premountFor={30}>
          <OutroScene payload={payload} />
        </Sequence>

        <Chrome section={sceneAt(frame, fps)} progress={durationInFrames ? frame / durationInFrames : 0} />
      </PhoneCanvas>
    </AbsoluteFill>
  );
};

export const Backroom: React.FC<BackroomProps> = (props) => {
  const [payload, setPayload] = useState<TransitionPayload | null>(props.payload ?? null);

  useEffect(() => {
    if (props.payload) {
      setPayload(props.payload);
      return;
    }

    let alive = true;
    const handle = delayRender(
      `Resolving backroom payload for ${props.outgoingTrackId} → ${props.candidateTrackId}`,
    );
    resolveTransitionPayload({
      outgoingTrackId: props.outgoingTrackId,
      candidateTrackId: props.candidateTrackId,
      energyArc: props.energyArc ?? 'preserve',
    })
      .then((resolved) => {
        if (!alive) return;
        setPayload(resolved);
        continueRender(handle);
      })
      .catch((error) => cancelRender(error instanceof Error ? error : new Error(String(error))));
    return () => {
      alive = false;
    };
  }, [props.payload, props.outgoingTrackId, props.candidateTrackId, props.energyArc]);

  if (!payload) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }
  return <BackroomFilm payload={payload} />;
};
