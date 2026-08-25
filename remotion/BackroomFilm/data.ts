export const FPS = 30;
export const DURATION_IN_FRAMES = 26 * FPS;

export const COLORS = {
  paper: '#f3f1e8',
  ink: '#191b16',
  muted: '#74776c',
  line: '#c9c8bd',
  green: '#526800',
  acid: '#d7ff3f',
  amber: '#a85b00',
  paleGreen: '#dfe4c8',
  paleAmber: '#ead8bd',
};

export const TRACK = {
  artist: 'GLSXXQX',
  title: 'ice — ZERTAL slowed (MP3)',
  id: '2248709558',
  duration: '2:31',
  mixIn: '0:19',
  mixOut: '2:24',
};

export const INCOMING_TRACK = {
  artist: 'POOLISCOOL',
  title: 'General Release — Buckshot Roulette (Slowed)',
  duration: '2:43',
  cue: '0:59',
};

export const BEHAVIOR = [
  { label: 'Danceability', value: 100 },
  { label: 'Approachability', value: 32 },
  { label: 'Engagement', value: 78 },
  { label: 'Valence', value: 70 },
  { label: 'Arousal', value: 36 },
  { label: 'Vocal presence', value: 7 },
];

export const TAXONOMY = [
  {
    title: 'Mirex mood',
    labels: [
      ['intense', 74],
      ['cheerful', 19],
      ['rousing', 3],
      ['whimsical', 3],
      ['wistful', 1],
    ],
  },
  {
    title: 'Mood / theme',
    labels: [
      ['melodic', 15],
      ['space', 10],
      ['dream', 8],
      ['energetic', 8],
      ['deep', 5],
      ['powerful', 5],
    ],
  },
  {
    title: 'Genre / style',
    labels: [
      ['electronic', 59],
      ['synthpop', 21],
      ['electropop', 16],
      ['techno', 16],
      ['easy listening', 13],
      ['ambient', 9],
    ],
  },
  {
    title: 'Instruments',
    labels: [
      ['synthesizer', 73],
      ['bass', 25],
      ['drums', 20],
      ['electric guitar', 13],
      ['drum machine', 11],
      ['sampler', 9],
    ],
  },
];

const energyValue = (index: number, incoming = false) => {
  const x = index / 119;
  const texture =
    Math.sin(index * (incoming ? 1.73 : 1.31)) * 0.035 +
    Math.sin(index * (incoming ? 0.41 : 0.57)) * 0.025;

  if (incoming) {
    if (x < 0.06) return 0.1 + x * 8.8 + texture;
    if (x > 0.94) return Math.max(0.06, 0.9 - (x - 0.94) * 14 + texture);
    return 0.78 + texture;
  }

  if (x < 0.11) return 0.54 + x * 1.1 + texture;
  if (x < 0.48) return 0.8 + texture;
  if (x < 0.6) return 0.52 + (x - 0.48) * 1.1 + texture;
  if (x < 0.71) return 0.69 - (x - 0.6) * 1.6 + texture;
  if (x < 0.73) return 0.22 + texture;
  if (x < 0.94) return 0.81 + texture;
  return Math.max(0.05, 0.72 - (x - 0.94) * 11 + texture);
};

export const OUTGOING_ENERGY = Array.from({ length: 120 }, (_, index) =>
  Math.max(0.04, Math.min(0.92, energyValue(index))),
);

export const INCOMING_ENERGY = Array.from({ length: 120 }, (_, index) =>
  Math.max(0.04, Math.min(0.92, energyValue(index, true))),
);
