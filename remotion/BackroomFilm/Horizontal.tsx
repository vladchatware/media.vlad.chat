import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

import trackPayload from './track-2355356972.analysis.json';
import { FPS } from './data';

const analysis = trackPayload.analysis;
const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

export const SOUNDTRACK_BPM = analysis.tempo.bpm;
export const FIRST_DOWNBEAT_SEC = analysis.tempo.firstDownbeatSec;
export const BEAT_FRAMES = (60 / SOUNDTRACK_BPM) * FPS;
export const BAR_FRAMES = BEAT_FRAMES * 4;
export const HORIZONTAL_DURATION_IN_FRAMES = Math.round(BAR_FRAMES * 14);
const AUDIO_TRIM_FRAMES = Math.round(FIRST_DOWNBEAT_SEC * FPS);
const AUDIO_TRIM_SEC = AUDIO_TRIM_FRAMES / FPS;
const BASS_DROP_SOURCE_SEC = 3.5;
const BASS_DROP_FRAME = Math.round((BASS_DROP_SOURCE_SEC - AUDIO_TRIM_SEC) * FPS);

const barFrame = (bar: number) => Math.round(BAR_FRAMES * bar);

const shots = [
  { src: 'backroom-2355356972-0.png', startBar: 0, endBar: 2 },
  { src: 'backroom-2355356972-900.png', startBar: 2, endBar: 6 },
  { src: 'backroom-2355356972-1800.png', startBar: 6, endBar: 9 },
  { src: 'backroom-2355356972-2700.png', startBar: 9, endBar: 12 },
  { src: 'backroom-2355356972-3523.png', startBar: 12, endBar: 14 },
] as const;

const AudioPlayhead: React.FC = () => {
  const frame = useCurrentFrame();
  const audioSec = frame / FPS + AUDIO_TRIM_SEC;
  const chartLeft = (77 / 1873) * 1920;
  const chartRight = (1842 / 1873) * 1920;
  const x = interpolate(
    audioSec,
    [0, analysis.durationSec],
    [chartLeft, chartRight],
    clamp,
  );
  const dropCallout = interpolate(
    frame,
    [
      BASS_DROP_FRAME - 2,
      BASS_DROP_FRAME + 2,
      BASS_DROP_FRAME + 28,
      BASS_DROP_FRAME + 38,
    ],
    [0, 1, 1, 0],
    clamp,
  );

  return (
    <>
      <div
        style={{
          position: 'absolute',
          zIndex: 4,
          left: x,
          top: 314,
          width: 2,
          height: 397,
          background: '#171811',
          boxShadow: '0 0 0 1px rgba(239,238,230,.55)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -5,
            left: -5,
            width: 12,
            height: 12,
            background: '#171811',
            transform: 'rotate(45deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 13,
            left: 8,
            whiteSpace: 'nowrap',
            background: '#5d720b',
            color: '#f4f3e9',
            padding: '5px 8px 4px',
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            letterSpacing: '0.08em',
          }}
        >
          {`${Math.floor(audioSec / 60)}:${(audioSec % 60).toFixed(1).padStart(4, '0')}`}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          left: Math.min(x + 24, 1500),
          top: 250,
          opacity: dropCallout,
          transform: `translateY(${(1 - dropCallout) * 12}px)`,
          background: '#d0ff2f',
          color: '#171811',
          padding: '15px 18px 13px',
          fontFamily: '"Courier New", monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '8px 8px 0 rgba(93,114,11,.18)',
        }}
      >
        Low-end enters / 3.50s
      </div>
    </>
  );
};

const DashboardShot: React.FC<{
  src: string;
  startBar: number;
  endBar: number;
  index: number;
}> = ({ src, startBar, endBar, index }) => {
  const frame = useCurrentFrame();
  const start = barFrame(startBar);
  const end = barFrame(endBar);
  const entranceFrames = src.includes('-900') ? 3 : 8;
  const entrance = index === 0
    ? 1
    : interpolate(frame, [start, start + entranceFrames], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
  const local = interpolate(frame, [start, end], [0, 1], clamp);
  const dropPulse = src.includes('-900')
    ? interpolate(
        frame,
        [BASS_DROP_FRAME - 2, BASS_DROP_FRAME, BASS_DROP_FRAME + 6, BASS_DROP_FRAME + 20],
        [0, 1, 0.34, 0],
        clamp,
      )
    : 0;
  const scale = interpolate(local, [0, 1], [1.004, 1.016], clamp) + dropPulse * 0.032;
  const translateY = interpolate(local, [0, 1], [5, -7], clamp) + dropPulse * 5;
  const tiltDirection = index % 2 === 0 ? 1 : -1;
  const rotateX = interpolate(local, [0, 0.5, 1], [0.15, -0.45, 0.1], clamp);
  const rotateY =
    interpolate(local, [0, 0.5, 1], [0.6, -0.8, 0.25], clamp) * tiltDirection;

  return (
    <AbsoluteFill
      style={{
        zIndex: index,
        opacity: entrance,
        backgroundColor: '#efeee6',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          transformOrigin: '50% 50%',
          transform: `perspective(1800px) translate3d(0, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
          }}
        />
        {src.includes('-900') ? <AudioPlayhead /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BeatWash: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = (frame / BEAT_FRAMES) % 1;
  const pulse = interpolate(phase, [0, 0.08, 0.35], [1, 0.25, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        zIndex: 20,
        pointerEvents: 'none',
        boxShadow: `inset 0 0 0 3px rgba(105, 124, 9, ${pulse * 0.14})`,
        backgroundColor: `rgba(200, 255, 32, ${pulse * 0.012})`,
      }}
    />
  );
};

export const BackroomFilmHorizontal: React.FC = () => {
  const frame = useCurrentFrame();
  const dropFlash = interpolate(
    frame,
    [BASS_DROP_FRAME - 2, BASS_DROP_FRAME, BASS_DROP_FRAME + 3, BASS_DROP_FRAME + 12],
    [0, 1, 0.22, 0],
    clamp,
  );
  const finalFade = interpolate(
    frame,
    [HORIZONTAL_DURATION_IN_FRAMES - 12, HORIZONTAL_DURATION_IN_FRAMES],
    [0, 1],
    clamp,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#efeee6', overflow: 'hidden' }}>
      <Audio
        src={staticFile('track-2355356972.mp3')}
        trimBefore={AUDIO_TRIM_FRAMES}
        volume={(audioFrame) =>
          interpolate(
            audioFrame,
            [
              0,
              HORIZONTAL_DURATION_IN_FRAMES - Math.round(BAR_FRAMES),
              HORIZONTAL_DURATION_IN_FRAMES,
            ],
            [0.88, 0.88, 0],
            clamp,
          )
        }
      />
      {shots.map((shot, index) => (
        <DashboardShot key={shot.src} {...shot} index={index} />
      ))}
      <AbsoluteFill
        style={{
          zIndex: 19,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 36% 43%, rgba(208,255,47,.48), rgba(93,114,11,.09) 34%, transparent 67%)',
          opacity: dropFlash,
          mixBlendMode: 'multiply',
        }}
      />
      <BeatWash />
      <AbsoluteFill
        style={{
          zIndex: 30,
          pointerEvents: 'none',
          backgroundColor: '#efeee6',
          opacity: finalFade,
        }}
      />
    </AbsoluteFill>
  );
};
