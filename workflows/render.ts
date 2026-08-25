import { sleep } from 'workflow'
import { put } from '@vercel/blob'
import { basename } from 'path'

const rendererUrl = process.env.RENDERER_URL || 'http://localhost:3001'
const rendererSecret = process.env.RENDERER_SECRET

const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    if (rendererSecret) {
        headers.Authorization = `Bearer ${rendererSecret}`
    }

    return headers
}

type RenderSubmission = {
    success: boolean
    jobId?: string
    error?: string
}

type RenderStatus = {
    status?: 'pending' | 'running' | 'done' | 'error'
    path?: string
    error?: string
}

const submitRender = async (id: string, inputProps: Record<string, any>, type: string) => {
    "use step"

    const response = await fetch(`${rendererUrl}/api/render`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id, inputProps, type })
    })
    const submitted = await response.json() as RenderSubmission

    if (!response.ok || !submitted.success || !submitted.jobId) {
        throw new Error(submitted.error || `Render submission failed: ${response.status}`)
    }

    return { jobId: submitted.jobId }
}

const getRenderStatus = async (jobId: string) => {
    "use step"

    const response = await fetch(`${rendererUrl}/api/render/${jobId}`, {
        headers: authHeaders()
    })
    const result = await response.json() as RenderStatus

    if (!response.ok) {
        throw new Error(result.error || `Render status failed: ${response.status}`)
    }

    return result
}

const uploadToBlob = async (path: string) => {
    "use step"

    const fileRes = await fetch(`${rendererUrl}/api/file?path=${encodeURIComponent(path)}`, {
        headers: authHeaders()
    })

    if (!fileRes.ok || !fileRes.body) {
        throw new Error(`Failed to fetch rendered file: ${fileRes.status}`)
    }

    const blob = await put(`renders/${basename(path)}`, fileRes.body, {
        access: 'public',
        addRandomSuffix: true
    })

    return blob.url
}

const render = async (id: string, inputProps: Record<string, any>, type: string) => {
    const { jobId } = await submitRender(id, inputProps, type)

    // Poll the renderer until the job finishes.
    for (let attempt = 0; attempt < 120; attempt++) {
        await sleep(5000)

        const result = await getRenderStatus(jobId)

        if (result.status === 'done') {
            if (!result.path) {
                throw new Error(`Render completed without output path: ${jobId}`)
            }
            const url = await uploadToBlob(result.path)
            return { success: true, url, path: result.path, jobId }
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
export const video = async (id: string, inputProps: Record<string, any>) => {
    return render(id, inputProps, 'video')
}
