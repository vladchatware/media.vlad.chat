import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get or create a user by external ID
export const getOrCreate = mutation({
  args: {
    externalId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first()

    if (existing) {
      return existing._id
    }

    const now = Date.now()
    return await ctx.db.insert("users", {
      externalId: args.externalId,
      email: args.email,
      name: args.name,
      creditsBalance: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Get user by external ID
export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .first()
  },
})

// Get user by Stripe customer ID
export const getByStripeCustomer = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first()
  },
})

// Update Stripe customer info
export const updateStripeCustomer = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    })
  },
})

// Update subscription status
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      subscriptionStatus: args.subscriptionStatus,
      updatedAt: Date.now(),
    })
  },
})

// Add credits to user balance
export const addCredits = mutation({
  args: {
    userId: v.id("users"),
    amountCents: v.number(),
    description: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")

    await ctx.db.patch(args.userId, {
      creditsBalance: user.creditsBalance + args.amountCents,
      updatedAt: Date.now(),
    })

    // Record transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "credit_purchase",
      amountCents: args.amountCents,
      stripePaymentIntentId: args.stripePaymentIntentId,
      description: args.description,
      status: "completed",
      createdAt: Date.now(),
    })
  },
})

// Deduct credits from user balance
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    amountCents: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")

    if (user.creditsBalance < args.amountCents) {
      throw new Error("Insufficient credits")
    }

    await ctx.db.patch(args.userId, {
      creditsBalance: user.creditsBalance - args.amountCents,
      updatedAt: Date.now(),
    })

    // Record transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      type: "credit_usage",
      amountCents: -args.amountCents,
      description: args.description,
      status: "completed",
      createdAt: Date.now(),
    })
  },
})

// Get user's credit balance
export const getBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    return user?.creditsBalance ?? 0
  },
})

