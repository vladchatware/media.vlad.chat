import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import {
  BEHAVIOR,
  COLORS,
  DURATION_IN_FRAMES,
  INCOMING_ENERGY,
  INCOMING_TRACK,
  OUTGOING_ENERGY,
  TAXONOMY,
  TRACK,
} from './data';

const serif = 'Georgia, "Times New Roman", serif';
const mono = '"Courier New", Courier, monospace';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const monoLabel: React.CSSProperties = {
  fontFamily: mono,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
};

const fade = (frame: number, duration: number, entrance = 14, exit = 18) => {
  const fadeIn = interpolate(frame, [0, entrance], [0, 1], clamp);
  if (exit === 0) return fadeIn;
  return Math.min(
    fadeIn,
    interpolate(frame, [duration - exit, duration], [1, 0], clamp),
  );
};

const lift = (frame: number, delay = 0, distance = 34) =>
  interpolate(frame, [delay, delay + 18], [distance, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const Paper: React.FC = () => {
  const frame = useCurrentFrame();
  const grainShift = frame % 3;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="backroom-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            seed={grainShift}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          filter: 'url(#backroom-grain)',
          opacity: 0.055,
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 47% 38%, rgba(255,255,255,.46), transparent 46%), linear-gradient(180deg, rgba(82,104,0,.025), transparent 32%, rgba(82,104,0,.018))',
        }}
      />
    </AbsoluteFill>
  );
};

const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const playhead = interpolate(frame, [0, DURATION_IN_FRAMES], [64, 1016], clamp);
  const section =
    frame < 105
      ? 'INPUT'
      : frame < 285
        ? 'STRUCTURE'
        : frame < 435
          ? 'BEHAVIOR'
          : frame < 540
            ? 'SEMANTICS'
            : frame < 705
              ? 'TRANSITION'
              : 'READY';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 48,
          height: 58,
          borderBottom: `1px solid ${COLORS.line}`,
          display: 'flex',
          alignItems: 'center',
          color: COLORS.ink,
          fontSize: 17,
          zIndex: 20,
          ...monoLabel,
        }}
      >
        <strong style={{ letterSpacing: '0.06em' }}>
          REVIBE <span style={{ color: COLORS.green }}>/ BACKROOM</span>
        </strong>
        <span style={{ marginLeft: 'auto', color: COLORS.muted }}>{section}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 50,
          height: 32,
          borderTop: `1px solid ${COLORS.line}`,
          color: COLORS.muted,
          fontSize: 13,
          zIndex: 20,
          ...monoLabel,
        }}
      >
        <span style={{ position: 'absolute', top: 12 }}>music.vlad.chat/backroom</span>
        <span style={{ position: 'absolute', top: 12, right: 0 }}>
          {String(Math.min(26, Math.floor(frame / 30) + 1)).padStart(2, '0')} / 26
        </span>
        <div
          style={{
            position: 'absolute',
            left: playhead - 64,
            top: -4,
            width: 8,
            height: 8,
            background: COLORS.green,
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    </>
  );
};

