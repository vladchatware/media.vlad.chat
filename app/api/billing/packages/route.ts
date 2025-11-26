import { NextResponse } from "next/server"
import { CREDIT_PACKAGES } from "../../../../src/stripe"

export async function GET() {
  const packages = CREDIT_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    priceCents: pkg.priceCents,
    priceFormatted: `$${(pkg.priceCents / 100).toFixed(2)}`,
    creditsFormatted: `${pkg.credits} credits`,
    valuePerDollar: Math.round(pkg.credits / (pkg.priceCents / 100)),
  }))

  return NextResponse.json({ packages })
}

