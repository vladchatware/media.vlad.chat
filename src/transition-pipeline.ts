import type { TransitionPayload } from '../remotion/BackroomFilm/TransitionCandidate';

export type EnergyArc = 'preserve' | 'build' | 'release' | 'reset';

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

const MUSIC_ORIGIN = 'https://music.vlad.chat';

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

// The renderer fetches audio over HTTP at render time, so any track served by
// music.vlad.chat works without committing assets to the repo.
const trackStreamUrl = (trackId: string) => `${MUSIC_ORIGIN}/api/tracks/${trackId}/stream`;

export const resolveTransitionPayload = async ({
  outgoingTrackId,
  candidateTrackId,
  energyArc,
}: {
  outgoingTrackId: string;
  candidateTrackId: string;
  energyArc: EnergyArc;
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
