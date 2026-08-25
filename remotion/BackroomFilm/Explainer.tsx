import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FPS = 30;
export const EXPLAINER_DURATION_IN_FRAMES = 32 * FPS;

const PAPER = '#efeee6';
const INK = '#171811';
const GREEN = '#5d720b';
const ACID = '#d0ff2f';
const MONO = '"Courier New", Courier, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

type Shot = {
  start: number;
  end: number;
  src: string;
  eyebrow: string;
  title: string;
  focus: string;
  direction: 1 | -1;
};

const shots: Shot[] = [
  {
    start: 0,
    end: 4.1,
    src: 'backroom-2355356972-0.png',
    eyebrow: '01 / INPUT',
    title: 'BPM + key tell only part of the story.',
    focus: 'One analyzed SoundCloud track',
    direction: 1,
  },
  {
    start: 4.1,
    end: 13.65,
    src: 'backroom-2355356972-900.png',
    eyebrow: '02 / MOVEMENT',
    title: 'Structure. Energy. Mix points.',
    focus: 'Low-end entrance / 3.50s',
    direction: -1,
  },
  {
    start: 13.65,
    end: 24.52,
    src: 'backroom-2355356972-1800.png',
    eyebrow: '03 / SEMANTICS',
    title: 'Mood and instrumentation become evidence.',
    focus: 'Dominant signal only',
    direction: 1,
  },
  {
    start: 24.52,
    end: 27.41,
    src: 'backroom-2355356972-2700.png',
    eyebrow: '04 / JUDGMENT',
    title: 'Not an automatic DJ.',
    focus: 'Candidates, not commandments',
    direction: -1,
  },
  {
    start: 27.41,
    end: 32,
    src: 'backroom-2355356972-3523.png',
    eyebrow: '05 / READY',
    title: 'A prepared track. Ready for your judgment.',
    focus: 'music.vlad.chat',
    direction: 1,
  },
];

const captions = [
  { start: 0, end: 3.54, text: 'A BPM and key only tell you part of the story.' },
  { start: 4.1, end: 6.67, text: 'Backroom analyzes how a track moves:' },
  {
    start: 7.15,
    end: 13.16,
    text: 'its structure, energy, mood, instrumentation, and possible mix points.',
  },
  { start: 13.65, end: 16.48, text: 'Audio tagging adds semantic evidence,' },
  {
    start: 16.68,
    end: 24.04,
    text: 'while timing analysis finds the moments that matter—like a buildup, breakdown, or low-end entrance.',
  },
  { start: 24.52, end: 26.96, text: "The result isn't an automatic DJ." },
  { start: 27.41, end: 30.72, text: "It's a prepared track, ready for your judgment." },
] as const;

const DashboardScene: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = Math.round((shot.end - shot.start) * fps);
  const enter = interpolate(frame, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(frame, [duration - 9, duration], [1, 0], clamp);
  const progress = interpolate(frame, [0, duration], [0, 1], clamp);
  const scale = interpolate(progress, [0, 1], [1.01, 1.035], clamp);
  const x = interpolate(progress, [0, 1], [shot.direction * -7, shot.direction * 7], clamp);
  const titleY = interpolate(enter, [0, 1], [30, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, opacity: Math.min(enter, exit), overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `perspective(1800px) translateX(${x}px) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <Img
          src={staticFile(shot.src)}
          style={{ width: '100%', height: '100%', objectFit: 'fill' }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 54,
          top: 52,
          width: 690,
          padding: '22px 26px 24px',
          background: 'rgba(239,238,230,.94)',
          borderTop: `3px solid ${GREEN}`,
          boxShadow: '12px 12px 0 rgba(23,24,17,.08)',
          transform: `translateY(${titleY}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: GREEN,
            marginBottom: 12,
          }}
        >
          {shot.eyebrow}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 44,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: INK,
          }}
        >
          {shot.title}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 16,
            background: ACID,
            color: INK,
            padding: '8px 11px 7px',
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {shot.focus}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BurnedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const caption = captions.find((item) => seconds >= item.start && seconds < item.end);

  if (!caption) {
    return null;
  }

  const local = frame - Math.round(caption.start * FPS);
  const opacity = interpolate(local, [0, 5], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 30,
        left: '50%',
        bottom: 42,
        width: 1260,
        transform: `translateX(-50%) translateY(${(1 - opacity) * 10}px)`,
        opacity,
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'inline',
          padding: '10px 16px 12px',
          backgroundColor: 'rgba(23,24,17,.92)',
          color: '#faf9f2',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.45,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          boxShadow: '8px 0 rgba(23,24,17,.92), -8px 0 rgba(23,24,17,.92)',
        }}
      >
        {caption.text}
      </span>
    </div>
  );
};

const Header: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      zIndex: 31,
      right: 46,
      top: 34,
      padding: '10px 13px 9px',
      border: '1px solid rgba(23,24,17,.25)',
      background: 'rgba(239,238,230,.84)',
      color: INK,
      fontFamily: MONO,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}
  >
    REVIBE / BACKROOM
  </div>
);

export const BackroomNarratedExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [EXPLAINER_DURATION_IN_FRAMES - 18, EXPLAINER_DURATION_IN_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: 'hidden' }}>
      <Audio
        src={staticFile('track-2355356972.mp3')}
        trimBefore={10}
        volume={(audioFrame) => {
          const intro = interpolate(audioFrame, [0, 12], [0, 0.09], clamp);
          const outro = interpolate(
            audioFrame,
            [EXPLAINER_DURATION_IN_FRAMES - 40, EXPLAINER_DURATION_IN_FRAMES],
            [0.09, 0],
            clamp,
          );
          return Math.min(intro, outro);
        }}
      />
      <Audio src={staticFile('backroom-explainer-voice.wav')} volume={1} />

      {shots.map((shot) => (
        <Sequence
          key={shot.src}
          from={Math.round(shot.start * FPS)}
          durationInFrames={Math.round((shot.end - shot.start) * FPS)}
          premountFor={FPS}
        >
          <DashboardScene shot={shot} />
        </Sequence>
      ))}

      <Header />
      <BurnedCaptions />

      <AbsoluteFill
        style={{
          zIndex: 40,
          pointerEvents: 'none',
          backgroundColor: PAPER,
          opacity: fadeOut,
        }}
      />
    </AbsoluteFill>
  );
};
