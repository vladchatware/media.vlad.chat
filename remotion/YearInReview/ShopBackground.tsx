import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

const LensFlare: React.FC<{ frame: number; seed: number; volume: number }> = ({ frame, seed, volume }) => {
  const x = random(seed) * 100;
  const y = random(seed + 1) * 100;

  const streakWidth = 2600 * (0.8 + volume);
  const streakHeight = 8 + volume * 80;
  const streakOpacity = interpolate(volume, [0.45, 0.9], [0, 1], { extrapolateLeft: 'clamp' });
  const glareSize = 900 * (0.5 + volume);
  const glareOpacity = interpolate(volume, [0.35, 0.8], [0, 1], { extrapolateLeft: 'clamp' });

  if (volume < 0.4) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: glareSize,
          height: glareSize,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,144,232,0.62) 14%, rgba(255,190,240,0.24) 32%, transparent 70%)',
          filter: 'blur(10px)',
          opacity: glareOpacity,
          mixBlendMode: 'plus-lighter',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: streakWidth,
          height: streakHeight,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,230,249,0.95) 50%, transparent 100%)',
          boxShadow: `0 0 ${streakHeight * 5}px rgba(255,144,232,0.9), 0 0 ${streakHeight * 14}px rgba(255,190,240,0.8)`,
          transform: 'translate(-50%, -50%)',
          opacity: streakOpacity,
          mixBlendMode: 'plus-lighter',
        }}
      />
    </div>
  );
};

export const ShopBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { visualization, volume, bass } = useAudio();

  const highFreq =
    visualization.length > 0 ? (visualization[13] + visualization[14] + visualization[15]) / 3 : 0;

  const noiseFilter = useMemo(
    () => (
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="shopNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
    ),
    [],
  );

  const t = frame / fps;
  const jitterX = (random(frame) - 0.5) * (bass * 48 + highFreq * 36);
  const jitterY = (random(frame + 1) - 0.5) * (bass * 48 + highFreq * 36);
  const backgroundScale = 1.2 + bass * 0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: '#120915', overflow: 'hidden' }}>
      {noiseFilter}

      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `scale(${backgroundScale}) translate(${jitterX}px, ${jitterY}px)`,
        }}
      >
        <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'blur(56px)' }}>
          <div
            style={{
              position: 'absolute',
              left: `${48 + 35 * Math.sin(t * 0.85)}%`,
              top: `${52 + 28 * Math.cos(t * 0.6)}%`,
              width: `${72 + bass * 70}%`,
              height: `${72 + bass * 70}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,144,232,0.9) 0%, rgba(255,144,232,0) 72%)',
              opacity: 0.4 + bass * 0.45,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${20 + 55 * Math.cos(t * 0.7)}%`,
              top: `${76 + 38 * Math.sin(t * 0.95)}%`,
              width: `${84 + volume * 58}%`,
              height: `${84 + volume * 58}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,205,244,0.82) 0%, rgba(255,205,244,0) 70%)',
              opacity: 0.35 + volume * 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${82 + 34 * Math.sin(t * 1.1)}%`,
              top: `${24 + 46 * Math.cos(t * 0.55)}%`,
              width: `${88 + bass * 40}%`,
              height: `${88 + bass * 40}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,123,214,0.36) 0%, rgba(255,123,214,0) 68%)',
              opacity: 0.25 + bass * 0.35,
            }}
          />
        </div>

        {[...Array(4)].map((_, i) => (
          <LensFlare key={i} frame={frame} seed={Math.floor(frame / 2) * 22 + i} volume={volume} />
        ))}
      </div>

      <AbsoluteFill
        style={{
          backgroundColor: '#ffd6f7',
          opacity: bass > 0.78 ? (bass - 0.78) * 4.5 : 0,
          mixBlendMode: 'plus-lighter',
          zIndex: 100,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundColor: '#ff90e8',
          opacity: highFreq > 0.82 ? (highFreq - 0.82) * 3.2 : 0,
          mixBlendMode: 'screen',
          zIndex: 101,
        }}
      />

      <AbsoluteFill
        style={{
          opacity: 0.34 + volume * 0.18,
          filter: 'url(#shopNoiseFilter)',
          mixBlendMode: 'overlay',
          transform: `scale(${1.18 + random(frame) * 0.18}) translate(${(random(frame + 2) - 0.5) * 42}px)`,
          zIndex: 102,
        }}
      />

      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle, transparent 14%, rgba(8,0,11,0.82) 100%, #000 130%)',
          mixBlendMode: 'multiply',
          zIndex: 103,
        }}
      />
    </AbsoluteFill>
  );
};
