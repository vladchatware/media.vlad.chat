import { z } from 'zod'

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
      voice: z.enum(['onyx', 'ash'])
    }).array()
  })
})

export const tweetSchema = z.object({
  image: z.string(),
  username: z.string(),
  handle: z.string(),
  content: z.string(),
  sound: z.string(),
  mode: z.enum(['dark', 'light'])
})
