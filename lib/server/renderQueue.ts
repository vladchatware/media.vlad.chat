import { randomBytes } from 'node:crypto'
import { QueueClient } from '@vercel/queue'
import {
  RENDER_QUEUE_RETENTION_SECONDS,
  type RenderQueueMessage,
  type RenderType,
} from '../renderQueueMessage'
import { VercelQueueTokenProvider } from './vercelQueueAuth'

const tokenProvider = new VercelQueueTokenProvider()
let queueClient: QueueClient | undefined

function queueTopic(): string {
  return process.env.VERCEL_RENDER_QUEUE_TOPIC || 'media-render'
}

function queueRegion(): string {
  return process.env.VERCEL_QUEUE_REGION || 'iad1'
}

async function getQueueClient(): Promise<QueueClient> {
  const staticToken = process.env.VERCEL_QUEUE_TOKEN
  if (staticToken) {
    queueClient ??= new QueueClient({ region: queueRegion(), deploymentId: null, token: staticToken })
    return queueClient
  }
  if (process.env.VERCEL_API_TOKEN) {
    return new QueueClient({
      region: queueRegion(),
      deploymentId: null,
      token: await tokenProvider.getToken(),
    })
  }
  queueClient ??= new QueueClient({ region: queueRegion(), deploymentId: null })
  return queueClient
}

export async function createRenderJobId(): Promise<string> {
  'use step'
  return randomBytes(32).toString('hex')
}

export async function enqueueRender(
  jobId: string,
  compositionId: string,
  inputProps: Record<string, unknown>,
  type: RenderType,
  outputName?: string,
): Promise<{ jobId: string }> {
  'use step'

  const payload: RenderQueueMessage = { jobId, compositionId, inputProps, type, ...(outputName ? { outputName } : {}) }
  const client = await getQueueClient()
  await client.send(queueTopic(), payload, {
    idempotencyKey: jobId,
    retentionSeconds: RENDER_QUEUE_RETENTION_SECONDS,
  })
  return { jobId }
}
