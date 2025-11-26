import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Create a new workflow run
export const create = mutation({
  args: {
    userId: v.id("users"),
    runId: v.string(),
    workflowType: v.string(),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflowRuns", {
      userId: args.userId,
      runId: args.runId,
      workflowType: args.workflowType,
      status: "pending",
      input: args.input,
      totalCostCents: 0,
      startedAt: Date.now(),
    })
  },
})

// Update workflow status
export const updateStatus = mutation({
  args: {
    runId: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("workflowRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first()

    if (!workflow) throw new Error("Workflow not found")

    const updates: Record<string, unknown> = { status: args.status }
    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now()
    }
    if (args.error) {
      updates.error = args.error
    }

    await ctx.db.patch(workflow._id, updates)
  },
})

// Add cost to workflow
export const addCost = mutation({
  args: {
    runId: v.string(),
    costCents: v.number(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("workflowRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first()

    if (!workflow) throw new Error("Workflow not found")

    await ctx.db.patch(workflow._id, {
      totalCostCents: workflow.totalCostCents + args.costCents,
    })
  },
})

// Get workflow by run ID
export const getByRunId = query({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first()
  },
})

// Get user's workflow history
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    return await ctx.db
      .query("workflowRuns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)
  },
})

// Get user's total spending
export const getTotalSpending = query({
  args: {
    userId: v.id("users"),
    since: v.optional(v.number()), // Timestamp
  },
  handler: async (ctx, args) => {
    let workflows = ctx.db
      .query("workflowRuns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))

    const results = await workflows.collect()
    
    const filtered = args.since
      ? results.filter((w) => w.startedAt >= args.since!)
      : results

    return filtered.reduce((sum, w) => sum + w.totalCostCents, 0)
  },
})

// Get spending breakdown by workflow type
export const getSpendingByType = query({
  args: {
    userId: v.id("users"),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("workflowRuns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const filtered = args.since
      ? results.filter((w) => w.startedAt >= args.since!)
      : results

    const breakdown: Record<string, { count: number; costCents: number }> = {}
    
    for (const workflow of filtered) {
      if (!breakdown[workflow.workflowType]) {
        breakdown[workflow.workflowType] = { count: 0, costCents: 0 }
      }
      breakdown[workflow.workflowType].count++
      breakdown[workflow.workflowType].costCents += workflow.totalCostCents
    }

    return breakdown
  },
})

