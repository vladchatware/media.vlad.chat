import { getRun } from 'workflow/api'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  try {
    const run = getRun(runId)
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

