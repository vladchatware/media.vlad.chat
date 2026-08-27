// E2E: track ID in → render-ready props out.
// Discovers the best analyzed candidate (music.vlad.chat candidates API),
// resolves the full payload (analysis/metadata APIs), materializes full
// audio to Vercel Blob — the same path the workflows use.
// Run: bun --env-file=.env.local --env-file=.env.vercel-contents scripts/backroom-e2e.ts <outgoingId> [candidateId] [outProps]
// Without candidateId the best candidate is picked automatically.

import { writeFileSync } from 'node:fs';
import { head, put } from '@vercel/blob';
import {
  fetchFullAudioBytes,
  fetchRankedCandidates,
  resolveTransitionPayload,
} from '../remotion/Backroom/payload';

const [outgoingId, candidateArg, out = 'out/props.json'] = process.argv.slice(2);
if (!outgoingId) {
  console.error('usage: bun scripts/backroom-e2e.ts <outgoingId> [candidateId] [outProps]');
  process.exit(1);
}

const materialize = async (trackId: string): Promise<string> => {
  const pathname = `backroom-audio/${trackId}-full.mp3`;
  try {
    const existing = await head(pathname);
    return existing.downloadUrl ?? existing.url;
  } catch {
    // not stored yet
  }
  const bytes = await fetchFullAudioBytes(trackId);
  const blob = await put(pathname, bytes, {
    access: 'public',
    contentType: 'audio/mpeg',
    addRandomSuffix: false,
  });
  return blob.url;
};

let candidateId = candidateArg;
if (!candidateId) {
  const candidates = await fetchRankedCandidates(outgoingId, 'preserve', 5);
  if (candidates.length === 0) throw new Error(`No analyzed candidates for ${outgoingId}`);
  candidateId = candidates[0].trackId;
  console.log(`best candidate: ${candidateId} (score ${candidates[0].score.toFixed(3)})`);
}

const resolved = await resolveTransitionPayload({
  outgoingTrackId: outgoingId,
  candidateTrackId: candidateId,
});

console.log('outgoing:', resolved.outgoing.artist, '—', resolved.outgoing.title, `(${resolved.outgoing.durationSec.toFixed(0)}s, ${resolved.outgoing.bpm?.toFixed(1)} BPM ${resolved.outgoing.camelotKey})`);
console.log('incoming:', resolved.incoming.artist, '—', resolved.incoming.title, `(${resolved.incoming.durationSec.toFixed(0)}s, ${resolved.incoming.bpm?.toFixed(1)} BPM ${resolved.incoming.camelotKey})`);
console.log('window: OUT', resolved.windows.outgoing.startSec.toFixed(1) + 's → IN', resolved.windows.incoming.startSec.toFixed(1) + 's, blend', resolved.transition.blendSec.toFixed(1) + 's, score', resolved.transition.score.toFixed(3));

console.log('materializing full audio to blob…');
resolved.outgoing.audioFile = await materialize(outgoingId);
resolved.incoming.audioFile = await materialize(candidateId);

writeFileSync(out, JSON.stringify({ payload: resolved }));
console.log('wrote', out);
