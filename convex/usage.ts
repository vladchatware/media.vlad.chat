import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Record a usage event (API call)
export const record = mutation({
  args: {
    userId: v.id("users"),
    workflowRunId: v.optional(v.id("workflowRuns")),
    service: v.string(),
    model: v.string(),
    operation: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    audioDurationSeconds: v.optional(v.number()),
    imageDimensions: v.optional(v.string()),
    videoDurationSeconds: v.optional(v.number()),
    costCents: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("usageEvents", {
      userId: args.userId,
      workflowRunId: args.workflowRunId,
      service: args.service,
      model: args.model,
      operation: args.operation,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      audioDurationSeconds: args.audioDurationSeconds,
      imageDimensions: args.imageDimensions,
      videoDurationSeconds: args.videoDurationSeconds,
      costCents: args.costCents,
      metadata: args.metadata,
      createdAt: Date.now(),
    })
  },
})

// Get usage events for a workflow run
export const getByWorkflowRun = query({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_workflow_run", (q) => q.eq("workflowRunId", args.workflowRunId))
      .collect()
  },
})

// Get user's usage breakdown by model
export const getBreakdownByModel = query({
  args: {
    userId: v.id("users"),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const filtered = args.since
      ? events.filter((e) => e.createdAt >= args.since!)
      : events

    const breakdown: Record<string, { 
      count: number
      costCents: number
      totalInputTokens: number
      totalOutputTokens: number
      totalAudioSeconds: number
      totalVideoSeconds: number
    }> = {}

    for (const event of filtered) {
      if (!breakdown[event.model]) {
        breakdown[event.model] = {
          count: 0,
          costCents: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalAudioSeconds: 0,
          totalVideoSeconds: 0,
        }
      }
      const b = breakdown[event.model]
      b.count++
      b.costCents += event.costCents
      b.totalInputTokens += event.inputTokens ?? 0
      b.totalOutputTokens += event.outputTokens ?? 0
      b.totalAudioSeconds += event.audioDurationSeconds ?? 0
      b.totalVideoSeconds += event.videoDurationSeconds ?? 0
    }

    return breakdown
  },
})

// Get recent usage events
export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)
  },
})

// Get total usage cost for a period
export const getTotalCost = query({
  args: {
    userId: v.id("users"),
    since: v.number(),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const until = args.until ?? Date.now()
    const filtered = events.filter(
      (e) => e.createdAt >= args.since && e.createdAt <= until
    )

    return filtered.reduce((sum, e) => sum + e.costCents, 0)
  },
})

