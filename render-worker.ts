// render-worker.ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition, renderStill, renderFrames, OnStartData } from '@remotion/renderer'
import { join } from 'path'

// Define the shape of the message received from the main thread
interface RenderRequest {
  id: string
  inputProps: Record<string, any>
  outputName?: string
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
  const { id, inputProps, outputName, type } = event.data as RenderRequest

  try {
    console.log(`Worker: Starting render for ${id} (${type})...`)

    const bundled = await bundle({
      entryPoint: join(process.cwd(), 'remotion/index.ts'),
      publicDir: join(process.cwd(), 'remotion/public'),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          // Some dependencies leak Node-only requires (e.g. source-map -> url)
          // into the graph; they are never exercised at runtime.
          fallback: { ...config.resolve?.fallback, url: false, fs: false, path: false },
        },
      }),
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
      const stamp = Date.now()
      const dirName = `out/${id}-${stamp}`
      outputLocation = dirName

      await renderFrames({
        composition,
        serveUrl: bundled,
        outputDir: dirName,
        imageFormat: 'jpeg',
        inputProps: inputProps,
        onStart: function (data: OnStartData): void {
          console.log('Worker: Render started', data)
        },
        onFrameUpdate: function (framesRendered: number, frameIndex: number, timeToRenderInMilliseconds: number): void {
          console.log('Worker: Render frame update', framesRendered, frameIndex, timeToRenderInMilliseconds)
        }
      })

      const archive = `${dirName}.tar.gz`
      const archiveResult = Bun.spawnSync(['tar', '-czf', archive, '-C', 'out', `${id}-${stamp}`])
      if (archiveResult.exitCode !== 0) {
        throw new Error(`Failed to archive frames: ${archiveResult.stderr.toString()}`)
      }

      outputLocation = archive
    } else {
      outputLocation = `out/${outputName ?? `${id}-${Date.now()}.mp4`}`
      await renderMedia({
        composition,
        serveUrl: bundled,
        outputLocation,
        codec: 'h264',
        inputProps,
        concurrency: 2,
        timeoutInMilliseconds: 120000
      })
    }

    console.log(`Worker: Render complete: ${outputLocation}`)
    postMessage({ success: true, path: outputLocation })
  } catch (err) {
    console.error('Worker Error:', err)
    postMessage({ success: false, error: String(err) })
  }
}
