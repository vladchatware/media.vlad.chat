import { z } from 'zod/v3';

// Zod mirrors of the payload types for Remotion composition props.

export const trackPayloadSchema = z.object({
  id: z.string(),
  artist: z.string(),
  title: z.string(),
  durationSec: z.number(),
  bpm: z.number().nullable(),
  camelotKey: z.string().nullable(),
  meanEnergy: z.number().nullable(),
  beats: z.number().nullable(),
  downbeats: z.number().nullable(),
  mixInSec: z.number(),
  mixOutSec: z.number(),
  cueReason: z.string().nullable(),
  cueConfidence: z.number().nullable(),
  energy: z.array(z.number()),
  sections: z.array(
    z.object({ startSec: z.number(), endSec: z.number(), type: z.string() }),
  ),
  segments: z.array(
    z.object({ id: z.string(), section: z.string(), startSec: z.number(), endSec: z.number() }),
  ),
  behavior: z.array(z.object({ label: z.string(), value: z.number() })),
  taxonomy: z.array(
    z.object({ title: z.string(), labels: z.array(z.tuple([z.string(), z.number()])) }),
  ),
  analysisVersion: z.string().nullable(),
  artworkUrl: z.string().nullable(),
  audioFile: z.string(),
});

export const transitionPayloadSchema = z.object({
  energyArc: z.enum(['preserve', 'build', 'release', 'reset']),
  outgoing: trackPayloadSchema,
  incoming: trackPayloadSchema,
  windows: z.object({
    outgoing: z.object({ startSec: z.number(), endSec: z.number() }),
    incoming: z.object({ startSec: z.number(), endSec: z.number() }),
  }),
  transition: z.object({
    score: z.number(),
    blendSec: z.number(),
    incomingPlaybackRate: z.number(),
    reasons: z.array(z.string()),
  }),
});

const trackIdsSchema = z.object({
  outgoingTrackId: z.string().min(1),
  candidateTrackId: z.string().min(1),
  energyArc: z.enum(['preserve', 'build', 'release', 'reset']).optional(),
});

export const BackroomSchema = trackIdsSchema;

export const TransitionCandidateSchema = trackIdsSchema.extend({
  leadInSec: z.number().optional(),
  postSec: z.number().optional(),
});
