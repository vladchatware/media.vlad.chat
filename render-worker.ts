// render-worker.ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { join } from 'path'

// Define the shape of the message received from the main thread
interface RenderRequest {
  id: string
  inputProps: Record<string, any>
}

// Helper to send messages back to the main thread
const postMessage = (message: any) => {
  // @ts-ignore
  self.postMessage(message)
}

// Listen for messages from the main thread
// @ts-ignore
self.onmessage = async (event: MessageEvent) => {
  const { id, inputProps } = event.data as RenderRequest

  try {
    console.log(`Worker: Starting render for ${id}...`)

    const bundled = await bundle({
      entryPoint: join(process.cwd(), 'remotion/index.ts'),
    })

    const composition = await selectComposition({
      serveUrl: bundled,
      id,
      inputProps: inputProps || {},
    })

    const outputLocation = `out/${id}-${Date.now()}.mp4`

    await renderMedia({
      composition,
      serveUrl: bundled,
      outputLocation,
      codec: 'h264'
    })

    console.log(`Worker: Render complete: ${outputLocation}`)
    postMessage({ success: true, path: outputLocation })
  } catch (err) {
    console.error('Worker Error:', err)
    postMessage({ success: false, error: String(err) })
  }
}

