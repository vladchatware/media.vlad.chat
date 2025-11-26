import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get("userId") as Id<"users"> | null
    const period = searchParams.get("period") || "month" // day, week, month, all

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      )
    }

    // Calculate since timestamp based on period
    const now = Date.now()
    let since: number | undefined
    switch (period) {
      case "day":
        since = now - 24 * 60 * 60 * 1000
        break
      case "week":
        since = now - 7 * 24 * 60 * 60 * 1000
        break
      case "month":
        since = now - 30 * 24 * 60 * 60 * 1000
        break
      case "all":
        since = undefined
        break
      default:
        since = now - 30 * 24 * 60 * 60 * 1000
    }

    const [balance, totalSpending, spendingByType, usageByModel, recentWorkflows] = 
      await Promise.all([
        convex.query(api.users.getBalance, { userId }),
        convex.query(api.workflows.getTotalSpending, { userId, since }),
        convex.query(api.workflows.getSpendingByType, { userId, since }),
        convex.query(api.usage.getBreakdownByModel, { userId, since }),
        convex.query(api.workflows.listByUser, { userId, limit: 10 }),
      ])

    return NextResponse.json({
      balance: {
        credits: balance,
        formatted: `$${(balance / 100).toFixed(2)}`,
      },
      period: {
        name: period,
        since: since ? new Date(since).toISOString() : null,
      },
      spending: {
        totalCents: totalSpending,
        formatted: `$${(totalSpending / 100).toFixed(2)}`,
        byWorkflowType: Object.entries(spendingByType).map(([type, data]) => ({
          type,
          count: data.count,
          costCents: data.costCents,
          formatted: `$${(data.costCents / 100).toFixed(2)}`,
        })),
        byModel: Object.entries(usageByModel).map(([model, data]) => ({
          model,
          count: data.count,
          costCents: data.costCents,
          formatted: `$${(data.costCents / 100).toFixed(2)}`,
          tokens: {
            input: data.totalInputTokens,
            output: data.totalOutputTokens,
          },
          audioSeconds: data.totalAudioSeconds,
          videoSeconds: data.totalVideoSeconds,
        })),
      },
      recentWorkflows: recentWorkflows.map((w) => ({
        id: w._id,
        runId: w.runId,
        type: w.workflowType,
        status: w.status,
        costCents: w.totalCostCents,
        formatted: `$${(w.totalCostCents / 100).toFixed(2)}`,
        startedAt: new Date(w.startedAt).toISOString(),
        completedAt: w.completedAt ? new Date(w.completedAt).toISOString() : null,
      })),
    })
  } catch (error) {
    console.error("Usage API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch usage" },
      { status: 500 }
    )
  }
}

