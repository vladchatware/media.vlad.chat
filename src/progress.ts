import { getWritable } from 'workflow'

export type ProgressEvent = {
  type: 'start' | 'step' | 'complete' | 'error'
  message: string
  step?: string
  progress?: number // 0-100
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Write a progress event to the workflow's stream.
 * Must be called from within a step function.
 */
export async function emitProgress(event: Omit<ProgressEvent, 'timestamp'>) {
  "use step"

  const writable = getWritable<ProgressEvent>()
  const writer = writable.getWriter()

  try {
    await writer.write({
      ...event,
      timestamp: Date.now()
    })
  } finally {
    writer.releaseLock()
  }
}

/**
 * Emit a workflow start event
 */
export async function emitStart(message: string, metadata?: Record<string, unknown>) {
  await emitProgress({ type: 'start', message, metadata })
}

/**
 * Emit a step progress event
 */
export async function emitStep(step: string, message: string, progress?: number, metadata?: Record<string, unknown>) {
  await emitProgress({ type: 'step', step, message, progress, metadata })
}

/**
 * Emit a workflow complete event
 */
export async function emitComplete(message: string, metadata?: Record<string, unknown>) {
  await emitProgress({ type: 'complete', message, progress: 100, metadata })
}

/**
 * Emit an error event
 */
export async function emitError(message: string, metadata?: Record<string, unknown>) {
  await emitProgress({ type: 'error', message, metadata })
}

/**
 * Close the progress stream
 */
export async function closeProgress() {
  "use step"

  await getWritable<ProgressEvent>().close()
}

