import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import {
  calculateTextCost,
  calculateTTSCost,
  calculateTranscriptionCost,
  calculateImageCost,
  calculateVideoCost,
} from "./pricing"

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Context for tracking costs within a workflow
let currentContext: {
  userId: Id<"users"> | null
  workflowRunId: Id<"workflowRuns"> | null
  runId: string | null
} = {
  userId: null,
  workflowRunId: null,
  runId: null,
}

/**
 * Set the billing context for the current workflow
 */
export function setBillingContext(
  userId: Id<"users">,
  workflowRunId: Id<"workflowRuns">,
  runId: string
) {
  currentContext = { userId, workflowRunId, runId }
}

/**
 * Clear the billing context
 */
export function clearBillingContext() {
  currentContext = { userId: null, workflowRunId: null, runId: null }
}

/**
 * Get the current billing context
 */
export function getBillingContext() {
  return currentContext
}

/**
 * Track text generation usage (GPT models)
 */
export async function trackTextGeneration(
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
) {
  if (!currentContext.userId) {
    console.warn("No billing context set, skipping cost tracking")
    return
  }

  const costCents = calculateTextCost("gpt-5-mini", inputTokens, outputTokens)

  await convex.mutation(api.usage.record, {
    userId: currentContext.userId,
    workflowRunId: currentContext.workflowRunId ?? undefined,
    service: "openai",
    model: "gpt-5-mini",
    operation: "text-generation",
    inputTokens,
    outputTokens,
    costCents,
    metadata,
  })

  // Update workflow total
  if (currentContext.runId) {
    await convex.mutation(api.workflows.addCost, {
      runId: currentContext.runId,
      costCents,
    })
  }

  return costCents
}

/**
 * Track text-to-speech usage
 */
export async function trackTTS(
  characterCount: number,
  durationSeconds?: number,
  metadata?: Record<string, unknown>
) {
  if (!currentContext.userId) {
    console.warn("No billing context set, skipping cost tracking")
    return
  }

  const costCents = calculateTTSCost("gpt-4o-mini-tts", characterCount)

  await convex.mutation(api.usage.record, {
    userId: currentContext.userId,
    workflowRunId: currentContext.workflowRunId ?? undefined,
    service: "openai",
    model: "gpt-4o-mini-tts",
    operation: "text-to-speech",
    audioDurationSeconds: durationSeconds,
    costCents,
    metadata: { ...metadata, characterCount },
  })

  if (currentContext.runId) {
    await convex.mutation(api.workflows.addCost, {
      runId: currentContext.runId,
      costCents,
    })
  }

  return costCents
}

/**
 * Track transcription usage
 */
export async function trackTranscription(
  durationSeconds: number,
  metadata?: Record<string, unknown>
) {
  if (!currentContext.userId) {
    console.warn("No billing context set, skipping cost tracking")
    return
  }

  const costCents = calculateTranscriptionCost("whisper-1", durationSeconds)

  await convex.mutation(api.usage.record, {
    userId: currentContext.userId,
    workflowRunId: currentContext.workflowRunId ?? undefined,
    service: "openai",
    model: "whisper-1",
    operation: "transcription",
    audioDurationSeconds: durationSeconds,
    costCents,
    metadata,
  })

  if (currentContext.runId) {
    await convex.mutation(api.workflows.addCost, {
      runId: currentContext.runId,
      costCents,
    })
  }

  return costCents
}

/**
 * Track image generation usage
 */
export async function trackImageGeneration(
  dimensions: "1024x1024" | "1024x1536" | "1536x1024",
  metadata?: Record<string, unknown>
) {
  if (!currentContext.userId) {
    console.warn("No billing context set, skipping cost tracking")
    return
  }

  const costCents = calculateImageCost("gpt-image-1", dimensions)

  await convex.mutation(api.usage.record, {
    userId: currentContext.userId,
    workflowRunId: currentContext.workflowRunId ?? undefined,
    service: "openai",
    model: "gpt-image-1",
    operation: "image-generation",
    imageDimensions: dimensions,
    costCents,
    metadata,
  })

  if (currentContext.runId) {
    await convex.mutation(api.workflows.addCost, {
      runId: currentContext.runId,
      costCents,
    })
  }

  return costCents
}

/**
 * Track video generation usage (Sora)
 */
export async function trackVideoGeneration(
  durationSeconds: number,
  resolution: "480p" | "720p" | "1080p" = "720p",
  metadata?: Record<string, unknown>
) {
  if (!currentContext.userId) {
    console.warn("No billing context set, skipping cost tracking")
    return
  }

  const costCents = calculateVideoCost("sora-2", durationSeconds, resolution)

  await convex.mutation(api.usage.record, {
    userId: currentContext.userId,
    workflowRunId: currentContext.workflowRunId ?? undefined,
    service: "openai",
    model: "sora-2",
    operation: "video-generation",
    videoDurationSeconds: durationSeconds,
    costCents,
    metadata: { ...metadata, resolution },
  })

  if (currentContext.runId) {
    await convex.mutation(api.workflows.addCost, {
      runId: currentContext.runId,
      costCents,
    })
  }

  return costCents
}

/**
 * Check if user has sufficient credits for an estimated workflow
 */
export async function checkCredits(
  userId: Id<"users">,
  estimatedCostCents: number
): Promise<{ sufficient: boolean; balance: number; shortfall: number }> {
  const balance = await convex.query(api.users.getBalance, { userId })
  const sufficient = balance >= estimatedCostCents
  const shortfall = sufficient ? 0 : estimatedCostCents - balance

  return { sufficient, balance, shortfall }
}

/**
 * Create a workflow run and set up billing context
 */
export async function startBilledWorkflow(
  userId: Id<"users">,
  runId: string,
  workflowType: string,
  input?: Record<string, unknown>
): Promise<Id<"workflowRuns">> {
  const workflowRunId = await convex.mutation(api.workflows.create, {
    userId,
    runId,
    workflowType,
    input,
  })

  setBillingContext(userId, workflowRunId, runId)

  return workflowRunId
}

/**
 * Complete a billed workflow
 */
export async function completeBilledWorkflow(success: boolean, error?: string) {
  if (!currentContext.runId) return

  await convex.mutation(api.workflows.updateStatus, {
    runId: currentContext.runId,
    status: success ? "completed" : "failed",
    error,
  })

  // Deduct credits from user balance
  if (success && currentContext.userId) {
    const workflow = await convex.query(api.workflows.getByRunId, {
      runId: currentContext.runId,
    })

    if (workflow && workflow.totalCostCents > 0) {
      try {
        await convex.mutation(api.users.deductCredits, {
          userId: currentContext.userId,
          amountCents: workflow.totalCostCents,
          description: `Workflow: ${workflow.workflowType} (${currentContext.runId})`,
        })
      } catch (e) {
        console.error("Failed to deduct credits:", e)
      }
    }
  }

  clearBillingContext()
}

