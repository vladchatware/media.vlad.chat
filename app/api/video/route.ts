import { start } from "workflow/api"
import { video } from '../../../workflows/video'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const prompt = searchParams.get('prompt')

    if (!prompt) {
        return Response.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const run = await start(video, [prompt])

    return Response.json({ runId: run.runId })
}