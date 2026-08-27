// Backroom payload: typed composition props plus a server-side resolver.
// The resolver runs ONLY in workflow steps (Node) — compositions are pure
// functions of the resolved payload, with no fetching at render time.

export type EnergyArc = 'preserve' | 'build' | 'release' | 'reset';

export type TrackPayload = {
  id: string;
  artist: string;
  title: string;
  durationSec: number;
  bpm: number | null;
  camelotKey: string | null;
  meanEnergy: number | null;
  beats: number | null;
  downbeats: number | null;
  mixInSec: number;
  mixOutSec: number;
  cueReason: string | null;
  cueConfidence: number | null;
  energy: number[]; // normalized 0..1 curve
  sections: { startSec: number; endSec: number; type: string }[];
  segments: { id: string; section: string; startSec: number; endSec: number }[];
  behavior: { label: string; value: number }[];
  taxonomy: { title: string; labels: [string, number][] }[];
  analysisVersion: string | null;
  artworkUrl: string | null;
  audioFile: string;
};

export type TransitionPayload = {
  energyArc: EnergyArc;
  outgoing: TrackPayload;
  incoming: TrackPayload;
  windows: {
    outgoing: { startSec: number; endSec: number };
    incoming: { startSec: number; endSec: number };
  };
  transition: {
    score: number;
    blendSec: number;
    incomingPlaybackRate: number;
    reasons: string[];
  };
};

export const MUSIC_ORIGIN = 'https://music.vlad.chat';

export const trackStreamUrl = (trackId: string) =>
  `${MUSIC_ORIGIN}/api/tracks/${trackId}/stream`;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response.json() as Promise<T>;
};

// ---------------------------------------------------------------------------
// Stored analysis → display payload
// ---------------------------------------------------------------------------

type StoredAnalysis = {
  analysisVersion: string;
  durationSec: number;
  tempo?: { bpm?: number; confidence?: number; beatsSec?: number[]; downbeatsSec?: number[] };
  tonal?: { camelotKey?: string; key?: string };
  energy?: { samples?: number[] };
  structure?: { sections?: Array<{ startTime: number; endTime: number; type?: string; energy?: number }> };
  segments?: Array<Record<string, unknown>>;
  cuePoints?: { mixInSec?: number; mixOutSec?: number; reason?: string; confidence?: number };
};

const formatClock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const averageOf = (segments: Array<Record<string, unknown>>, key: string): number | null => {
  const values = segments.map((s) => s[key]).filter((v): v is number => typeof v === 'number');
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
};

const topLabels = (dict: unknown, limit: number): [string, number][] => {
  if (!dict || typeof dict !== 'object') return [];
  return Object.entries(dict as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => [label, Math.round(value * 100)] as [string, number]);
};

// Resample the stored energy curve (or section energies) to a fixed length.
const energyCurve = (analysis: StoredAnalysis, points = 140): number[] => {
  const samples = analysis.energy?.samples ?? [];
  const sections = analysis.structure?.sections ?? [];
  const totalSec = analysis.durationSec || sections.at(-1)?.endTime || 1;

  if (samples.length > 3) {
    return Array.from({ length: points }, (_, i) => {
      const t = (i / (points - 1)) * samples.length;
      const a = samples[Math.floor(t)] ?? 0;
      const b = samples[Math.ceil(t)] ?? a;
      const v = a + (b - a) * (t - Math.floor(t));
      return Math.max(0.04, Math.min(0.98, v));
    });
  }

  return Array.from({ length: points }, (_, i) => {
    const t = (i / (points - 1)) * totalSec;
    const section = sections.find((s) => t >= s.startTime && t < s.endTime);
    return Math.max(0.04, Math.min(0.92, section?.energy ?? 0.5));
  });
};

const metaArtwork = (meta: { artwork_url?: string } | null) =>
  meta?.artwork_url?.replace('-large', '-t500x500') ?? null;

