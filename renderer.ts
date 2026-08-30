import { put } from '@vercel/blob'
import { PollingQueueClient, type MessageMetadata } from '@vercel/queue'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import {
  parseRenderQueueMessage,
  type RenderQueueMessage,
} from './lib/renderQueueMessage'
import { VercelQueueTokenProvider } from './lib/server/vercelQueueAuth'

type JobStatus = 'pending' | 'running' | 'done' | 'error'

type Job = {
  id: string
  status: JobStatus
  path?: string
  url?: string
  pathname?: string
  error?: string
  deliveryCount?: number
  updatedAt: string
}

type WorkerResult = {
  success: boolean
  path?: string
  error?: string
}

const secret = process.env.RENDERER_SECRET
const jobsDirectory = process.env.RENDER_JOB_DIRECTORY || join('data', 'render-jobs')
const concurrency = Math.max(1, Number.parseInt(process.env.RENDER_WORKER_CONCURRENCY || '1', 10))
const maxDeliveryCount = Math.max(1, Number.parseInt(process.env.RENDER_MAX_DELIVERY_COUNT || '5', 10))
const queueRegion = process.env.VERCEL_QUEUE_REGION || 'iad1'
const queueTopic = process.env.VERCEL_RENDER_QUEUE_TOPIC || 'media-render'
const queueConsumerGroup = process.env.VERCEL_RENDER_QUEUE_CONSUMER_GROUP || 'media-renderer'
const pollIntervalMs = Math.max(250, Number.parseInt(process.env.VERCEL_QUEUE_POLL_INTERVAL_MS || '2000', 10))
const tokenProvider = new VercelQueueTokenProvider()
let activeJobs = 0
let stopping = false
let queueConsumerStarted = false
let lastQueuePollAt = 0
let lastQueueError: string | undefined
const processingJobs = new Set<string>()

class DuplicateRenderDelivery extends Error {
  constructor() {
    super('Render job is already processing')
    this.name = 'DuplicateRenderDelivery'
  }
}

await mkdir('out', { recursive: true })
await mkdir(jobsDirectory, { recursive: true })

const unauthorized = () => Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })

function jobFile(jobId: string): string {
  if (!/^[a-f0-9]{64}$/.test(jobId)) throw new Error('Invalid job ID')
  return join(jobsDirectory, `${jobId}.json`)
}

