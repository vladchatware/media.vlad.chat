import { mkdirSync } from 'fs'
import { basename, join } from 'path'

const unauthorized = () =>
  new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })

const secret = process.env.RENDERER_SECRET

mkdirSync('out', { recursive: true })

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

        console.log(`Main: Delegating render for ${id} to worker...`)

        // Create a new worker instance
        const worker = new Worker(new URL('./render-worker.ts', import.meta.url).href)

        // Send data to the worker
        worker.postMessage({ id, inputProps, type })

        // Wait for the worker to finish
        const result = await new Promise((resolve) => {
          worker.onmessage = (event) => {
            resolve(event.data)
            worker.terminate() // Clean up the worker
          }
          worker.onerror = (err) => {
            resolve({ success: false, error: String(err) })
            worker.terminate()
          }
        })

        // @ts-ignore
        if (result.success) {
          // @ts-ignore
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
          })
        } else {
          // @ts-ignore
          return new Response(JSON.stringify(result), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

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

console.log(`Listening on http://localhost:${server.port} ...`)

process.on('SIGTERM', () => server.stop(true))
process.on('SIGINT', () => server.stop(true))
