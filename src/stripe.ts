import Stripe from "stripe"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Credit packages (in cents)
export const CREDIT_PACKAGES = [
  { id: "credits_500", name: "Starter", credits: 500, priceCents: 500 },
  { id: "credits_2000", name: "Creator", credits: 2000, priceCents: 1800 },
  { id: "credits_5000", name: "Pro", credits: 5000, priceCents: 4000 },
  { id: "credits_15000", name: "Studio", credits: 15000, priceCents: 10000 },
] as const

/**
 * Create or get Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: Id<"users">,
  email: string,
  name?: string
): Promise<string> {
  const user = await convex.query(api.users.getByExternalId, {
    externalId: userId,
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      convexUserId: userId,
    },
  })

  await convex.mutation(api.users.updateStripeCustomer, {
    userId: userId as Id<"users">,
    stripeCustomerId: customer.id,
  })

  return customer.id
}

/**
 * Create a checkout session for credit purchase
 */
export async function createCreditCheckoutSession(
  userId: Id<"users">,
  email: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) throw new Error("Invalid package ID")

  const customerId = await getOrCreateCustomer(userId, email)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pkg.name} Credits`,
            description: `${pkg.credits} credits for media generation`,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
      credits: pkg.credits.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url!
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(
  userId: Id<"users">,
  email: string,
  returnUrl: string
): Promise<string> {
  const customerId = await getOrCreateCustomer(userId, email)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId as Id<"users"> | undefined
  const credits = parseInt(session.metadata?.credits ?? "0", 10)
  const packageId = session.metadata?.packageId

  if (!userId || !credits) {
    console.error("Missing metadata in checkout session")
    return
  }

  await convex.mutation(api.users.addCredits, {
    userId,
    amountCents: credits,
    description: `Credit purchase: ${packageId}`,
    stripePaymentIntentId: session.payment_intent as string,
  })
}

/**
 * Handle subscription updates
 */
export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string

  const user = await convex.query(api.users.getByStripeCustomer, {
    stripeCustomerId: customerId,
  })

  if (!user) {
    console.error("User not found for customer:", customerId)
    return
  }

  await convex.mutation(api.users.updateSubscription, {
    userId: user._id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    subscriptionStatus: subscription.status,
  })
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(
  stripeCustomerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  })

  return paymentMethods.data
}

/**
 * Get customer's invoice history
 */
export async function getInvoices(
  stripeCustomerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit,
  })

  return invoices.data
}

