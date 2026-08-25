import { getRun } from "workflow/api"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const runId = searchParams.get('runId')

    if (!runId) {
        return Response.json({ error: 'Missing runId' }, { status: 400 })
    }

    const run = getRun(runId)
    const status = await run.status

    if (status !== 'completed') {
        return Response.json({ runId, status })
    }

    const result = await run.returnValue

    return Response.json({ runId, status, result })
}