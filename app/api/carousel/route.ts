import { start } from "workflow/api"
import { carousel } from "../../../workflows/carousel"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const prompt = searchParams.get('prompt')

    if (!prompt) {
        return Response.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const run = await start(carousel, [prompt])

    return Response.json({ runId: run.runId })
}