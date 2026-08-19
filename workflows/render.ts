import { fetch as fetchWorkflow } from 'workflow'

const rendererUrl = process.env.RENDERER_URL || 'http://localhost:3001'
const rendererSecret = process.env.RENDERER_SECRET

const render = async (id: string, inputProps: Record<string, any>, type: string) => {
    "use step"

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    if (rendererSecret) {
        headers.Authorization = `Bearer ${rendererSecret}`
    }

    const result = await fetchWorkflow(`${rendererUrl}/api/render`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            id,
            inputProps,
            type
        })
    }).then(res => res.json())

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