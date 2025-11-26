import { NextRequest, NextResponse } from "next/server"
import { createPortalSession } from "../../../../src/stripe"
import type { Id } from "../../../../convex/_generated/dataModel"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email" },
        { status: 400 }
      )
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_URL || ""

    const portalUrl = await createPortalSession(
      userId as Id<"users">,
      email,
      `${origin}/billing`
    )

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Portal creation failed" },
      { status: 500 }
    )
  }
}

