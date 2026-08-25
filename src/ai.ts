import OpenAI from 'openai'
import { readdirSync, createReadStream, writeFileSync, readFileSync } from 'fs'
import { z } from 'zod'
import { generateObject } from 'ai'
const openai = new OpenAI()

const imageSchema = z.object({
  medium_format: z.string().describe('Specifies the type and style of the photographic medium, such as the camera format and resolution. Example: Full-frame DSLR portrait for high-resolution editorial photography.'),
  subject_action: z.string().describe('Describes the subject and their action or pose, including physical characteristics and visual details. Example: A Brazilian female model with bleached blonde braids, emerging from darkness with her face bisected by light.'),
  environment_time: z.string().describe('Defines the setting and time context of the scene, including atmospheric elements. Example: Minimal studio with a saturated cobalt-blue atmosphere and a narrow vertical spotlight.'),
  camera_angle_lens: z.string().describe('Sets the camera perspective and lens details, including angle and aperture. Example: Head-on framing with a 50mm lens at f/2.0 for slight edge softness.'),
  composition_framing: z.string().describe('Outlines the compositional structure and framing technique. Example: Golden section composition with a vertical slash of light as the dominant structural element.'),
  color_grading_film_stock: z.string().describe('Specifies the color grading style and film stock reference for the visual aesthetic. Example: Monochrome cyan-blue overlay with deep indigo shadows, reminiscent of Ektachrome pushed two stops.'),
  light_behaivor_atmosphere: z.string().describe('Details the lighting behavior and atmospheric effects, focusing on how light interacts with the subject and environment. Example: Artificial light beam carving through facial planes with a minimalist backdrop.'),
  texture_detail: z.string().describe('Describes the level of texture and detail to emphasize in the subject and scene. Example: High-definition skin texture with visible imperfections and subtle hair frizz.'),
  mood_emotional_tone: z.string().describe('Sets the emotional tone and mood of the image. Example: Solitary, geometric, and contemplative with undertones of alienation and revelation.'),
  style_lineage_reference: z.string().describe("References artistic or photographic influences for the visual style. Example: Helmut Newton shadow studies combined with Noell Oszvald’s conceptual portraiture."),
  special_qualities: z.string().describe('Highlights unique or standout qualities of the image. Example: Hyper-minimalist with theatrical light cutting and emphasized facial architecture.')
})

const dialogSchema = z.object({
  text: z.string().describe('Dialog script.'),
  narration: z.string().describe('Prose scene description in plain language. Describe characters, costumes, scenery, weather and other details. Be as descriptive to generate a video that matches your vision.'),
  instructions: z.string().describe('Control aspects of speech, including: Accent, Emotional range, Intonation, Impressions, Speed of speech, Tone, Whispering.'),
  side: z.enum(['left', 'right']).describe('The side of the conversation: Student -> Teacher is left, Student <- Teacher is right.'),
  shot: z.enum(['closeup', 'medium', 'two-shot']).describe('Two-Shot: frames two subjects, side by side, to show their relationship or interaction. Close-Up: Frames a subject tightly, often focusing on the face, hands. Emphasizes emotion, detail or significance. Medium Shot: frames the subject from the waist up. Balances detail and context, often used for dialogue or character interactions.'),
  mood: z.string().describe('Overall tone, e.g. cinematic and tense, playful and suspenseful, luxurious anticipation.'),
  voice: z.enum(['ash', 'onyx']).describe('Ash is the teacher, Onyx is the student.'),
  seconds: z.union([z.literal(4), z.literal(8), z.literal(12)]).describe('The length of the section with a dialogue in it.')
})

export const storySchema = z.object({
  topic: z.string().describe('Conversation topic'),
  image: imageSchema,
  dialog: z.array(dialogSchema).describe('Dialog entries for the story.')
})

export type Story = z.infer<typeof storySchema>

