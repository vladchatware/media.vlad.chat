// Shared backroom API: pure fetch, safe in workflow steps and in Remotion
// components (browser bundle) alike.

export type EnergyArc = 'preserve' | 'build' | 'release' | 'reset';

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

type TrackMetadata = {
  id: number;
  duration: number;
  title: string;
  user?: {
    full_name?: string;
    username?: string;
  };
};

type TransitionSuggestion = {
  outgoing: { startSec: number; endSec: number };
  incoming: { startSec: number; endSec: number };
  wallDurationSec: number;
  incomingPlaybackRate: number;
  score: number;
  reasons: string[];
};

export const MUSIC_ORIGIN = 'https://music.vlad.chat';

export const trackStreamUrl = (trackId: string) => `${MUSIC_ORIGIN}/api/tracks/${trackId}/stream`;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.json() as Promise<T>;
};

const extractJsonArray = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = source.indexOf('[', markerIndex + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '[') depth++;
    else if (character === ']') {
      depth--;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
};

const readBestSuggestion = async (
  outgoingTrackId: string,
  candidateTrackId: string,
  energyArc: EnergyArc,
) => {
  const page = `${MUSIC_ORIGIN}/tracks/${outgoingTrackId}/backroom?with=${candidateTrackId}&arc=${energyArc}`;
  const response = await fetch(page, {
    headers: { 'user-agent': 'media.vlad.chat transition renderer' },
  });
  if (!response.ok) throw new Error(`Backroom request failed (${response.status})`);

  // Next's server-component payload escapes its JSON quotes. This route parsing
  // is a fallback until music.vlad.chat exposes suggestions as a dedicated API.
  const normalized = (await response.text()).replace(/\\+"/g, '"');
  const serialized = extractJsonArray(normalized, '"suggestions":');
  if (!serialized) throw new Error(`No transition suggestions found for ${candidateTrackId}`);
  const suggestions = JSON.parse(serialized) as TransitionSuggestion[];
  if (!suggestions[0]) throw new Error(`No playable transition for ${candidateTrackId}`);
  return { page, suggestion: suggestions[0] };
};

export const resolveTransitionPayload = async ({
  outgoingTrackId,
  candidateTrackId,
  energyArc = 'preserve',
}: {
  outgoingTrackId: string;
  candidateTrackId: string;
  energyArc?: EnergyArc;
}): Promise<TransitionPayload> => {
  const [{ page, suggestion }, outgoing, incoming] = await Promise.all([
    readBestSuggestion(outgoingTrackId, candidateTrackId, energyArc),
    fetchJson<TrackMetadata>(`${MUSIC_ORIGIN}/api/tracks/${outgoingTrackId}`),
    fetchJson<TrackMetadata>(`${MUSIC_ORIGIN}/api/tracks/${candidateTrackId}`),
  ]);

  return {
    source: { page },
    outgoing: {
      id: outgoingTrackId,
      artist: outgoing.user?.full_name || outgoing.user?.username || 'Unknown',
      title: outgoing.title,
      durationSec: outgoing.duration / 1000,
      audioFile: trackStreamUrl(outgoingTrackId),
      window: suggestion.outgoing,
    },
    incoming: {
      id: candidateTrackId,
      artist: incoming.user?.full_name || incoming.user?.username || 'Unknown',
      title: incoming.title,
      durationSec: incoming.duration / 1000,
      audioFile: trackStreamUrl(candidateTrackId),
      window: suggestion.incoming,
    },
    transition: {
      score: suggestion.score,
      blendSec: suggestion.wallDurationSec,
      incomingPlaybackRate: suggestion.incomingPlaybackRate,
      reasons: suggestion.reasons,
    },
  };
};

// ---------- Per-track analysis display (behavior / taxonomy / energy) ----------

export type TrackDisplay = {
  id: string;
  artist: string;
  title: string;
  duration: string; // m:ss
  durationSec: number;
  mixIn: string;
  mixOut: string;
  cue: string;
  behavior: { label: string; value: number }[];
  taxonomy: { title: string; labels: [string, number][] }[];
  energy: number[]; // 120 samples, 0..1
};

type StoredAnalysis = {
  sourceTrackId: string;
  durationSec: number;
  structure?: { sections?: Array<{ startTime: number; endTime: number; energy: number }> };
  segments?: Array<Record<string, unknown>>;
  cuePoints?: { mixInSec: number; mixOutSec: number };
};

const formatDuration = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const averageOf = (segments: Array<Record<string, unknown>>, key: string): number | null => {
  const values = segments
    .map((segment) => segment[key])
    .filter((value): value is number => typeof value === 'number');
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const topLabels = (dict: unknown, limit: number): [string, number][] => {
  if (!dict || typeof dict !== 'object') return [];
  return Object.entries(dict as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => [label, Math.round(value * 100)] as [string, number]);
};

export const fetchTrackAnalysis = async (trackId: string): Promise<StoredAnalysis> => {
  const response = await fetch(`${MUSIC_ORIGIN}/api/tracks/${trackId}/analysis`);
  if (!response.ok) throw new Error(`Analysis request failed (${response.status}) for ${trackId}`);
  return response.json() as Promise<StoredAnalysis>;
};

const fetchSoundcloudMeta = async (trackId: string) => {
  const meta = await fetchJson<{
    title: string;
    duration: number;
    user?: { full_name?: string; username?: string };
  }>(`${MUSIC_ORIGIN}/api/tracks/${trackId}`);
  return {
    artist: meta.user?.full_name || meta.user?.username || 'Unknown',
    title: meta.title,
    durationSec: meta.duration / 1000,
  };
};

export const deriveTrackDisplay = (
  trackId: string,
  analysis: StoredAnalysis,
  meta?: { artist: string; title: string; durationSec: number },
): TrackDisplay => {
  const segments = analysis.segments ?? [];

  const behaviorValue = (key: string, fallback: number) =>
    Math.round((averageOf(segments, key) ?? fallback / 100) * 100);

  const sections = analysis.structure?.sections ?? [];
  const totalSec =
    analysis.durationSec || sections[sections.length - 1]?.endTime || meta?.durationSec || 30;

  // Sample section energies into a fixed-length curve.
  const samples = Array.from({ length: 120 }, (_, index) => {
    const time = (index / 119) * totalSec;
    const section = sections.find(
      (part) => time >= part.startTime && time < part.endTime,
    );
    const raw = section?.energy ?? 0.5;
    return Math.max(0.04, Math.min(0.92, raw));
  });

  return {
    id: trackId,
    artist: meta?.artist ?? 'Unknown',
    title: meta?.title ?? 'Unknown',
    durationSec: totalSec,
    duration: formatDuration(totalSec),
    mixIn: formatDuration(analysis.cuePoints?.mixInSec ?? 0),
    cue: formatDuration(analysis.cuePoints?.mixInSec ?? 0),
    mixOut: formatDuration(analysis.cuePoints?.mixOutSec ?? totalSec),
    behavior: [
      { label: 'Danceability', value: behaviorValue('danceability', 50) },
      { label: 'Approachability', value: behaviorValue('approachability', 40) },
      { label: 'Engagement', value: behaviorValue('engagement', 60) },
      { label: 'Valence', value: behaviorValue('valence', 50) },
      { label: 'Arousal', value: behaviorValue('arousal', 45) },
      { label: 'Vocal presence', value: behaviorValue('vocalProbability', 10) },
    ],
    taxonomy: [
      { title: 'Mirex mood', labels: topLabels(segments[0]?.mirexMood, 5) },
      { title: 'Mood / theme', labels: topLabels(segments[0]?.themes, 6) },
      { title: 'Genre / style', labels: topLabels(segments[0]?.genres, 6) },
      { title: 'Instruments', labels: topLabels(segments[0]?.instruments, 6) },
    ],
    energy: samples,
  };
};

export const fetchTrackDisplay = async (trackId: string): Promise<TrackDisplay> => {
  const [analysis, meta] = await Promise.all([
    fetchTrackAnalysis(trackId),
    fetchSoundcloudMeta(trackId).catch(() => undefined),
  ]);
  return deriveTrackDisplay(trackId, analysis, meta);
};
