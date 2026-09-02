import { sleep } from 'workflow'
import { BlobNotFoundError, head } from '@vercel/blob'
import { basename } from 'path'
import { createRenderJobId, enqueueRender } from '../lib/server/renderQueue'
import type { RenderType } from '../lib/renderQueueMessage'

type RenderOutput = {
    success: true
    url: string
    pathname: string
    path: string
    jobId: string
}

// The renderer uploads finished output to a deterministic Blob pathname:
//   renderer.ts: `renders/${jobId}-${basename(outputLocation)}`
//   render-worker.ts outputLocation:
//     still    -> out/${jobId}.png
//     sequence -> out/${jobId}.tar.gz
//     video    -> out/${jobId}-${outputName || `${id}.mp4`}
// so the workflow can await completion by polling Blob directly, with no
// route back into the renderer host.
const expectedBlobPathname = (jobId: string, id: string, type: RenderType, outputName?: string): string => {
    if (type === 'still') return `renders/${jobId}-${jobId}.png`
    if (type === 'sequence') return `renders/${jobId}-${jobId}.tar.gz`
    const name = outputName ? basename(outputName) : `${id}.mp4`
    return `renders/${jobId}-${jobId}-${name}`
}

const findRenderOutput = async (pathname: string) => {
    "use step"

    try {
        const blob = await head(pathname)
        return { url: blob.downloadUrl ?? blob.url, pathname: blob.pathname ?? pathname }
    } catch (error) {
        if (error instanceof BlobNotFoundError) return null
        throw error
    }
}

const render = async (
    id: string,
    inputProps: Record<string, any>,
    type: RenderType,
    outputName?: string,
): Promise<RenderOutput> => {
    const jobId = await createRenderJobId()
    await enqueueRender(jobId, id, inputProps, type, outputName)
    const pathname = expectedBlobPathname(jobId, id, type, outputName)

    // Queue wait time is included, so allow enough headroom for backpressure.
    for (let attempt = 0; attempt < 360; attempt++) {
        await sleep(5000)

        const output = await findRenderOutput(pathname)

        if (output) {
            return { success: true, url: output.url, pathname: output.pathname, path: output.pathname, jobId }
        }
    }

    throw new Error(`Render timed out: ${jobId} (no output at ${pathname})`)
}

// composition, content
// generates sound
export const still = async (id: string, inputProps: Record<string, any>) => {
    return render(id, inputProps, 'still')
}

// composition, story
// generates image
export const sequence = async (id: string, inputProps: Record<string, any>) => {
    return render(id, inputProps, 'sequence')
}

// composition, story
// generates image, sound, captions
export const video = async (id: string, inputProps: Record<string, any>, outputName?: string) => {
    return render(id, inputProps, 'video', outputName)
}
