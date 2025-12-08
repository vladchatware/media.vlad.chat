import { fetch as fetchWorkflow } from 'workflow'

// composition, content
// generates sound
export const still = async (id: string, inputProps: Record<string, any>) => {
    "use step"

    const result = await fetchWorkflow('http://localhost:3001/api/render', {
        method: 'POST',
        body: JSON.stringify({
            id,
            inputProps,
            type: 'still'
        })
    }).then(res => res.json())

    return result
}

// composition, story
// generates image
export const sequence = async (id: string, inputProps: Record<string, any>) => {
    "use step"

    const result = await fetchWorkflow('http://localhost:3001/api/render', {
        method: 'POST',
        body: JSON.stringify({
            id,
            inputProps,
            type: 'sequence'
        })
    }).then(res => res.json())

    return result
}

// composition, story
// generates image, sound, captions
export const video = async (id: string, inputProps: Record<string, any>) => {
    "use step"

    const result = await fetchWorkflow('http://localhost:3001/api/render', {
        method: 'POST',
        body: JSON.stringify({
            id,
            inputProps,
            type: 'video'
        })
    }).then(res => res.json())

    return result
}