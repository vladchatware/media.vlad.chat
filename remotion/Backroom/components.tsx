import React, { useMemo } from 'react';
import { Easing, interpolate, useCurrentFrame, AbsoluteFill } from 'remotion';
import { getWaveformPortion, useAudioData } from '@remotion/media-utils';

import { COLORS, MONO, SERIF, PHONE_WIDTH, PHONE_SCALE, clamp, formatClock, monoLabel, offsetShadow } from './theme';
import type { TrackPayload } from './payload';

// All sizes below are iPhone CSS px (393-wide design surface, upscaled by
// PhoneCanvas) — matching how app/(backroom) actually renders on a phone.

const PAGE_PADDING = 16;

// ---------------------------------------------------------------------------
// PhoneCanvas: wraps mobile-designed scenes — children lay out in 393×699
// CSS px and are upscaled to the 1080px render canvas.
// ---------------------------------------------------------------------------

export const PhoneCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: PHONE_WIDTH,
        height: 1920 / PHONE_SCALE,
        transformOrigin: 'top left',
        transform: `scale(${PHONE_SCALE})`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Paper: canvas-level film grain (feTurbulence, reseeded every 3 frames)
// ---------------------------------------------------------------------------

export const Paper: React.FC = () => {
  const frame = useCurrentFrame();
  const grainShift = frame % 3;
  return (
    <>
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: 'url(#backroom-grain)',
          opacity: 0.09,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Chrome: topbar brand + section label, footer URL + progress diamond
// (phone scale — render inside PhoneCanvas)
// ---------------------------------------------------------------------------

export const Chrome: React.FC<{ section: string; progress: number }> = ({
  section,
  progress,
}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: PAGE_PADDING,
        right: PAGE_PADDING,
        top: 12,
        height: 26,
        borderBottom: `1px solid ${COLORS.line}`,
        display: 'flex',
        alignItems: 'center',
        color: COLORS.ink,
        fontSize: 8.5,
        zIndex: 20,
        ...monoLabel,
      }}
    >
      <strong style={{ letterSpacing: '0.06em' }}>
        REVIBE <span style={{ color: COLORS.acid }}>/ ANALYSIS DESK</span>
      </strong>
      <span style={{ marginLeft: 'auto', color: COLORS.muted }}>{section}</span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: PAGE_PADDING,
        right: PAGE_PADDING,
        bottom: 12,
        height: 16,
        borderTop: `1px solid ${COLORS.line}`,
        color: COLORS.muted,
        fontSize: 7,
        zIndex: 20,
        ...monoLabel,
      }}
    >
      <span style={{ position: 'absolute', top: 5 }}>music.vlad.chat/backroom</span>
      <div
        style={{
          position: 'absolute',
          top: -2.5,
          left: `${progress * 100}%`,
          width: 4,
          height: 4,
          background: COLORS.acid,
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  </>
);

// ---------------------------------------------------------------------------
// EnergyChart: gradient-filled SVG area + stroke, grid, playhead, window
// ---------------------------------------------------------------------------

// Baseline sits on the bottom edge; 10px headroom is built into the scale.
const waveformPath = (values: number[], width: number, height: number) => {
  const usable = height - 10;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - value * usable;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M 0 ${height} L ${points.join(' L ')} L ${width} ${height} Z`;
};

export const EnergyChart: React.FC<{
  values: number[];
  color: string;
  width?: number;
  height?: number;
  reveal?: number; // 0..1 left-to-right draw
  playhead?: number; // 0..1 position
  window?: { left: number; width: number }; // 0..1 fractions
  grid?: boolean;
}> = ({ values, color, width = PHONE_WIDTH - PAGE_PADDING * 2, height = 110, reveal = 1, playhead, window, grid = true }) => {
  const id = color.replace('#', '');

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
          <clipPath id={`clip-${id}`}>
            <rect width={width * reveal} height={height} />
          </clipPath>
        </defs>
        {grid
          ? Array.from({ length: 9 }, (_, index) => (
              <line
                key={index}
                x1={(index / 8) * width}
                x2={(index / 8) * width}
                y1={0}
                y2={height}
                stroke={COLORS.plotGrid}
                strokeWidth="1"
              />
            ))
          : null}
        <path
          d={waveformPath(values, width, height - 4)}
          fill={`url(#fill-${id})`}
          stroke={color}
          strokeWidth="1.2"
          clipPath={`url(#clip-${id})`}
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
            background: `color-mix(in srgb, ${color} 16%, transparent)`,
            borderLeft: `1.5px solid ${color}`,
            borderRight: `1.5px solid ${color}`,
          }}
        />
      ) : null}
      {playhead !== undefined ? (
        <div
          style={{
            position: 'absolute',
            left: `${playhead * 100}%`,
            top: -4,
            bottom: 0,
            width: 1,
            background: COLORS.ink,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              background: COLORS.ink,
              transform: 'translate(-2.5px, 1px) rotate(45deg)',
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SectionRail: analysis sections strip under the energy chart
// ---------------------------------------------------------------------------

export const SectionRail: React.FC<{
  track: TrackPayload;
  accent?: string;
  height?: number;
}> = ({ track, accent = COLORS.acid, height = 34 }) => {
  const sections = track.sections.length
    ? track.sections
    : [{ startSec: 0, endSec: track.durationSec, type: 'unknown' }];

  return (
    <div
      style={{
        display: 'flex',
        borderTop: `1px solid ${COLORS.line}`,
        borderBottom: `1px solid ${COLORS.line}`,
        height,
      }}
    >
      {sections.map((section, index) => (
        <div
          key={index}
          style={{
            flexGrow: (section.endSec - section.startSec) / track.durationSec,
            borderRight: index < sections.length - 1 ? `1px solid ${COLORS.line}` : undefined,
            padding: '5px 5px',
            overflow: 'hidden',
            ...monoLabel,
          }}
        >
          <strong style={{ fontSize: 7 }}>{String(index + 1).padStart(2, '0')}</strong>
          <span
            style={{
              display: 'block',
              color: accent,
              fontSize: 6,
              marginTop: 3,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {section.type}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MetricStrip: tempo / key / duration / mean energy (2×2 on phone)
// ---------------------------------------------------------------------------

export const MetricStrip: React.FC<{
  metrics: [string, string][];
}> = ({ metrics }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      border: `1px solid ${COLORS.line}`,
    }}
  >
    {metrics.map(([label, value], index) => (
      <div
        key={label}
        style={{
          borderRight: index % 2 === 0 ? `1px solid ${COLORS.line}` : undefined,
          borderBottom: index < metrics.length - 2 ? `1px solid ${COLORS.line}` : undefined,
          padding: '10px 12px',
        }}
      >
        <small style={{ color: COLORS.muted, fontSize: 7, display: 'block', marginBottom: 5, ...monoLabel }}>
          {label}
        </small>
        <strong
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </strong>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// CueBlock: acid block with mix-in / mix-out numerals
// ---------------------------------------------------------------------------

export const CueBlock: React.FC<{ track: TrackPayload }> = ({ track }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '78px 78px 1fr',
      gap: 10,
      background: COLORS.acid,
      color: COLORS.cueInk,
      padding: '12px 14px',
    }}
  >
    <div>
      <small style={{ fontSize: 6, ...monoLabel }}>Mix in</small>
      <strong style={{ display: 'block', fontFamily: SERIF, fontSize: 24, lineHeight: 1.1 }}>
        {track.mixInSec ? formatClockStr(track.mixInSec) : '0:00'}
      </strong>
    </div>
    <div>
      <small style={{ fontSize: 6, ...monoLabel }}>Mix out</small>
      <strong style={{ display: 'block', fontFamily: SERIF, fontSize: 24, lineHeight: 1.1 }}>
        {formatClockStr(track.mixOutSec)}
      </strong>
    </div>
    <div style={{ paddingTop: 3 }}>
      <strong style={{ fontFamily: SERIF, fontSize: 11, fontWeight: 400 }}>
        {track.cueReason ?? 'safe cues'}
      </strong>
      <span style={{ display: 'block', marginTop: 4, fontSize: 6, ...monoLabel }}>
        {track.cueConfidence != null ? `${Math.round(track.cueConfidence * 100)}% confidence` : ''}
      </span>
    </div>
  </div>
);

const formatClockStr = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// ScoreBars: behavioral profile meters
// ---------------------------------------------------------------------------

export const ScoreBars: React.FC<{ behavior: TrackPayload['behavior']; frame: number }> = ({
  behavior,
  frame,
}) => (
  <div style={{ display: 'grid', gap: 26, marginTop: 6 }}>
    {behavior.map((item, index) => {
      const progress = interpolate(frame, [12 + index * 6, 40 + index * 6], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      const value = Math.round(item.value * progress);
      return (
        <div key={item.label}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 7,
            }}
          >
            <span style={{ fontFamily: SERIF, fontSize: 15 }}>{item.label}</span>
            <strong style={{ color: COLORS.acid, fontFamily: MONO, fontSize: 11, ...monoLabel }}>
              {value}%
            </strong>
          </div>
          <div style={{ height: 6, background: COLORS.scoreTrack }}>
            <div style={{ width: `${value}%`, height: '100%', background: COLORS.acid }} />
          </div>
        </div>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// TagGrid: semantic fingerprint tags, first tag acid-bordered
// ---------------------------------------------------------------------------

export const TagGrid: React.FC<{ taxonomy: TrackPayload['taxonomy']; frame: number }> = ({
  taxonomy,
  frame,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px' }}>
    {taxonomy.map((group, groupIndex) => (
      <section
        key={group.title}
        style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 8 }}
      >
        <h3 style={{ color: COLORS.muted, fontSize: 8, margin: '0 0 9px', ...monoLabel }}>
          {group.title}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {group.labels.map(([label, score], index) => {
            const progress = interpolate(
              frame,
              [10 + groupIndex * 6 + index * 3, 34 + groupIndex * 6 + index * 3],
              [0, 1],
              { ...clamp, easing: Easing.out(Easing.cubic) },
            );
            return (
              <div
                key={label}
                style={{
                  border: `1px solid ${index === 0 ? COLORS.acid : COLORS.tagLine}`,
                  padding: '6px 7px 5px',
                  fontFamily: SERIF,
                  fontSize: label.length > 12 ? 12 : 14,
                  lineHeight: 1,
                  transform: `translateY(${(1 - progress) * 6}px)`,
                  opacity: progress,
                }}
              >
                {label}
                <sup style={{ fontFamily: MONO, fontSize: 7, color: COLORS.acid, marginLeft: 4 }}>
                  {score}
                </sup>
              </div>
            );
          })}
          {group.labels.length === 0 ? (
            <em style={{ color: COLORS.muted, fontFamily: SERIF, fontSize: 11 }}>Not available</em>
          ) : null}
        </div>
      </section>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Deck: OUT (acid) / IN (amber) lane with title row + energy chart
// ---------------------------------------------------------------------------

export const Deck: React.FC<{
  label: 'OUT' | 'IN';
  track: TrackPayload;
  color: string;
  current: string;
  chartHeight?: number;
  reveal?: number;
  playhead?: number;
  window?: { left: number; width: number };
}> = ({
  label,
  track,
  color,
  current,
  chartHeight = 120,
  reveal = 1,
  playhead,
  window,
}) => (
  <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 8 }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr auto',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          alignSelf: 'stretch',
          minHeight: 26,
          display: 'grid',
          placeItems: 'center',
          background: color,
          color: COLORS.paper,
          fontSize: 8,
          fontWeight: 700,
          ...monoLabel,
        }}
      >
        {label}
      </div>
      <div style={{ minWidth: 0 }}>
        <small style={{ color: COLORS.muted, fontSize: 6.5, ...monoLabel }}>{track.artist}</small>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: '2px 0 0',
          }}
        >
          {track.title}
        </h3>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
        {current}{' '}
        <span style={{ color: COLORS.muted, fontSize: 7 }}>
          / {formatClockStr(track.durationSec)}
        </span>
      </div>
    </div>
    <div style={{ marginTop: 8 }}>
      <EnergyChart
        values={track.energy}
        color={color}
        height={chartHeight}
        reveal={reveal}
        playhead={playhead}
        window={window}
      />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Artwork hero: hard offset shadow + acid SC badge
// ---------------------------------------------------------------------------

export const Artwork: React.FC<{ src: string; size?: number; delay?: number; frame: number }> = ({
  src,
  size = 120,
  delay = 0,
  frame,
}) => {
  const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width: size,
        height: size,
        background: COLORS.artwork,
        ...offsetShadow(7),
        transform: `translate(${(1 - progress) * 9}px, ${(1 - progress) * 9}px)`,
        opacity: progress,
        overflow: 'hidden',
        filter: 'saturate(.78) contrast(1.07)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            fontFamily: SERIF,
            fontSize: size / 3,
            color: COLORS.muted,
          }}
        >
          SC
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// WaveformDeck: the page's mix-deck card — badge, title, clock, dense audio
// waveform with progress fill + transition window chip, section readout and
// the numbered DJ SEGMENTS rail. Mirrors the reference phone rendering.
// ---------------------------------------------------------------------------

const denseWaveformPath = (amplitudes: number[]) =>
  amplitudes
    .map((amplitude, index) => {
      const x = index + 0.5;
      const half = Math.max(0.4, amplitude * 46);
      return `M${x.toFixed(1)} ${(50 - half).toFixed(1)}V${(50 + half).toFixed(1)}`;
    })
    .join('');

export const WaveformDeck: React.FC<{
  label: 'OUT' | 'IN';
  track: TrackPayload;
  color: string;
  positionSec: number;
  windowRange: { startSec: number; endSec: number };
  reveal?: number;
}> = ({ label, track, color, positionSec, windowRange, reveal = 1 }) => {
  const frame = useCurrentFrame();
  const audioData = useAudioData(track.audioFile);
  const amplitudes = useMemo(() => {
    if (!audioData) return [];
    return getWaveformPortion({
      audioData,
      startTimeInSeconds: 0,
      durationInSeconds: audioData.durationInSeconds,
      numberOfSamples: 720,
      normalize: true,
    }).map(({ amplitude }) => amplitude);
  }, [audioData]);

  const progress = Math.max(0, Math.min(1, positionSec / track.durationSec));
  const windowLeft = windowRange.startSec / track.durationSec;
  const windowWidth = (windowRange.endSec - windowRange.startSec) / track.durationSec;

  const activeSegmentIndex = Math.max(
    0,
    track.segments.findIndex((s) => positionSec >= s.startSec && positionSec < s.endSec),
  );
  const activeSegment = track.segments[activeSegmentIndex];
  const nextSegment = track.segments[activeSegmentIndex + 1];

  const id = `${label}-${track.id}`.replace(/[^a-zA-Z0-9-]/g, '');
  const chipLeft = Math.max(0, Math.min(1, progress)) * 100;
  const chipShift = Math.min(0, Math.max(-60, 120 - chipLeft * 3.4));

  return (
    <div
      style={{
        border: `1px solid ${COLORS.line}`,
        padding: 12,
        opacity: reveal,
      }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            background: color,
            color: COLORS.paper,
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
            ...monoLabel,
          }}
        >
          {label}
        </div>
        <div style={{ minWidth: 0 }}>
          <small style={{ color: COLORS.muted, fontSize: 7.5, ...monoLabel }}>{track.artist}</small>
          <h3
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 24,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              margin: '4px 0 0',
            }}
          >
            {track.title}
          </h3>
          <div style={{ fontFamily: MONO, fontSize: 14, fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>
            {formatClock(positionSec)}{' '}
            <span style={{ color: COLORS.muted, fontSize: 9.5 }}>
              / {formatClock(track.durationSec)}
            </span>
          </div>
        </div>
      </div>

      {/* Dense waveform + window + playhead */}
      <div style={{ position: 'relative', height: 110, marginTop: 10 }}>
        <svg
          viewBox="0 0 720 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
        >
          <defs>
            <clipPath id={`wave-win-${id}`}>
              <rect x={windowLeft * 720} width={windowWidth * 720} height="100" />
            </clipPath>
            <clipPath id={`wave-played-${id}`}>
              <rect x={0} width={progress * 720} height="100" />
            </clipPath>
          </defs>
          {amplitudes.length > 0 ? (
            <>
              {/* base waveform (dim) */}
              <path
                d={denseWaveformPath(amplitudes)}
                fill="none"
                stroke={color}
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                opacity="0.3"
              />
              {/* window tint */}
              <rect
                x={windowLeft * 720}
                y={0}
                width={windowWidth * 720}
                height={100}
                fill={color}
                opacity="0.14"
                clipPath={`url(#wave-win-${id})`}
              />
              {/* played fill (solid) */}
              <path
                d={denseWaveformPath(amplitudes)}
                fill="none"
                stroke={color}
                strokeWidth="0.9"
                vectorEffect="non-scaling-stroke"
                clipPath={`url(#wave-played-${id})`}
                opacity="0.95"
              />
            </>
          ) : null}
        </svg>
        {/* window chip */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: `${chipLeft}%`,
            transform: `translateX(${chipShift}px)`,
            background: color,
            color: label === 'OUT' ? COLORS.paper : COLORS.cueInk,
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 700,
            padding: '3px 5px',
            whiteSpace: 'nowrap',
          }}
        >
          {formatClock(windowRange.startSec)}–{formatClock(windowRange.endSec)}
        </div>
        {/* playhead */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            bottom: 0,
            left: `${chipLeft}%`,
            width: 1.5,
            background: COLORS.ink,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              background: COLORS.ink,
              transform: 'translate(-3.7px, 0) rotate(45deg)',
            }}
          />
        </div>
      </div>

      {/* Section readout: current section → next */}
      <div
        style={{
          border: `1px solid ${COLORS.line}`,
          borderLeft: `2px solid ${color}`,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 12px',
          minHeight: 52,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 11, ...monoLabel }}>
          {(activeSegment?.section ?? '—').toUpperCase()}
          <span style={{ display: 'block', color: COLORS.muted, fontSize: 9, marginTop: 5 }}>
            {formatClock(activeSegment?.startSec ?? 0)}
          </span>
        </div>
        {nextSegment ? (
          <div style={{ fontFamily: MONO, fontSize: 10, ...monoLabel, color: COLORS.muted, textAlign: 'right' }}>
            {nextSegment.section.toUpperCase()}
            <span style={{ display: 'block', fontSize: 9, marginTop: 5 }}>
              {formatClock(nextSegment.startSec)}
            </span>
          </div>
        ) : null}
      </div>

      {/* DJ SEGMENTS rail */}
      {track.segments.length > 0 ? (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              textAlign: 'right',
              color: COLORS.muted,
              fontSize: 6,
              marginBottom: 4,
              ...monoLabel,
            }}
          >
            DJ SEGMENTS
          </div>
          <div style={{ display: 'flex', border: `1px solid ${COLORS.line}` }}>
            {track.segments.map((segment, index) => {
              const active = index === activeSegmentIndex;
              return (
                <div
                  key={segment.id ?? index}
                  style={{
                    flex: 1,
                    borderRight: index < track.segments.length - 1 ? `1px solid ${COLORS.line}` : undefined,
                    background: active ? `color-mix(in srgb, ${color} 26%, transparent)` : 'transparent',
                    borderLeft: active ? `2px solid ${color}` : undefined,
                    padding: '7px 5px',
                    overflow: 'hidden',
                  }}
                >
                  <strong style={{ fontFamily: SERIF, fontSize: 11 }}>{String(index + 1).padStart(2, '0')}</strong>
                  <span
                    style={{
                      display: 'block',
                      color: active ? COLORS.ink : COLORS.muted,
                      fontSize: 5,
                      marginTop: 3,
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                      ...monoLabel,
                    }}
                  >
                    {segment.section}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
