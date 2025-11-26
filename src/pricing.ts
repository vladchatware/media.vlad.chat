/**
 * OpenAI API Pricing (as of late 2024)
 * All prices in cents per unit
 * 
 * Note: Update these when OpenAI changes pricing
 */

export const PRICING = {
  // GPT-5-mini (text generation) - per 1M tokens
  'gpt-5-mini': {
    inputPerMillion: 15, // $0.15 per 1M input tokens = 15 cents
    outputPerMillion: 60, // $0.60 per 1M output tokens = 60 cents
  },
  
  // GPT-4o-mini-TTS (text-to-speech) - per 1M characters
  'gpt-4o-mini-tts': {
    perMillionChars: 1200, // $12 per 1M characters = 1200 cents
  },
  
  // Whisper-1 (transcription) - per minute
  'whisper-1': {
    perMinute: 0.6, // $0.006 per minute = 0.6 cents
  },
  
  // GPT-Image-1 (image generation) - per image
  'gpt-image-1': {
    '1024x1024': 4, // $0.04 per image
    '1024x1536': 8, // $0.08 per image (higher res)
    '1536x1024': 8, // $0.08 per image (higher res)
  },
  
  // Sora-2 (video generation) - per second at 720p
  'sora-2': {
    '480p': { perSecond: 2 },   // $0.02 per second
    '720p': { perSecond: 4 },   // $0.04 per second
    '1080p': { perSecond: 8 },  // $0.08 per second
  },
} as const

/**
 * Calculate cost for text generation (GPT models)
 */
export function calculateTextCost(
  model: 'gpt-5-mini',
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model]
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  return Math.ceil((inputCost + outputCost) * 100) // Convert to cents, round up
}

/**
 * Calculate cost for text-to-speech
 */
export function calculateTTSCost(
  model: 'gpt-4o-mini-tts',
  characterCount: number
): number {
  const pricing = PRICING[model]
  const cost = (characterCount / 1_000_000) * pricing.perMillionChars
  return Math.ceil(cost * 100) // Convert to cents
}

/**
 * Calculate cost for audio transcription
 */
export function calculateTranscriptionCost(
  model: 'whisper-1',
  durationSeconds: number
): number {
  const pricing = PRICING[model]
  const durationMinutes = durationSeconds / 60
  return Math.ceil(durationMinutes * pricing.perMinute)
}

/**
 * Calculate cost for image generation
 */
export function calculateImageCost(
  model: 'gpt-image-1',
  dimensions: '1024x1024' | '1024x1536' | '1536x1024'
): number {
  return PRICING[model][dimensions]
}

/**
 * Calculate cost for video generation
 */
export function calculateVideoCost(
  model: 'sora-2',
  durationSeconds: number,
  resolution: '480p' | '720p' | '1080p' = '720p'
): number {
  const pricing = PRICING[model][resolution]
  return Math.ceil(durationSeconds * pricing.perSecond)
}

/**
 * Estimate workflow cost before running
 */
export function estimateWorkflowCost(workflowType: string, params?: Record<string, unknown>): {
  minCents: number
  maxCents: number
  breakdown: string[]
} {
  switch (workflowType) {
    case 'tweet':
      return {
        minCents: 15,
        maxCents: 50,
        breakdown: [
          'TTS (~10-30 cents)',
          'Video render (~5-20 cents)',
        ],
      }
    
    case 'thread':
      return {
        minCents: 20,
        maxCents: 75,
        breakdown: [
          'TTS (~15-40 cents)',
          'Video render (~5-35 cents)',
        ],
      }
    
    case 'carousel':
      return {
        minCents: 50,
        maxCents: 200,
        breakdown: [
          'Story generation (~5-15 cents)',
          'Image generation (~8-40 cents per slide)',
          'TTS (~10-30 cents)',
        ],
      }
    
    case 'story':
      return {
        minCents: 100,
        maxCents: 500,
        breakdown: [
          'Story generation (~5-15 cents)',
          'Image generation (~8-40 cents)',
          'TTS for each section (~30-100 cents)',
          'Transcription (~5-20 cents)',
          'Video render (~50-200 cents)',
        ],
      }
    
    case 'video':
      return {
        minCents: 200,
        maxCents: 1000,
        breakdown: [
          'Story generation (~5-15 cents)',
          'Sora video generation (~100-500 cents)',
          'TTS (~30-100 cents)',
          'Final render (~50-200 cents)',
        ],
      }
    
    default:
      return {
        minCents: 10,
        maxCents: 100,
        breakdown: ['Unknown workflow type'],
      }
  }
}

