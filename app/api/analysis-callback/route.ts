import { start } from "workflow/api";
import { backroomFilm, backroomForTrack } from "../../../workflows/transitions";

// Webhook target for analysis-completion callbacks. The worker POSTs here
// when an analysis it enqueued with our callbackUrl finishes (or dies) —
// this re-runs the render workflow, which proceeds if everything is ready
// or re-schedules. No polling, one Convex-touching call per workflow run.

const ARCS = ["preserve", "build", "release", "reset"] as const;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const outgoingTrackId = searchParams.get("outgoingTrackId") ?? "";
  const candidateTrackId = searchParams.get("candidateTrackId");
  const arc = (ARCS as readonly string[]).includes(searchParams.get("arc") ?? "")
    ? (searchParams.get("arc") as (typeof ARCS)[number])
    : "preserve";
  const key = searchParams.get("key") ?? "";
  const expected = process.env.ANALYSIS_SERVICE_SECRET ?? "";
  if (!expected || key !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!/^\d+$/.test(outgoingTrackId)) {
    return Response.json({ error: "outgoingTrackId is required" }, { status: 400 });
  }

  const run = candidateTrackId && /^\d+$/.test(candidateTrackId)
    ? await start(backroomFilm, [outgoingTrackId, candidateTrackId, arc])
    : await start(backroomForTrack, [outgoingTrackId, arc]);
  return Response.json({ ok: true, runId: run.runId });
}
