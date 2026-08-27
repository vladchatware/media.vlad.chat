import type * as React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

// Design tokens ported verbatim from music.vlad.chat app/(backroom)/backroom.module.css
// (dark theme defaults). The film must read as the same product as the desk.

export const COLORS = {
  paper: '#0e100d',
  ink: '#e9eadf',
  muted: '#919486',
  lede: '#b9bcad',
  acid: '#d7ff3f', // outgoing deck
  amber: '#ffb648', // incoming deck
  line: '#30342a',
  section: '#151812',
  scoreTrack: '#282c24',
  plotGrid: '#1d2119',
  plotLine: '#576022',
  artwork: '#1b1e18',
  artworkShadow: '#171a15',
  tagLine: '#454a3d',
  cueInk: '#12140f',
  index: '#55594e',
} as const;

export const SERIF = 'Georgia, "Times New Roman", serif';
export const MONO = '"Courier New", Courier, monospace';

// The backroom desk is a phone page. Scenes are designed at iPhone CSS scale
// (393px wide) and upscaled to the 1080px render canvas, so proportions match
// the real product exactly. See PhoneCanvas in components.tsx.
export const PHONE_WIDTH = 393;
export const PHONE_HEIGHT = 699; // 1920 / PHONE_SCALE
export const PHONE_SCALE = 1080 / PHONE_WIDTH;

export const monoLabel: React.CSSProperties = {
  fontFamily: MONO,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

// Hard offset shadow — no blur — as used on artwork and hover cards.
export const offsetShadow = (size = 18): React.CSSProperties => ({
  boxShadow: `${size}px ${size}px 0 ${COLORS.artworkShadow}`,
});

export const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

// Audio files are either absolute URLs (workflow/blob) or paths inside the
// Remotion public dir (local demo assets).
export const resolveAudioSrc = (file: string): string =>
  /^https?:\/\//.test(file) ? file : staticFile(file);

export const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Equal-power crossfader gains, matching lib/dj/performance/crossfader.ts.
export const equalPower = (progress: number) => ({
  outgoing: Math.cos(progress * (Math.PI / 2)),
  incoming: Math.sin(progress * (Math.PI / 2)),
});
