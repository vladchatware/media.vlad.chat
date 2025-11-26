// Maximum concurrent render jobs - set to 1 for sequential processing
const MAX_CONCURRENT = 1

// Job queue types
interface RenderJob {
  id: string
  inputProps: Record<string, unknown>
  resolve: (result: RenderResult) => void
  queuedAt: number
}

interface RenderResult {
  success: boolean
  path?: string
  error?: string
}

// State
const jobQueue: RenderJob[] = []
let activeWorkers = 0

// Process the next job in the queue if we have capacity
function processQueue() {
  if (activeWorkers >= MAX_CONCURRENT || jobQueue.length === 0) {
    return
  }

  const job = jobQueue.shift()!
  activeWorkers++

  const waitTime = Date.now() - job.queuedAt
  console.log(`[Queue] Starting job "${job.id}" (waited ${waitTime}ms, active: ${activeWorkers}/${MAX_CONCURRENT}, queued: ${jobQueue.length})`)

  const worker = new Worker(new URL('./render-worker.ts', import.meta.url).href)
  worker.postMessage({ id: job.id, inputProps: job.inputProps })

  worker.onmessage = (event) => {
    activeWorkers--
    worker.terminate()
    console.log(`[Queue] Completed job "${job.id}" (active: ${activeWorkers}/${MAX_CONCURRENT}, queued: ${jobQueue.length})`)
    job.resolve(event.data)
    processQueue() // Process next job
  }

  worker.onerror = (err) => {
    activeWorkers--
    worker.terminate()
    console.error(`[Queue] Failed job "${job.id}":`, err)
    job.resolve({ success: false, error: String(err) })
    processQueue() // Process next job
  }
}

// Queue a render job and return a promise
function queueRenderJob(id: string, inputProps: Record<string, unknown>): Promise<RenderResult> {
  return new Promise((resolve) => {
    const job: RenderJob = {
      id,
      inputProps,
      resolve,
      queuedAt: Date.now()
    }
    jobQueue.push(job)
    console.log(`[Queue] Queued job "${id}" (position: ${jobQueue.length}, active: ${activeWorkers}/${MAX_CONCURRENT})`)
    processQueue()
  })
}

const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)

    // Status endpoint to check queue
    if (req.method === 'GET' && url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        activeWorkers,
        maxConcurrent: MAX_CONCURRENT,
        queuedJobs: jobQueue.length,
        queuedIds: jobQueue.map(j => j.id)
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && url.pathname === '/api/render') {
      try {
        const body = await req.json().catch(() => ({}))
        const { id, inputProps } = body

        if (!id) {
          return new Response(JSON.stringify({ success: false, error: 'Missing composition ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Queue the job instead of immediately spawning a worker
        const result = await queueRenderJob(id, inputProps || {})

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { 'Content-Type': 'application/json' }
        })

      } catch (err) {
        console.error('Main Error:', err)
        return new Response(JSON.stringify({ success: false, error: String(err) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
})

console.log(`Listening on http://localhost:${server.port} (max concurrent: ${MAX_CONCURRENT})`)