const Scene: React.FC<{
  duration: number;
  children: React.ReactNode;
  exit?: number;
}> = ({ duration, children, exit = 18 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: fade(frame, duration, 14, exit),
        color: COLORS.ink,
        padding: '138px 64px 105px',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleReveal = spring({
    frame,
    fps,
    durationInFrames: 34,
    config: { damping: 200 },
  });
  const typedLength = Math.floor(
    interpolate(frame, [48, 78], [0, TRACK.id.length], clamp),
  );
  const buttonFill = interpolate(frame, [77, 96], [0, 1], clamp);

  return (
    <Scene duration={duration}>
      <div
        style={{
          borderTop: `2px solid ${COLORS.green}`,
          paddingTop: 28,
          ...monoLabel,
          color: COLORS.green,
          fontSize: 18,
        }}
      >
        REVIBE / ANALYSIS DESK
      </div>
      <h1
        style={{
          fontFamily: serif,
          fontSize: 132,
          fontWeight: 400,
          letterSpacing: '-0.072em',
          lineHeight: 0.86,
          margin: '132px 0 58px',
          transform: `translateY(${(1 - titleReveal) * 54}px)`,
          opacity: titleReveal,
        }}
      >
        Read the record
        <br />
        before the room.
      </h1>
      <p
        style={{
          fontFamily: serif,
          fontSize: 33,
          lineHeight: 1.35,
          width: 820,
          margin: 0,
          color: '#4f5248',
          transform: `translateY(${lift(frame, 25, 22)}px)`,
          opacity: interpolate(frame, [25, 45], [0, 1], clamp),
        }}
      >
        Inspect timing, structure, emotion, texture, and DJ-safe entry points.
      </p>
      <div style={{ marginTop: 130 }}>
        <div
          style={{
            color: COLORS.muted,
            fontSize: 16,
            marginBottom: 18,
            ...monoLabel,
          }}
        >
          SoundCloud track ID
        </div>
        <div
          style={{
            height: 90,
            borderBottom: `2px solid ${COLORS.ink}`,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              fontFamily: mono,
              fontSize: 42,
              letterSpacing: '0.16em',
              color: COLORS.muted,
            }}
          >
            {TRACK.id.slice(0, typedLength)}
            <span
              style={{
                width: 2,
                height: 45,
                marginLeft: 5,
                background: COLORS.green,
                opacity: frame % 18 < 11 ? 1 : 0,
              }}
            />
          </div>
          <div
            style={{
              width: 285,
              background: `linear-gradient(90deg, ${COLORS.acid} ${buttonFill * 100}%, transparent 0)`,
              borderLeft: `1px solid ${COLORS.line}`,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 17,
              ...monoLabel,
            }}
          >
            Open analysis →
          </div>
        </div>
      </div>
    </Scene>
  );
};

const waveformPath = (
  values: number[],
  width: number,
  height: number,
  top = 0,
) => {
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = top + height - value * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M 0 ${top + height} L ${points.join(' L ')} L ${width} ${top + height} Z`;
};

const EnergyChart: React.FC<{
  values: number[];
  color: string;
  height?: number;
  reveal: number;
  playhead?: number;
  window?: { left: number; width: number };
}> = ({ values, color, height = 470, reveal, playhead, window }) => {
  const width = 952;
  const clipWidth = width * reveal;

  return (
    <div style={{ position: 'relative', height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.54" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
          <clipPath id={`clip-${color.replace('#', '')}`}>
            <rect width={clipWidth} height={height} />
          </clipPath>
        </defs>
        {Array.from({ length: 9 }, (_, index) => (
          <line
            key={index}
            x1={(index / 8) * width}
            x2={(index / 8) * width}
            y1={0}
            y2={height}
            stroke={COLORS.line}
            strokeWidth="1"
          />
        ))}
        <path
          d={waveformPath(values, width, height - 12)}
          fill={`url(#fill-${color.replace('#', '')})`}
          stroke={color}
          strokeWidth="4"
          clipPath={`url(#clip-${color.replace('#', '')})`}
        />
      </svg>
      {window ? (
        <div
          style={{
            position: 'absolute',
            left: `${window.left * 100}%`,
            width: `${window.width * 100}%`,
            top: 0,
            bottom: 0,
            background: `${color}26`,
            borderLeft: `3px solid ${color}`,
            borderRight: `3px solid ${color}`,
          }}
        />
      ) : null}
      {playhead !== undefined ? (
        <div
          style={{
            position: 'absolute',
            left: `${playhead * 100}%`,
            top: -9,
            bottom: 0,
            width: 2,
            background: COLORS.ink,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              background: COLORS.ink,
              transform: 'translate(-6px, 2px) rotate(45deg)',
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

const AnalysisScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [5, 72], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const playhead = interpolate(frame, [58, duration - 12], [0.03, 0.78], clamp);
  const cueReveal = spring({
    frame: frame - 68,
    fps: 30,
    durationInFrames: 34,
    config: { damping: 200 },
  });

  return (
    <Scene duration={duration}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ color: COLORS.green, fontSize: 17, ...monoLabel }}>01</span>
        <h2
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 67,
            letterSpacing: '-0.045em',
            margin: '0 0 0 28px',
          }}
        >
          Energy, structure & DJ map
        </h2>
      </div>
      <div
        style={{
          marginTop: 65,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div
          style={{
            background: COLORS.green,
            color: COLORS.paper,
            padding: '20px 28px',
            fontWeight: 700,
            fontSize: 17,
            ...monoLabel,
          }}
        >
          ▶ Play track
        </div>
        <strong style={{ fontFamily: mono, fontSize: 26 }}>0:19</strong>
        <span style={{ fontFamily: mono, color: COLORS.muted, fontSize: 20 }}>
          / {TRACK.duration}
        </span>
      </div>
      <div style={{ marginTop: 34 }}>
        <EnergyChart
          values={OUTGOING_ENERGY}
          color={COLORS.green}
          reveal={reveal}
          playhead={playhead}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          borderTop: `1px solid ${COLORS.line}`,
          borderBottom: `1px solid ${COLORS.line}`,
          height: 95,
        }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            style={{
              borderRight: index < 7 ? `1px solid ${COLORS.line}` : undefined,
              padding: '16px 10px',
              fontSize: 14,
              ...monoLabel,
            }}
          >
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span
              style={{ display: 'block', color: COLORS.muted, fontSize: 10, marginTop: 8 }}
            >
              DROP
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 54,
          display: 'grid',
          gridTemplateColumns: '240px 240px 1fr',
          gap: 28,
          background: COLORS.acid,
          padding: '34px 38px',
          transform: `translateY(${(1 - cueReveal) * 30}px)`,
          opacity: cueReveal,
        }}
      >
        <div>
          <small style={{ fontSize: 13, ...monoLabel }}>Mix in</small>
          <strong style={{ display: 'block', fontFamily: serif, fontSize: 67 }}>
            {TRACK.mixIn}
          </strong>
        </div>
        <div>
          <small style={{ fontSize: 13, ...monoLabel }}>Mix out</small>
          <strong style={{ display: 'block', fontFamily: serif, fontSize: 67 }}>
            {TRACK.mixOut}
          </strong>
        </div>
        <div style={{ paddingTop: 7 }}>
          <strong style={{ fontFamily: serif, fontSize: 28, fontWeight: 400 }}>
            segment s2 drop entry
          </strong>
          <span
            style={{ display: 'block', marginTop: 12, fontSize: 13, ...monoLabel }}
          >
            80% confidence
          </span>
        </div>
      </div>
    </Scene>
  );
};

const BehaviorScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <Scene duration={duration}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ color: COLORS.green, fontSize: 17, ...monoLabel }}>02</span>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 78,
            fontWeight: 400,
            letterSpacing: '-0.05em',
            margin: '0 0 0 28px',
          }}
        >
          Behavioral profile
        </h2>
      </div>
      <p
        style={{
          color: COLORS.muted,
          fontSize: 15,
          lineHeight: 1.5,
          marginTop: 26,
          ...monoLabel,
        }}
      >
        Movement, emotional position, and crowd-facing character.
      </p>
      <div
        style={{
          marginTop: 110,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 62,
        }}
      >
        {BEHAVIOR.map((item, index) => {
          const progress = spring({
            frame: frame - 15 - index * 7,
            fps: 30,
            durationInFrames: 34,
            config: { damping: 200 },
          });
          const value = Math.round(item.value * progress);
          return (
            <div key={item.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 18,
                  marginBottom: 16,
                  ...monoLabel,
                }}
              >
                <span>{item.label}</span>
                <strong style={{ color: COLORS.green }}>{value}%</strong>
              </div>
              <div style={{ height: 11, background: COLORS.line }}>
                <div
                  style={{
                    width: `${item.value * progress}%`,
                    height: '100%',
                    background: COLORS.green,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

const SemanticScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();

  return (
    <Scene duration={duration}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ color: COLORS.green, fontSize: 17, ...monoLabel }}>03</span>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 74,
            fontWeight: 400,
            letterSpacing: '-0.05em',
            margin: '0 0 0 28px',
          }}
        >
          Semantic fingerprint
        </h2>
      </div>
      <p
        style={{
          color: COLORS.muted,
          fontSize: 15,
          lineHeight: 1.5,
          marginTop: 26,
          ...monoLabel,
        }}
      >
        Dominant evidence only. Low-signal classifier noise omitted.
      </p>
      <div
        style={{
          marginTop: 70,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '52px 34px',
        }}
      >
        {TAXONOMY.map((group, groupIndex) => (
          <section
            key={group.title}
            style={{
              borderTop: `1px solid ${COLORS.line}`,
              paddingTop: 19,
              minHeight: 360,
            }}
          >
            <h3
              style={{
                color: COLORS.muted,
                fontSize: 14,
                margin: '0 0 25px',
                ...monoLabel,
              }}
            >
              {group.title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11 }}>
              {group.labels.map(([label, score], index) => {
                const labelText = String(label);
                const progress = spring({
                  frame: frame - 8 - groupIndex * 8 - index * 4,
                  fps: 30,
                  durationInFrames: 28,
                  config: { damping: 200 },
                });
                return (
                  <div
                    key={labelText}
                    style={{
                      border: `1px solid ${index === 0 ? COLORS.green : COLORS.line}`,
                      padding: '13px 15px 11px',
                      fontFamily: serif,
                      fontSize: labelText.length > 12 ? 22 : 26,
                      lineHeight: 1,
                      transform: `translateY(${(1 - progress) * 16}px)`,
                      opacity: progress,
                    }}
                  >
                    {labelText}
                    <sup
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: COLORS.green,
                        marginLeft: 8,
                      }}
                    >
                      {score}
                    </sup>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Scene>
  );
};

const Deck: React.FC<{
  label: 'OUT' | 'IN';
  artist: string;
  title: string;
  current: string;
  duration: string;
  values: number[];
  color: string;
  reveal: number;
  window: { left: number; width: number };
}> = ({ label, artist, title, current, duration, values, color, reveal, window }) => (
  <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 23 }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '82px 1fr auto',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          alignSelf: 'stretch',
          minHeight: 72,
          display: 'grid',
          placeItems: 'center',
          background: color,
          color: COLORS.paper,
          fontSize: 17,
          fontWeight: 700,
          ...monoLabel,
        }}
      >
        {label}
      </div>
      <div style={{ minWidth: 0 }}>
        <small style={{ color: COLORS.muted, fontSize: 11, ...monoLabel }}>
          {artist}
        </small>
        <h3
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 31,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: '7px 0 0',
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ fontFamily: mono, fontSize: 27 }}>
        {current}{' '}
        <span style={{ color: COLORS.muted, fontSize: 15 }}>/ {duration}</span>
      </div>
    </div>
    <div style={{ marginTop: 22 }}>
      <EnergyChart
        values={values}
        color={color}
        height={245}
        reveal={reveal}
        window={window}
      />
    </div>
  </div>
);

const MixScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 48], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const windowsProgress = spring({
    frame: frame - 42,
    fps: 30,
    durationInFrames: 45,
    config: { damping: 200 },
  });
  const outgoingLeft = interpolate(windowsProgress, [0, 1], [0.3, 0.13], clamp);
  const incomingLeft = interpolate(windowsProgress, [0, 1], [0.58, 0.35], clamp);
  const score = Math.round(
    interpolate(frame, [80, 116], [0, 87], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  const playProgress = interpolate(frame, [116, duration - 8], [0, 1], clamp);

  return (
    <Scene duration={duration} exit={10}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '250px 170px 170px 170px 1fr',
          border: `1px solid ${COLORS.line}`,
          minHeight: 105,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            background: COLORS.green,
            color: COLORS.paper,
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
            fontWeight: 700,
            ...monoLabel,
          }}
        >
          ▶ Play transition
        </div>
        {[
          ['Blend', `${interpolate(frame, [56, 92], [0, 8.9], clamp).toFixed(1)}s`],
          ['Tempo', '−7.1%'],
          ['Score', String(score)],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              borderRight: `1px solid ${COLORS.line}`,
              padding: '19px 17px',
            }}
          >
            <small style={{ color: COLORS.muted, fontSize: 11, ...monoLabel }}>
              {label}
            </small>
            <strong style={{ display: 'block', fontFamily: serif, fontSize: 37, marginTop: 6 }}>
              {value}
            </strong>
          </div>
        ))}
        <div
          style={{
            padding: '22px 18px',
            color: COLORS.muted,
            fontSize: 11,
            lineHeight: 1.6,
            ...monoLabel,
          }}
        >
          Matched mood · clean vocal overlap
          <br />
          compatible key · preserve
        </div>
      </div>
      <Deck
        label="OUT"
        artist={TRACK.artist}
        title={TRACK.title}
        current="0:19"
        duration={TRACK.duration}
        values={OUTGOING_ENERGY}
        color={COLORS.green}
        reveal={reveal}
        window={{ left: outgoingLeft, width: 0.13 }}
      />
      <div
        style={{
          height: 54,
          display: 'grid',
          placeItems: 'center',
          color: COLORS.muted,
          fontSize: 12,
          ...monoLabel,
        }}
      >
        <span>transition window ↕</span>
      </div>
      <Deck
        label="IN"
        artist={INCOMING_TRACK.artist}
        title={INCOMING_TRACK.title}
        current={INCOMING_TRACK.cue}
        duration={INCOMING_TRACK.duration}
        values={INCOMING_ENERGY}
        color={COLORS.amber}
        reveal={reveal}
        window={{ left: incomingLeft, width: 0.13 }}
      />
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          bottom: 104,
          height: 7,
          background: COLORS.line,
        }}
      >
        <div
          style={{
            width: `${playProgress * 100}%`,
            height: '100%',
            background: COLORS.acid,
          }}
        />
      </div>
    </Scene>
  );
};

const OutroScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    frame,
    fps,
    durationInFrames: 36,
    config: { damping: 200 },
  });

  return (
    <Scene duration={duration} exit={0}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: COLORS.green, fontSize: 17, ...monoLabel }}>
          Transition ready / score 87
        </div>
        <h2
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 130,
            letterSpacing: '-0.07em',
            lineHeight: 0.87,
            margin: '52px 0 65px',
            opacity: reveal,
            transform: `translateY(${(1 - reveal) * 50}px)`,
          }}
        >
          Know what fits
          <br />
          before pressing play.
        </h2>
        <div
          style={{
            width: '100%',
            display: 'flex',
            borderTop: `2px solid ${COLORS.ink}`,
            paddingTop: 27,
            alignItems: 'center',
          }}
        >
          <strong style={{ fontFamily: mono, fontSize: 25, letterSpacing: '0.04em' }}>
            music.vlad.chat/backroom
          </strong>
          <div
            style={{
              marginLeft: 'auto',
              background: COLORS.acid,
              padding: '22px 25px',
              fontWeight: 700,
              fontSize: 15,
              ...monoLabel,
            }}
          >
            Open analysis →
          </div>
        </div>
      </div>
    </Scene>
  );
};

export const BackroomFilm: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper, overflow: 'hidden' }}>
    <Audio
      src={staticFile('sound.m4a')}
      trimBefore={800}
      volume={(frame) =>
        Math.min(
          interpolate(frame, [0, 24], [0, 0.72], clamp),
          interpolate(frame, [DURATION_IN_FRAMES - 45, DURATION_IN_FRAMES], [0.72, 0], clamp),
        )
      }
    />
    <Paper />
    <Sequence from={0} durationInFrames={115} premountFor={30}>
      <IntroScene duration={115} />
    </Sequence>
    <Sequence from={95} durationInFrames={205} premountFor={30}>
      <AnalysisScene duration={205} />
    </Sequence>
    <Sequence from={275} durationInFrames={180} premountFor={30}>
      <BehaviorScene duration={180} />
    </Sequence>
    <Sequence from={430} durationInFrames={145} premountFor={30}>
      <SemanticScene duration={145} />
    </Sequence>
    <Sequence from={550} durationInFrames={170} premountFor={30}>
      <MixScene duration={170} />
    </Sequence>
    <Sequence from={700} durationInFrames={80} premountFor={30}>
      <OutroScene duration={80} />
    </Sequence>
    <Chrome />
  </AbsoluteFill>
);
