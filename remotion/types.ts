import { z } from 'zod/v3'

export const storySchema = z.object({
  content: z.string(),
  sound: z.string(),
  side: z.string()
})

export const threadSchema = z.object({
  image: z.string(),
  username: z.string(),
  content: z.string(),
  sound: z.string(),
  mode: z.enum(['dark', 'light'])
})

export const storyProp = z.object({
  story: z.object({
    topic: z.string(),
    dialog: z.object({
      text: z.string(),
      instructions: z.string(),
      side: z.enum(['left', 'right']),
      voice: z.enum(['onyx', 'ash']),
      shot: z.enum(['two-shot', 'medium', 'closeup']).default('two-shot'),
      sound: z.string().optional(),
      narration: z.string().optional(),
      mood: z.string().optional(),
      seconds: z.number().optional()
    }).array()
  }),
  sound: z.string().default('1939477514.mp4'),
})

export const carouselSchema = z.object({
  story: storyProp.shape.story,
  image: z.string(),
})

export const outroSchema = z.object({
  video: z.string(),
})

export const tweetSchema = z.object({
  image: z.string(),
  username: z.string(),
  handle: z.string(),
  content: z.string(),
  sound: z.string(),
  mode: z.enum(['dark', 'light'])
})
