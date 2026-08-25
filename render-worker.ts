// render-worker.ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition, renderStill, renderFrames, OnStartData } from '@remotion/renderer'
import { join } from 'path'

// Define the shape of the message received from the main thread
interface RenderRequest {
  id: string
  inputProps: Record<string, any>
  type: 'video' | 'still' | 'sequence'
}

// Helper to send messages back to the main thread
const postMessage = (message: any) => {
  // @ts-ignore
  self.postMessage(message)
}

// Listen for messages from the main thread
// @ts-ignore
self.onmessage = async (event: MessageEvent) => {
  const { id, inputProps, type } = event.data as RenderRequest

  try {
    console.log(`Worker: Starting render for ${id} (${type})...`)

    const bundled = await bundle({
      entryPoint: join(process.cwd(), 'remotion/index.ts'),
    })

    const composition = await selectComposition({
      serveUrl: bundled,
      id,
      inputProps: inputProps || {},
    })

    let outputLocation = ''

    if (type === 'still') {
      outputLocation = `out/${id}-${Date.now()}.png`
      await renderStill({
        composition,
        serveUrl: bundled,
        output: outputLocation,
      })
    } else if (type === 'sequence') {
      outputLocation = `out/${id}-${Date.now()}`

      await renderFrames({
        composition,
        serveUrl: bundled,
        outputDir: outputLocation,
        imageFormat: 'jpeg',
        inputProps: inputProps,
        onStart: function (data: OnStartData): void {
          console.log('Worker: Render started', data)
        },
        onFrameUpdate: function (framesRendered: number, frameIndex: number, timeToRenderInMilliseconds: number): void {
          console.log('Worker: Render frame update', framesRendered, frameIndex, timeToRenderInMilliseconds)
        }
      })

    } else {
      outputLocation = `out/${id}-${Date.now()}.mp4`
      await renderMedia({
        composition,
        serveUrl: bundled,
        outputLocation,
        codec: 'h264'
      })
    }

    console.log(`Worker: Render complete: ${outputLocation}`)
    postMessage({ success: true, path: outputLocation })
  } catch (err) {
    console.error('Worker Error:', err)
    postMessage({ success: false, error: String(err) })
  }
}

