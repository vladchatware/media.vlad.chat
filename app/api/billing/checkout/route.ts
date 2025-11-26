import { NextRequest, NextResponse } from "next/server"
import { createCreditCheckoutSession } from "../../../../src/stripe"
import type { Id } from "../../../../convex/_generated/dataModel"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, email, packageId } = body

    if (!userId || !email || !packageId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email, packageId" },
        { status: 400 }
      )
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_URL || ""
    
    const checkoutUrl = await createCreditCheckoutSession(
      userId as Id<"users">,
      email,
      packageId,
      `${origin}/billing?success=true`,
      `${origin}/billing?canceled=true`
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    )
  }
}

