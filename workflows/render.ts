import { fetch as fetchWorkflow } from 'workflow'
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

const uploadToBlob = async (path: string) => {
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
    "use step"

    const result = await fetchWorkflow(`${rendererUrl}/api/render`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            id,
            inputProps,
            type
        })
    }).then(res => res.json())

    if (!result.success) {
        throw new Error(result.error || 'Render failed')
    }

    if (result.path) {
        const url = await uploadToBlob(result.path)
        return { success: true, url, path: result.path }
    }

    return result
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