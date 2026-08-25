import { getRun } from 'workflow/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  try {
    const run = getRun(runId)
    
    // All properties are getters that return promises
    const [status, startedAt, completedAt] = await Promise.all([
      run.status,
      run.startedAt,
      run.completedAt,
    ])

    return Response.json({
      runId,
      status,
      startedAt,
      completedAt,
    })
  } catch (error) {
    return Response.json(
      { error: 'Workflow run not found', runId },
      { status: 404 }
    )
  }
}
