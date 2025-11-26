# Billing & Usage Tracking

This document covers the billing system integration with Convex and Stripe.

## Overview

The billing system provides:
- **Usage Tracking** - Every AI API call is logged with costs
- **Credit System** - Users pre-pay for credits, deducted as workflows run
- **Stripe Integration** - Secure payments for credit purchases
- **Cost Estimation** - Estimate workflow costs before running

## Setup

### 1. Configure Convex

```bash
# Initialize Convex (first time)
bunx convex dev --once --configure=new

# Or start development mode
bunx convex dev
```

Add your Convex URL to `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 2. Configure Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Set up webhook endpoint:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/billing/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## API Endpoints

### Credit Packages
```http
GET /api/billing/packages
```
Returns available credit packages for purchase.

### Create Checkout Session
```http
POST /api/billing/checkout
Content-Type: application/json

{
  "userId": "user_123",
  "email": "user@example.com",
  "packageId": "credits_2000"
}
```
Returns a Stripe checkout URL.

### Billing Portal
```http
POST /api/billing/portal
Content-Type: application/json

{
  "userId": "user_123",
  "email": "user@example.com"
}
```
Returns a Stripe billing portal URL.

### Usage Statistics
```http
GET /api/billing/usage?userId=user_123&period=month
```
Returns spending breakdown and usage statistics.

## MCP Tools

The following billing tools are available via MCP:

| Tool | Description |
|------|-------------|
| `billing_balance` | Check credit balance |
| `billing_usage` | Get usage statistics |
| `billing_estimate` | Estimate workflow cost |
| `billing_history` | View workflow history with costs |
| `billing_packages` | List credit packages |

### Example Usage

```
> Use billing_balance with user_id "user_123"

💰 Credit Balance

User: user_123
Balance: 1500 credits ($15.00)
```

## Pricing

Costs are calculated based on OpenAI API pricing:

| Model | Unit | Cost |
|-------|------|------|
| GPT-5-mini | 1M input tokens | $0.15 |
| GPT-5-mini | 1M output tokens | $0.60 |
| GPT-4o-mini-TTS | 1M characters | $12.00 |
| Whisper-1 | per minute | $0.006 |
| GPT-Image-1 | per image (1024x1536) | $0.08 |
| Sora-2 | per second (720p) | $0.04 |

### Workflow Estimates

| Workflow | Estimated Cost |
|----------|----------------|
| Tweet | $0.15 - $0.50 |
| Thread | $0.20 - $0.75 |
| Carousel | $0.50 - $2.00 |
| Story | $1.00 - $5.00 |
| Video | $2.00 - $10.00 |

## Credit Packages

| Package | Credits | Price | Value |
|---------|---------|-------|-------|
| Starter | 500 | $5.00 | 100/$ |
| Creator | 2,000 | $18.00 | 111/$ |
| Pro | 5,000 | $40.00 | 125/$ |
| Studio | 15,000 | $100.00 | 150/$ |

## Database Schema

### Users Table
- `externalId` - Auth provider user ID
- `email` - User email
- `stripeCustomerId` - Stripe customer ID
- `creditsBalance` - Available credits (in cents)

### Workflow Runs Table
- `userId` - Owner
- `runId` - Vercel workflow run ID
- `workflowType` - story, tweet, etc.
- `totalCostCents` - Accumulated cost

### Usage Events Table
- Granular API call tracking
- Model, operation, tokens/duration
- Cost per call

### Transactions Table
- Payment and credit history
- Stripe references

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Workflow                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  AI Call    │──▶│  Track Cost │──▶│  Convex DB  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Billing APIs                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  /checkout  │  │   /portal   │  │   /usage    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌──────────────────────┐                           │
│              │       Stripe         │                           │
│              └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

