import { start } from "workflow/api"
import { tweet } from "../../../workflows/tweet"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const content = searchParams.get('content')
    const voice = searchParams.get('voice') as 'ash' | 'onyx'

    if (!content || !voice) {
        return Response.json({ error: 'Missing content or voice' }, { status: 400 })
    }

    const run = await start(tweet, [content, voice])

    return Response.json({ runId: run.runId })
}