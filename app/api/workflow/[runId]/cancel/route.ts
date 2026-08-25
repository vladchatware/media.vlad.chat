import { getRun } from 'workflow/api'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  let run
  try {
    run = getRun(runId)
  } catch {
    return Response.json(
      { error: 'Workflow run not found', runId },
      { status: 404 }
    )
  }

  try {
    await run.cancel()

    return Response.json({
      success: true,
      runId,
      message: 'Workflow cancellation requested'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to cancel workflow', runId, message },
      { status: 500 }
    )
  }
}
