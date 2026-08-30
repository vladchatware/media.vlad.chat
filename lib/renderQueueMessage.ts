export const RENDER_QUEUE_RETENTION_SECONDS = 24 * 60 * 60

export type RenderType = 'video' | 'still' | 'sequence'

export type RenderQueueMessage = {
  jobId: string
  compositionId: string
  inputProps: Record<string, unknown>
  outputName?: string
  type: RenderType
}

export function parseRenderQueueMessage(value: unknown): RenderQueueMessage | null {
  if (!value || typeof value !== 'object') return null
  const message = value as Partial<RenderQueueMessage>
  if (typeof message.jobId !== 'string' || !/^[a-f0-9]{64}$/.test(message.jobId)) return null
  if (typeof message.compositionId !== 'string' || !message.compositionId) return null
  if (!message.inputProps || typeof message.inputProps !== 'object' || Array.isArray(message.inputProps)) return null
  if (message.outputName !== undefined && typeof message.outputName !== 'string') return null
  if (message.type !== 'video' && message.type !== 'still' && message.type !== 'sequence') return null
  return message as RenderQueueMessage
}