async function readJob(jobId: string): Promise<Job | null> {
  try {
    return JSON.parse(await readFile(jobFile(jobId), 'utf8')) as Job
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function writeJob(job: Job): Promise<void> {
  const destination = jobFile(job.id)
  const temporary = `${destination}.${process.pid}.${crypto.randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(job))
  await rename(temporary, destination)
}

function runWorker(message: RenderQueueMessage): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./render-worker.ts', import.meta.url).href)
    worker.onmessage = (event) => {
      worker.terminate()
      resolve(event.data as WorkerResult)
    }
    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }
    worker.postMessage({
      jobId: message.jobId,
      id: message.compositionId,
      inputProps: message.inputProps,
      outputName: message.outputName,
      type: message.type,
    })
  })
}

function contentType(path: string): string {
  if (path.endsWith('.mp4')) return 'video/mp4'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.tar.gz')) return 'application/gzip'
  return 'application/octet-stream'
}

async function processMessage(value: unknown, metadata: MessageMetadata): Promise<void> {
  const message = parseRenderQueueMessage(value)
  if (!message) {
    console.error('render.queue.invalid_message', { messageId: metadata.messageId })
    return
  }

  const existing = await readJob(message.jobId)
  if (existing?.status === 'done') return
  if (processingJobs.has(message.jobId)) throw new DuplicateRenderDelivery()
  processingJobs.add(message.jobId)

  let outputPath = existing?.path
  try {
    await writeJob({
      id: message.jobId,
      status: 'running',
      path: outputPath,
      deliveryCount: metadata.deliveryCount,
      updatedAt: new Date().toISOString(),
    })
    console.info('render.job.started', {
      jobId: message.jobId,
      compositionId: message.compositionId,
      deliveryCount: metadata.deliveryCount,
    })
    const reusableOutput = outputPath ? Bun.file(outputPath) : null
    if (!reusableOutput || !await reusableOutput.exists() || reusableOutput.size === 0) {
      const result = await runWorker(message)
      if (!result.success || !result.path) throw new Error(result.error || 'Render worker returned no output')
      outputPath = result.path
    }

    const blob = await put(`renders/${message.jobId}-${basename(outputPath)}`, Bun.file(outputPath), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType(outputPath),
      multipart: true,
    })
    await writeJob({
      id: message.jobId,
      status: 'done',
      path: blob.pathname,
      url: blob.url,
      pathname: blob.pathname,
      deliveryCount: metadata.deliveryCount,
      updatedAt: new Date().toISOString(),
    })
    await unlink(outputPath).catch(() => undefined)
    console.info('render.job.completed', { jobId: message.jobId, url: blob.url })
  } catch (error) {
    const current = await readJob(message.jobId)
    if (current?.status === 'done') return
    const messageText = error instanceof Error ? error.message : String(error)
    const exhausted = metadata.deliveryCount >= maxDeliveryCount
    await writeJob({
      id: message.jobId,
      status: exhausted ? 'error' : 'pending',
      path: outputPath,
      error: messageText,
      deliveryCount: metadata.deliveryCount,
      updatedAt: new Date().toISOString(),
    })
    console.error('render.job.failed', {
      jobId: message.jobId,
      deliveryCount: metadata.deliveryCount,
      exhausted,
      error: messageText,
    })
    if (!exhausted) throw error
  } finally {
    processingJobs.delete(message.jobId)
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runQueueSlot(): Promise<void> {
  while (!stopping) {
    let idle = false
    activeJobs += 1
    try {
      const client = new PollingQueueClient({
        region: queueRegion,
        deploymentId: null,
        token: await tokenProvider.getToken(),
      })
      const result = await client.receive(queueTopic, queueConsumerGroup, processMessage, {
        visibilityTimeoutSeconds: 3600,
        retry: (_error, metadata) => ({
          afterSeconds: _error instanceof DuplicateRenderDelivery
            ? 30
            : Math.min(300, 15 * 2 ** Math.max(0, metadata.deliveryCount - 1)),
        }),
      })
      // strict:false prevents discriminant narrowing for this SDK union.
      const received = result as { ok: boolean; reason?: string }
      lastQueuePollAt = Date.now()
      lastQueueError = undefined
      idle = !received.ok && received.reason === 'empty'
    } catch (error) {
      lastQueueError = error instanceof Error ? error.message : String(error)
      console.error('render.queue.receive_failed', {
        error: lastQueueError,
      })
      idle = true
    } finally {
      activeJobs -= 1
    }
    if (idle) await wait(pollIntervalMs)
  }
}

const server = Bun.serve({
  port: Number.parseInt(process.env.PORT || '3001', 10),
  async fetch(req) {
    const url = new URL(req.url)
    if (req.method === 'GET' && url.pathname === '/health') {
      const queueHealthy = queueConsumerStarted
        && (processingJobs.size > 0 || Date.now() - lastQueuePollAt < 30_000)
      return Response.json({
        ok: !stopping && queueHealthy,
        activeJobs,
        capacity: concurrency,
        queueConsumer: queueConsumerStarted,
        queueHealthy,
        lastQueueError,
      }, { status: !stopping && queueHealthy ? 200 : 503 })
    }

    const renderJobMatch = url.pathname.match(/^\/api\/render\/([^/]+)$/)
    if (req.method === 'GET' && renderJobMatch) {
      if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return unauthorized()
      try {
        const job = await readJob(renderJobMatch[1])
        return Response.json(job ?? {
          id: renderJobMatch[1],
          status: 'pending',
          updatedAt: new Date().toISOString(),
        })
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
})

if (process.env.VERCEL_QUEUE_TOKEN || process.env.VERCEL_API_TOKEN) {
  for (let slot = 0; slot < concurrency; slot += 1) void runQueueSlot()
  queueConsumerStarted = true
  console.info('render.queue.consumer_started', {
    region: queueRegion,
    topic: queueTopic,
    consumerGroup: queueConsumerGroup,
    concurrency,
  })
} else {
  console.warn('render.queue.consumer_disabled', { reason: 'Queue credentials are not configured' })
}

console.info(`Renderer listening on http://localhost:${server.port}`)

async function shutdown(signal: string): Promise<void> {
  if (stopping) return
  stopping = true
  console.info('render.worker.stopping', { signal, activeJobs })
  while (activeJobs > 0) await wait(100)
  server.stop(true)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
