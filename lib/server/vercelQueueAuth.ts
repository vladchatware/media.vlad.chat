import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TOKEN_REFRESH_MARGIN_MS = 5 * 60_000

type MintedToken = {
  token: string
  expiresAtMs: number
}

function decodeJwtExpiryMs(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=')
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as { exp?: unknown }
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function projectIdFromRepo(): string | undefined {
  for (const name of ['repo.json', 'project.json']) {
    try {
      const config = JSON.parse(readFileSync(join(process.cwd(), '.vercel', name), 'utf8')) as {
        projectId?: unknown
        id?: unknown
      }
      if (typeof config.projectId === 'string' && config.projectId) return config.projectId
      if (typeof config.id === 'string' && config.id) return config.id
    } catch {
      // The config is optional outside a linked local checkout.
    }
  }
  return undefined
}

export class VercelQueueTokenProvider {
  private cached: MintedToken | null = null
  private minting: Promise<string> | null = null

  async getToken(): Promise<string> {
    const staticToken = process.env.VERCEL_QUEUE_TOKEN
    if (staticToken) return staticToken
    if (this.cached && this.cached.expiresAtMs - Date.now() > TOKEN_REFRESH_MARGIN_MS) return this.cached.token
    this.minting ??= this.mint().finally(() => {
      this.minting = null
    })
    return this.minting
  }

  private async mint(): Promise<string> {
    const apiToken = process.env.VERCEL_API_TOKEN
    if (!apiToken) throw new Error('VERCEL_API_TOKEN or VERCEL_QUEUE_TOKEN is required for queue auth')
    const projectId = process.env.VERCEL_PROJECT_ID || projectIdFromRepo()
    if (!projectId) throw new Error('VERCEL_PROJECT_ID is required for queue auth')

    const url = new URL(`https://api.vercel.com/v1/projects/${projectId}/token`)
    url.searchParams.set('source', 'vercel-queue-worker')
    if (process.env.VERCEL_ORG_ID) url.searchParams.set('teamId', process.env.VERCEL_ORG_ID)
    const response = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Vercel OIDC token mint failed (${response.status})`)
    const body = await response.json() as { token?: unknown }
    if (typeof body.token !== 'string' || !body.token) throw new Error('Vercel OIDC token mint returned no token')

    this.cached = {
      token: body.token,
      expiresAtMs: decodeJwtExpiryMs(body.token) ?? Date.now() + 60 * 60_000,
    }
    return body.token
  }
}
