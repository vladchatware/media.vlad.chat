import { getRun } from 'workflow/api'
import type { ProgressEvent } from '../../../../../src/progress'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params
  const { searchParams } = new URL(request.url)

  // Support resuming from a specific index
  const startIndexParam = searchParams.get('startIndex')
  const startIndex = startIndexParam ? parseInt(startIndexParam, 10) : undefined

  try {
    const run = getRun(runId)
    const readable = run.getReadable<ProgressEvent>({ startIndex })

    // Transform the stream to Server-Sent Events format
    const encoder = new TextEncoder()
    const reader = readable.getReader()
    
    const sseStream = new ReadableStream({
      async start(controller) {
        const signal = request.signal
        try {
          let index = startIndex ?? 0
          while (true) {
            if (signal.aborted) break
            const { done, value } = await reader.read()
            if (done) break
            
            const sseMessage = `id: ${index}\nevent: progress\ndata: ${JSON.stringify(value)}\n\n`
            controller.enqueue(encoder.encode(sseMessage))
            index++
          }
          if (!signal.aborted) {
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))
          }
          controller.close()
        } catch (error) {
          if (!request.signal.aborted) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`))
          }
          controller.close()
        } finally {
          reader.cancel().catch(() => {})
        }
      },
      cancel() {
        reader.cancel().catch(() => {})
      }
    })

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    return Response.json(
      { error: 'Workflow run not found', runId },
      { status: 404 }
    )
  }
}
