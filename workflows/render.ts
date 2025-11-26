import { fetch as fetchWorkflow } from 'workflow'

// Concurrency control - set to 1 for sequential processing
const MAX_CONCURRENT = 1

// Queue state
let activeRenders = 0
const queue: Array<{
    execute: () => Promise<void>
    resolve: (result: any) => void
    reject: (error: any) => void
}> = []

function processQueue() {
    while (activeRenders < MAX_CONCURRENT && queue.length > 0) {
        const job = queue.shift()!
        activeRenders++
        console.log(`[Render Queue] Starting job (active: ${activeRenders}/${MAX_CONCURRENT}, queued: ${queue.length})`)
        
        job.execute()
            .then(job.resolve)
            .catch(job.reject)
            .finally(() => {
                activeRenders--
                console.log(`[Render Queue] Job finished (active: ${activeRenders}/${MAX_CONCURRENT}, queued: ${queue.length})`)
                processQueue()
            })
    }
}

async function queuedRender(id: string, inputProps: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
        const execute = async () => {
            const result = await fetchWorkflow('http://localhost:3001/api/render', {
                method: 'POST',
                body: JSON.stringify({ id, inputProps })
            }).then(res => res.json())
            return result
        }

        queue.push({ execute, resolve, reject })
        console.log(`[Render Queue] Queued "${id}" (position: ${queue.length}, active: ${activeRenders}/${MAX_CONCURRENT})`)
        processQueue()
    })
}

// composition, content
// generates sound
export const still = async (id: string, inputProps: Record<string, any>) => {
    "use step"
    return await queuedRender(id, inputProps)
}

// composition, story
// generates image
export const sequence = async (id: string, inputProps: Record<string, any>) => {
    "use step"
    return await queuedRender(id, inputProps)
}

// composition, story
// generates image, sound, captions
export const video = async (id: string, inputProps: Record<string, any>) => {
    "use step"
    return await queuedRender(id, inputProps)
}
