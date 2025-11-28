import { getRun } from 'workflow/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  try {
    const run = getRun(runId)
    const result = await run.returnValue

    return Response.json({
      runId,
      success: true,
      result
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to get workflow result', runId, message },
      { status: 500 }
    )
  }
}
