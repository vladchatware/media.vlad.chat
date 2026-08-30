import { sleep } from 'workflow'
import { createRenderJobId, enqueueRender } from '../lib/server/renderQueue'
import type { RenderType } from '../lib/renderQueueMessage'

export const rendererUrl = process.env.RENDERER_URL || 'http://localhost:3001'
const rendererSecret = process.env.RENDERER_SECRET

export const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    if (rendererSecret) {
        headers.Authorization = `Bearer ${rendererSecret}`
    }

    return headers
}

type RenderStatus = {
    status?: 'pending' | 'running' | 'done' | 'error'
    path?: string
    url?: string
    pathname?: string
    error?: string
}

const getRenderStatus = async (jobId: string) => {
    "use step"

    let response: Response
    try {
        response = await fetch(`${rendererUrl}/api/render/${jobId}`, {
            headers: authHeaders()
        })
    } catch {
        return { status: 'pending' as const }
    }
    if (!response.ok) {
        if (response.status >= 500) return { status: 'pending' as const }
        const result = await response.json().catch(() => ({})) as RenderStatus
        throw new Error(result.error || `Render status failed: ${response.status}`)
    }
    const result = await response.json() as RenderStatus

    return result
}

const render = async (
    id: string,
    inputProps: Record<string, any>,
    type: RenderType,
    outputName?: string,
) => {
    const jobId = await createRenderJobId()
    await enqueueRender(jobId, id, inputProps, type, outputName)

    // Queue wait time is included, so allow enough headroom for backpressure.
    for (let attempt = 0; attempt < 360; attempt++) {
        await sleep(5000)

        const result = await getRenderStatus(jobId)

        if (result.status === 'done') {
            if (!result.url) {
                throw new Error(`Render completed without output: ${jobId}`)
            }
            const path = result.pathname ?? result.path
            return { success: true, url: result.url, pathname: result.pathname, path, jobId }
        }
        if (result.status === 'error') {
            throw new Error(result.error || 'Render failed')
        }
    }

    throw new Error(`Render timed out: ${jobId}`)
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
