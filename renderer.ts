import { mkdirSync } from 'fs'
import { basename, join } from 'path'

const unauthorized = () =>
  new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })

const secret = process.env.RENDERER_SECRET

mkdirSync('out', { recursive: true })

interface Job {
  id: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: { success: boolean; path?: string; error?: string }
}

const jobs = new Map<string, Job>()
let jobCounter = 0

const createJob = (): Job => {
  const id = `${Date.now()}-${++jobCounter}`
  const job: Job = { id, status: 'pending' }
  jobs.set(id, job)
  return job
}

const server = Bun.serve({
  port: Number.parseInt(process.env.PORT || '3001', 10),
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET' && url.pathname === '/api/file') {
      if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
        return unauthorized()
      }

      const name = url.searchParams.get('path') || url.searchParams.get('name')
      if (!name) {
        return new Response(JSON.stringify({ success: false, error: 'Missing file path' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const file = Bun.file(join('out', basename(name)))
      if (!(await file.exists())) {
        return new Response(JSON.stringify({ success: false, error: 'File not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(file)
    }

    if (req.method === 'POST' && url.pathname === '/api/render') {
      if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
        return unauthorized()
      }

      try {
        const body = await req.json().catch(() => ({}))
        const { id, inputProps, type = 'video' } = body

        if (!id) {
          return new Response(JSON.stringify({ success: false, error: 'Missing composition ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const job = createJob()
        job.status = 'running'

        console.log(`Main: Delegating render for ${id} to worker (job ${job.id})...`)

        const worker = new Worker(new URL('./render-worker.ts', import.meta.url).href)

        worker.onmessage = (event) => {
          job.result = event.data
          job.status = event.data.success ? 'done' : 'error'
          console.log(`Main: Job ${job.id} finished (${job.status})`)
          worker.terminate()
        }

        worker.onerror = (err) => {
          job.result = { success: false, error: String(err) }
          job.status = 'error'
          console.log(`Main: Job ${job.id} errored`)
          worker.terminate()
        }

        worker.postMessage({ id, inputProps, type })

        // Return immediately with the job id; the workflow polls for the result.
        return new Response(JSON.stringify({ success: true, jobId: job.id }), {
          status: 202,
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

    const renderJobMatch = url.pathname.match(/^\/api\/render\/([^/]+)$/)
    if (req.method === 'GET' && renderJobMatch) {
      if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
        return unauthorized()
      }

      const job = jobs.get(renderJobMatch[1])
      if (!job) {
        return new Response(JSON.stringify({ success: false, error: 'Job not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(
        JSON.stringify({
          success: job.status === 'done' || job.status === 'error',
          jobId: job.id,
          status: job.status,
          ...(job.result ?? {}),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response('Not Found', { status: 404 })
  }
})

console.log(`Listening on http://localhost:${server.port} ...`)

process.on('SIGTERM', () => server.stop(true))
process.on('SIGINT', () => server.stop(true))
