// Studio-preview payload only. The workflow always passes a live-resolved
// payload (see workflows/transitions.ts) — these constants exist so the
// compositions render in Remotion Studio and have valid defaultProps.
// Source: remotion/BackroomFilm committed live payloads (2026-07).

import type { TrackPayload, TransitionPayload } from './payload';

const synthEnergy = (incoming = false): number[] =>
  Array.from({ length: 140 }, (_, index) => {
    const x = index / 139;
    const texture =
      Math.sin(index * (incoming ? 1.73 : 1.31)) * 0.035 +
      Math.sin(index * (incoming ? 0.41 : 0.57)) * 0.025;
    if (incoming) {
      if (x < 0.06) return Math.max(0.04, 0.1 + x * 8.8 + texture);
      if (x > 0.94) return Math.max(0.06, 0.9 - (x - 0.94) * 14 + texture);
      return Math.min(0.98, 0.78 + texture);
    }
    if (x < 0.11) return Math.min(0.98, 0.54 + x * 1.1 + texture);
    if (x < 0.48) return Math.min(0.98, 0.8 + texture);
    if (x < 0.6) return Math.min(0.98, 0.52 + (x - 0.48) * 1.1 + texture);
    if (x < 0.71) return Math.max(0.04, 0.69 - (x - 0.6) * 1.6 + texture);
    if (x < 0.73) return Math.max(0.04, 0.22 + texture);
    if (x < 0.94) return Math.min(0.98, 0.81 + texture);
    return Math.max(0.05, 0.72 - (x - 0.94) * 11 + texture);
  });

const outgoing: TrackPayload = {
  id: '2260180544',
  artist: 'GLSxxqx',
  title: 'ice - ZERTAL slowed (MP3)',
  durationSec: 151.59,
  bpm: 107.7,
  camelotKey: '7A',
  meanEnergy: 0.61,
  beats: 533,
  downbeats: 133,
  mixInSec: 24.7,
  mixOutSec: 63.84,
  cueReason: 'segment s2 drop entry',
  cueConfidence: 0.7,
  energy: synthEnergy(),
  sections: [
    { startSec: 0, endSec: 38.2, type: 'intro' },
    { startSec: 38.2, endSec: 71.5, type: 'verse' },
    { startSec: 71.5, endSec: 108.4, type: 'drop' },
    { startSec: 108.4, endSec: 151.6, type: 'outro' },
  ],
  segments: Array.from({ length: 8 }, (_, i) => ({
    id: `s${i}`,
    section: 'drop',
    startSec: (151.59 / 8) * i,
    endSec: (151.59 / 8) * (i + 1),
  })),
  behavior: [
    { label: 'Danceability', value: 87 },
    { label: 'Approachability', value: 34 },
    { label: 'Engagement', value: 76 },
    { label: 'Valence', value: 42 },
    { label: 'Arousal', value: 71 },
    { label: 'Vocal presence', value: 8 },
  ],
  taxonomy: [
    {
      title: 'Mirex mood',
      labels: [['intense', 74], ['cheerful', 19], ['rousing', 3], ['wistful', 1]],
    },
    {
      title: 'Mood / theme',
      labels: [['melodic', 15], ['space', 10], ['dream', 8], ['energetic', 8], ['deep', 5]],
    },
    {
      title: 'Genre / style',
      labels: [['electronic', 59], ['synthpop', 21], ['electropop', 16], ['techno', 16]],
    },
    {
      title: 'Instruments',
      labels: [['synthesizer', 73], ['bass', 25], ['drums', 20], ['drum machine', 11]],
    },
  ],
  analysisVersion: 'essentia-dj-v8',
  artworkUrl: null,
  audioFile: 'https://music.vlad.chat/api/tracks/2260180544/stream',
};

const incoming: TrackPayload = {
  id: '719940274',
  artist: 'Microsound',
  title: 'The Book Of Love',
  durationSec: 208.22,
  bpm: 106.6,
  camelotKey: '9B',
  meanEnergy: 0.55,
  beats: 742,
  downbeats: 185,
  mixInSec: 73.35,
  mixOutSec: 132.1,
  cueReason: 'segment s1 verse entry',
  cueConfidence: 0.64,
  energy: synthEnergy(true),
  sections: [
    { startSec: 0, endSec: 45.1, type: 'intro' },
    { startSec: 45.1, endSec: 96.8, type: 'verse' },
    { startSec: 96.8, endSec: 151.0, type: 'buildup' },
    { startSec: 151.0, endSec: 208.2, type: 'drop' },
  ],
  segments: Array.from({ length: 6 }, (_, i) => ({
    id: `s${i}`,
    section: 'drop',
    startSec: (208.22 / 6) * i,
    endSec: (208.22 / 6) * (i + 1),
  })),
  behavior: [
    { label: 'Danceability', value: 74 },
    { label: 'Approachability', value: 62 },
    { label: 'Engagement', value: 69 },
    { label: 'Valence', value: 58 },
    { label: 'Arousal', value: 54 },
    { label: 'Vocal presence', value: 21 },
  ],
  taxonomy: [
    {
      title: 'Mirex mood',
      labels: [['happy', 51], ['romantic', 33], ['tender', 12]],
    },
    {
      title: 'Mood / theme',
      labels: [['love', 24], ['melodic', 19], ['warm', 11], ['dream', 7]],
    },
    {
      title: 'Genre / style',
      labels: [['pop', 44], ['indie', 31], ['dream pop', 22], ['electronic', 14]],
    },
    {
      title: 'Instruments',
      labels: [['voice', 68], ['guitar', 51], ['synthesizer', 33], ['piano', 24]],
    },
  ],
  analysisVersion: 'essentia-dj-v8',
  artworkUrl: null,
  audioFile: 'https://music.vlad.chat/api/tracks/719940274/stream',
};

export const SAMPLE_PAYLOAD: TransitionPayload = {
  energyArc: 'preserve',
  outgoing,
  incoming,
  windows: {
    outgoing: { startSec: 63.84, endSec: 72.74 },
    incoming: { startSec: 73.35, endSec: 82.34 },
  },
  transition: {
    score: 0.7575,
    blendSec: 8.89,
    incomingPlaybackRate: 1.0106,
    reasons: ['matched energy', 'clean vocal overlap', 'stable tempo lock'],
  },
};
