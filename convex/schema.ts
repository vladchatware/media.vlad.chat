import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Users table - linked to Stripe customers
  users: defineTable({
    // External auth ID (Clerk, Auth0, etc.) or email
    externalId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    
    // Stripe integration
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // active, canceled, past_due, etc.
    
    // Credits/balance system (in cents)
    creditsBalance: v.number(), // Pre-paid credits remaining
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // Workflow runs - tracks each workflow execution
  workflowRuns: defineTable({
    userId: v.id("users"),
    runId: v.string(), // Vercel workflow run ID
    workflowType: v.string(), // story, tweet, carousel, thread, video
    
    status: v.string(), // pending, running, completed, failed, cancelled
    input: v.optional(v.any()), // Workflow input params
    
    // Cost tracking
    totalCostCents: v.number(), // Total cost in cents
    
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    
    // Error info if failed
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_run_id", ["runId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  // Usage events - granular API call tracking
  usageEvents: defineTable({
    userId: v.id("users"),
    workflowRunId: v.optional(v.id("workflowRuns")),
    
    // API details
    service: v.string(), // openai
    model: v.string(), // gpt-5-mini, gpt-4o-mini-tts, whisper-1, gpt-image-1, sora-2
    operation: v.string(), // chat, tts, transcription, image, video
    
    // Usage metrics
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    audioDurationSeconds: v.optional(v.number()),
    imageDimensions: v.optional(v.string()), // e.g., "1024x1536"
    videoDurationSeconds: v.optional(v.number()),
    
    // Cost
    costCents: v.number(),
    
    // Metadata
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workflow_run", ["workflowRunId"])
    .index("by_model", ["model"])
    .index("by_created_at", ["createdAt"]),

  // Billing transactions - payments, refunds, credits
  transactions: defineTable({
    userId: v.id("users"),
    
    type: v.string(), // payment, refund, credit_purchase, credit_usage, subscription
    amountCents: v.number(), // Positive for credits, negative for charges
    
    // Stripe references
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    
    description: v.string(),
    status: v.string(), // pending, completed, failed
    
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_stripe_payment", ["stripePaymentIntentId"]),
})

