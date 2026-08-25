import { getRun } from 'workflow/api'

export async function GET(
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
