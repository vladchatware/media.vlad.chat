const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'POST' && url.pathname === '/api/render') {
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