export const deriveTrackPayload = (
  trackId: string,
  analysis: StoredAnalysis | null | undefined,
  meta: {
    title: string;
    duration: number;
    artwork_url?: string;
    user?: { full_name?: string; username?: string };
  } | null,
): TrackPayload => {
  const segments = analysis?.segments ?? [];
  const sections = analysis?.structure?.sections ?? [];
  const durationSec = analysis?.durationSec || meta?.duration / 1000 || 30;

  const behaviorValue = (key: string, fallback: number) =>
    Math.round((averageOf(segments, key) ?? fallback / 100) * 100);

  const hasAnalysis = Boolean(analysis);
  const taxonomy = hasAnalysis
    ? [
        { title: 'Mirex mood', labels: topLabels(segments[0]?.mirexMood, 5) },
        { title: 'Mood / theme', labels: topLabels(segments[0]?.themes, 6) },
        { title: 'Genre / style', labels: topLabels(segments[0]?.genres, 6) },
        { title: 'Instruments', labels: topLabels(segments[0]?.instruments, 6) },
      ]
    : [];

  return {
    id: trackId,
    artist: meta?.user?.full_name || meta?.user?.username || 'Unknown artist',
    title: meta?.title ?? `Track ${trackId}`,
    durationSec,
    bpm: analysis?.tempo?.bpm ?? null,
    camelotKey: analysis?.tonal?.camelotKey ?? analysis?.tonal?.key ?? null,
    meanEnergy: averageOf(segments, 'energy'),
    beats: analysis?.tempo?.beatsSec?.length ?? null,
    downbeats: analysis?.tempo?.downbeatsSec?.length ?? null,
    mixInSec: analysis?.cuePoints?.mixInSec ?? 0,
    mixOutSec: analysis?.cuePoints?.mixOutSec ?? durationSec,
    cueReason: analysis?.cuePoints?.reason ?? null,
    cueConfidence: analysis?.cuePoints?.confidence ?? null,
    energy: energyCurve(analysis ?? { analysisVersion: '', durationSec: 0 } as StoredAnalysis),
    sections: sections.map((s) => ({
      startSec: s.startTime,
      endSec: s.endTime,
      type: s.type ?? 'unknown',
    })),
    segments: segments.map((s, index) => ({
      id: String(s.id ?? `s${index}`),
      section: String(s.section ?? 'unknown'),
      startSec: Number(s.startSec ?? 0),
      endSec: Number(s.endSec ?? 0),
    })),
    behavior: [
      { label: 'Danceability', value: behaviorValue('danceability', 50) },
      { label: 'Approachability', value: behaviorValue('approachability', 40) },
      { label: 'Engagement', value: behaviorValue('engagement', 60) },
      { label: 'Valence', value: behaviorValue('valence', 50) },
      { label: 'Arousal', value: behaviorValue('arousal', 45) },
      { label: 'Vocal presence', value: behaviorValue('vocalProbability', 10) },
    ],
    taxonomy,
    analysisVersion: analysis?.analysisVersion ?? null,
    artworkUrl: metaArtwork(meta),
    audioFile: trackStreamUrl(trackId),
  };
};

// ---------------------------------------------------------------------------
// Server-side resolver (workflow steps only)
// ---------------------------------------------------------------------------