export const readStory = async (name: string | undefined): Promise<Story> => {
  "use step"
  let story: string | null = null
  if (name) {
    story = readFileSync(`${process.cwd()}/stories/${name}.json`, 'utf-8')
  } else {
    const stories = readdirSync(`${process.cwd()}/stories`)
    const lastStory = stories.length - 1

    story = readFileSync(`${process.cwd()}/stories/${stories[lastStory]}`, 'utf-8')
  }

  if (!story) {
    throw new Error('Story not found.')
  }

  return storySchema.parse(JSON.parse(story))
}

export const generateStory = async (system: string, prompt: string) => {
  "use step"
  
  const {object} = await generateObject({
    model: 'openai/gpt-5-mini',
    system,
    prompt,
    schema: storySchema
  })

  const story = storySchema.parse(object)

  const counter = readdirSync(`${process.cwd()}/stories`).length

  writeFileSync(`${process.cwd()}/stories/${counter}-${story.topic}.json`, JSON.stringify(story, null, 2))

  return story
}

export const generateSound = async (input: string, instructions = '', voice: 'ash' | 'onyx', name = 'speech.mp3') => {
  "use step"

  const audio = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input,
    instructions
  })

  writeFileSync(`${process.cwd()}/public/${name}`, Buffer.from(await audio.arrayBuffer()))

  return name
}

export const generateText = async (input: string, name: string) => {
  "use step"

  const transcription = await openai.audio.transcriptions.create({
    file: createReadStream(`${process.cwd()}/public/${input}`),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  })

  writeFileSync(`${process.cwd()}/public/${name}`, JSON.stringify(transcription, null, 2))

  return name
}

export const listVideos = async () => {
  "use step"
  const res = await openai.videos.list()

  return res.data
}

export const downloadVideo = async (id, name) => {
  "use step"
  const res = await openai.videos.downloadContent(id)
  writeFileSync(`${process.cwd()}/public/${name}`, Buffer.from(await res.arrayBuffer()))
}

export const generateVideo = async ({ text, narration, mood, instructions, shot, seconds }, reference, name = 'video.mp4') => {
  "use step"
  
  const prompt = `
${narration}

Cinematography:
Camera shot: ${shot}
Mood: ${mood}

Instructions:
${instructions}

Dialogue:
${text}
`
  const input_reference = Bun.file(`${process.cwd()}/public/${reference}`)
  const job = await openai.videos.create({
    prompt,
    input_reference,
    model: 'sora-2',
    seconds,
    size: '720x1280'
  })

  await new Promise((res, rej) => {
    const interval = setInterval(async () => {
      try {
        const result = await openai.videos.retrieve(job.id)
        if (result.completed_at) {
          clearInterval(interval)
          return res(job)
        }
        if (result.error) {
          clearInterval(interval)
          return rej(result.error)
        }
        process.stdout.write(`status: ${result.status}, completed: ${result.progress}\r`)
      } catch (e) {
        clearInterval(interval)
        rej(e)
      }
    }, 1000)
  })

  const res = await openai.videos.downloadContent(job.id)
  writeFileSync(`${process.cwd()}/public/${name}`, Buffer.from(await res.arrayBuffer()))
}

export const generateSlide = async (options: z.infer<typeof imageSchema>, name = 'slide.png') => {
  "use step"
  const prompt = `
  ${options.medium_format}
  ${options.subject_action}
  ${options.environment_time}
  ${options.camera_angle_lens}
  ${options.composition_framing}
  ${options.color_grading_film_stock}
  ${options.light_behaivor_atmosphere}
  ${options.texture_detail}
  ${options.mood_emotional_tone}
  ${options.style_lineage_reference}
  ${options.special_qualities}
  `

  const image = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1536'
  })

  if (!image.data || image.data.length === 0 || !image.data[0].b64_json) {
    throw new Error('Image generation failed: No image data returned from OpenAI.')
  }

  writeFileSync(`${process.cwd()}/public/${name}`, Buffer.from(image.data[0].b64_json, 'base64'))

  return name
}
