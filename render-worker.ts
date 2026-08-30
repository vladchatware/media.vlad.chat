// render-worker.ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition, renderStill, renderFrames, OnStartData } from '@remotion/renderer'
import { head, put } from '@vercel/blob'
import { rm } from 'node:fs/promises'
import { basename, join } from 'path'
import {
  fetchFullAudioBytes,
  resolveTransitionPayload,
  type EnergyArc,
  type TransitionPayload,
} from './remotion/Backroom/payload'

// Define the shape of the message received from the main thread
interface RenderRequest {
  jobId: string
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

const backroomCompositionIds = new Set(['Backroom', 'TransitionCandidate'])

const assertTrackId = (value: unknown, field: string): string => {
  const trackId = String(value ?? '')
  if (!/^\d+$/.test(trackId)) throw new Error(`${field} must be a numeric SoundCloud track ID`)
  return trackId
}

const materializeTrackAudio = async (trackId: string): Promise<string> => {
  const pathname = `backroom-audio/${trackId}-full.mp3`
  try {
    const existing = await head(pathname)
    return existing.downloadUrl ?? existing.url
  } catch {
    // Missing from Blob; resolve and upload the full track below.
  }

  console.log(`Worker: Materializing full HLS audio for ${trackId}...`)
  const bytes = await fetchFullAudioBytes(trackId)
  try {
    const blob = await put(pathname, bytes, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'audio/mpeg',
    })
    return blob.downloadUrl ?? blob.url
  } catch (error) {
    // Another render may have populated the deterministic pathname first.
    try {
      const existing = await head(pathname)
      return existing.downloadUrl ?? existing.url
    } catch {
      throw error
    }
  }
}

const prepareInputProps = async (
  id: string,
  inputProps: Record<string, any>,
): Promise<Record<string, any>> => {
  if (!backroomCompositionIds.has(id)) return inputProps
  if (inputProps.payload) return inputProps

  const outgoingTrackId = assertTrackId(inputProps.outgoingTrackId, 'outgoingTrackId')
  const candidateTrackId = assertTrackId(inputProps.candidateTrackId, 'candidateTrackId')
  const energyArc = (inputProps.energyArc ?? 'preserve') as EnergyArc
  const resolved = await resolveTransitionPayload({ outgoingTrackId, candidateTrackId, energyArc })

  // Resolve sequentially. SoundCloud refresh tokens are single-use; concurrent
  // token rotations can invalidate each other when both cached tokens expire.
  const outgoingAudioFile = resolved.outgoing.audioFile.includes('/backroom-audio/')
    ? resolved.outgoing.audioFile
    : await materializeTrackAudio(outgoingTrackId)
  const incomingAudioFile = resolved.incoming.audioFile.includes('/backroom-audio/')
    ? resolved.incoming.audioFile
    : await materializeTrackAudio(candidateTrackId)
  const payload: TransitionPayload = {
    ...resolved,
    outgoing: { ...resolved.outgoing, audioFile: outgoingAudioFile },
    incoming: { ...resolved.incoming, audioFile: incomingAudioFile },
  }

  return { ...inputProps, payload }
}

// Listen for messages from the main thread
// @ts-ignore
self.onmessage = async (event: MessageEvent) => {
  const { jobId, id, inputProps, outputName, type } = event.data as RenderRequest

  try {
    console.log(`Worker: Starting render for ${id} (${type})...`)

    const preparedInputProps = await prepareInputProps(id, inputProps || {})

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
      inputProps: preparedInputProps,
    })

    let outputLocation = ''

    if (type === 'still') {
      outputLocation = `out/${jobId}.png`
      await renderStill({
        composition,
        serveUrl: bundled,
        output: outputLocation,
        inputProps: preparedInputProps,
      })
    } else if (type === 'sequence') {
      const dirName = `out/${jobId}`
      outputLocation = dirName

      await renderFrames({
        composition,
        serveUrl: bundled,
        outputDir: dirName,
        imageFormat: 'jpeg',
        inputProps: preparedInputProps,
        onStart: function (data: OnStartData): void {
          console.log('Worker: Render started', data)
        },
        onFrameUpdate: function (framesRendered: number, frameIndex: number, timeToRenderInMilliseconds: number): void {
          console.log('Worker: Render frame update', framesRendered, frameIndex, timeToRenderInMilliseconds)
        }
      })

      const archive = `${dirName}.tar.gz`
      const archiveResult = Bun.spawnSync(['tar', '-czf', archive, '-C', 'out', jobId])
      if (archiveResult.exitCode !== 0) {
        throw new Error(`Failed to archive frames: ${archiveResult.stderr.toString()}`)
      }
      await rm(dirName, { recursive: true, force: true })

      outputLocation = archive
    } else {
      outputLocation = `out/${jobId}-${outputName ? basename(outputName) : `${id}.mp4`}`
      await renderMedia({
        composition,
        serveUrl: bundled,
        outputLocation,
        codec: 'h264',
        inputProps: preparedInputProps,
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