export const fetchStoredAnalysis = async (trackId: string): Promise<StoredAnalysis | null> => {
  const response = await fetch(`${MUSIC_ORIGIN}/api/tracks/${trackId}/analysis`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Analysis request failed (${response.status}) for ${trackId}`);
  return (await response.json()) as StoredAnalysis;
};

export const fetchTrackPayload = async (trackId: string): Promise<TrackPayload> => {
  const [analysis, meta] = await Promise.all([
    fetchStoredAnalysis(trackId).catch(() => null),
    fetchJson<{
      title: string;
      duration: number;
      artwork_url?: string;
      user?: { full_name?: string; username?: string };
    }>(
      `${MUSIC_ORIGIN}/api/tracks/${trackId}`,
    ).catch(() => null),
  ]);
  return deriveTrackPayload(trackId, analysis, meta);
};

type SuggestionsResponse = {
  outgoingTrackId: string;
  incomingTrackId: string;
  energyArc: EnergyArc;
  suggestions: Array<{
    outgoing: { startSec: number; endSec: number };
    incoming: { startSec: number; endSec: number };
    wallDurationSec: number;
    incomingPlaybackRate: number;
    score: number;
    reasons: string[];
  }>;
};

const readBestSuggestion = async (
  outgoingTrackId: string,
  candidateTrackId: string,
  energyArc: EnergyArc,
) => {
  const response = await fetch(
    `${MUSIC_ORIGIN}/api/tracks/${outgoingTrackId}/transitions?with=${candidateTrackId}&arc=${energyArc}`,
  );
  if (!response.ok) throw new Error(`Transitions request failed (${response.status}) for ${candidateTrackId}`);
  const data = (await response.json()) as SuggestionsResponse;
  const suggestion = data.suggestions[0];
  if (!suggestion) throw new Error(`No playable transition for ${candidateTrackId}`);
  return suggestion;
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
  const [suggestion, outgoing, incoming] = await Promise.all([
    readBestSuggestion(outgoingTrackId, candidateTrackId, energyArc),
    fetchTrackPayload(outgoingTrackId),
    fetchTrackPayload(candidateTrackId),
  ]);

  return {
    energyArc,
    outgoing,
    incoming,
    windows: {
      outgoing: suggestion.outgoing,
      incoming: suggestion.incoming,
    },
    transition: {
      score: suggestion.score,
      blendSec: suggestion.wallDurationSec,
      incomingPlaybackRate: suggestion.incomingPlaybackRate,
      reasons: suggestion.reasons,
    },
  };
};

// Ensure both tracks have a stored analysis before resolving. Enqueues via
// the track endpoint (same path the desk's AnalysisEnqueue button uses) and
// polls the public analysis API. Call from a workflow with sleeps in between.
export const missingAnalyses = async (trackIds: string[]): Promise<string[]> => {
  const results = await Promise.all(
    trackIds.map(async (id) => ((await fetchStoredAnalysis(id).catch(() => null)) ? null : id)),
  );
  return results.filter((id): id is string => Boolean(id));
};

export const enqueueAnalysis = async (trackId: string): Promise<void> => {
  const response = await fetch(`${MUSIC_ORIGIN}/api/tracks/${trackId}?force=true`);
  if (!response.ok) throw new Error(`Analysis enqueue failed (${response.status}) for ${trackId}`);
};

// ---------------------------------------------------------------------------
// Full-audio resolution (workflow steps only)
// ---------------------------------------------------------------------------

// Short-lived service access tokens come from the central endpoint, which
// owns the refresh token and persists rotations (single-use refresh tokens).
const fetchServiceAccessToken = async (
  siteUrl: string,
  secret: string,
  rotate: boolean,
): Promise<string | null> => {
  const res = await fetch(`${siteUrl}/soundcloud/service-access-token`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      soundcloudUserId: process.env.SOUNDCLOUD_USER_ID || undefined,
      rotate,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const { accessToken } = (await res.json()) as { accessToken?: string };
  return accessToken ?? null;
};

export type FullAudio =
  | { kind: 'progressive'; url: string }
  | { kind: 'hls'; url: string; segments: string[] };

// Resolve the FULL track audio (never the 30s preview) the same way
// music.vlad.chat's worker does: service credentials from its Convex endpoint
// (refreshing the user token on 401), then the SoundCloud streams API.
// Some tracks only expose an HLS playlist — its signed mp3 segment URLs are
// returned so callers can concatenate them (raw mp3 segments concat cleanly).
export const resolveFullAudio = async (trackId: string): Promise<FullAudio | null> => {
  const secret = process.env.ANALYSIS_SERVICE_SECRET;
  const siteUrl = process.env.CONVEX_SITE_URL?.replace(/\/+$/, '').replace(/\/api$/, '');
  if (!secret || !siteUrl) return null;

  const fetchStreams = async (token: string) =>
    fetch(`https://api.soundcloud.com/tracks/soundcloud:tracks:${trackId}/streams`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

  let token = await fetchServiceAccessToken(siteUrl, secret, false);
  if (!token) return null;
  let streamsRes = await fetchStreams(token);
  if (streamsRes.status === 401) {
    console.log(`Service token rejected for ${trackId}, rotating…`);
    token = await fetchServiceAccessToken(siteUrl, secret, true);
    if (!token) return null;
    streamsRes = await fetchStreams(token);
  }
  if (!streamsRes.ok) return null;
  const streams = (await streamsRes.json()) as {
    http_mp3_128_url?: string;
    hls_mp3_128_url?: string;
  };

  if (streams.http_mp3_128_url) {
    // Probe the CDN so the URL we hand to the renderer is the post-redirect
    // signed link (Range: bytes=0-0 mirrors music.vlad.chat's resolver).
    const probe = await fetch(streams.http_mp3_128_url, {
      headers: { Authorization: `Bearer ${token}`, Range: 'bytes=0-0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    await probe.body?.cancel();
    if (!probe.ok) return null;
    return { kind: 'progressive', url: probe.url };
  }

  if (streams.hls_mp3_128_url) {
    // The HLS endpoint 302s to a signed playlist; follow it with auth.
    const playlistRes = await fetch(streams.hls_mp3_128_url, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!playlistRes.ok) return null;
    const playlist = await playlistRes.text();
    const segments = playlist
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    if (segments.length === 0) return null;
    return { kind: 'hls', url: playlistRes.url, segments };
  }

  return null;
};

// ---------------------------------------------------------------------------
// Candidate discovery (server-side)
// ---------------------------------------------------------------------------

export type RankedCandidate = {
  trackId: string;
  score: number;
  bpm: number | null;
  camelotKey: string | null;
};

// Ranked transition candidates for an outgoing track, via the public
// candidates endpoint (same ranking the backroom desk renders).
export const fetchRankedCandidates = async (
  outgoingTrackId: string,
  energyArc: EnergyArc,
  limit = 5,
): Promise<RankedCandidate[]> => {
  const response = await fetch(
    `${MUSIC_ORIGIN}/api/tracks/${outgoingTrackId}/transitions/candidates?arc=${energyArc}&limit=${limit}`,
  );
  if (!response.ok) throw new Error(`Candidates request failed (${response.status}) for ${outgoingTrackId}`);
  const data = (await response.json()) as { candidates: RankedCandidate[] };
  return data.candidates;
};

// Download the full audio as a Buffer (segments concatenated for HLS).
export const fetchFullAudioBytes = async (trackId: string): Promise<Buffer> => {
  const audio = await resolveFullAudio(trackId);
  if (!audio) throw new Error(`No full stream available for track ${trackId}`);

  if (audio.kind === 'progressive') {
    const response = await fetch(audio.url, { redirect: 'follow' });
    if (!response.ok || !response.body) {
      throw new Error(`Audio download failed (${response.status}) for ${trackId}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const parts: Buffer[] = [];
  for (const segment of audio.segments) {
    const response = await fetch(segment);
    if (!response.ok) throw new Error(`HLS segment failed (${response.status}) for ${trackId}`);
    parts.push(Buffer.from(await response.arrayBuffer()));
  }
  return Buffer.concat(parts);
};
