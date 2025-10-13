import OpenAI from 'openai'
import { readdirSync, createReadStream } from 'node:fs'
const openai = new OpenAI()

export const readStory = async (name: string | undefined): Promise<{ text: string[] }> => {
  let story: Bun.BunFile = null
  if (name) {
    story = Bun.file(`${__dirname}/../stories/${name}.json`, { type: 'application/json' })
  } else {
    const stories = readdirSync(`${__dirname}/../stories`)
    const lastStory = stories.length - 1

    story = Bun.file(`${__dirname}/../stories/${stories[lastStory]}`, { type: 'application/json' })
  }

  if (!story) {
    throw new Error('Story not found.')
  }

  return story.json()
}

export const generateStory = async (system: string, prompt: string) => {
  const response = await openai.responses.parse({
    model: 'gpt-5-mini',
    input: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
    text: {
      format: {
        type: 'json_schema',
        name: 'story',
        schema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Conversation topic' },
            dialog: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'Dialog script.' },
                  instructions: { type: 'string', description: 'control aspects of speech, including: Accent, Emotional range, Intonation, Impressions, Speed of speech, Tone, Whispering.' },
                  side: { type: 'string', enum: ['left', 'right'], description: 'The side of the conversation: Student -> Teacher is left, Student <- Teacher is right.' },
                  shot: { type: 'string', enum: ['closeup', 'medium', 'two-shot'], description: 'Two-Shot: frames two suvjects, side by side, to show their relationship or interaction. Close-Up: Frames a subject tightly, often focusing on the face, hands. Emphasizes emotion, detail or significance. Medium Shot: frames the subject from the waist up. Balances detail and context, often used for dialogue or character interactions.' },
                  voice: { type: 'string', enum: ['ash', 'onyx'], description: 'Ash is the teacher, Onyx is the student.' }
                },
                additionalProperties: false,
                required: ['text', 'instructions', 'side', 'shot', 'voice']
              },
              additionalProperties: false,
              required: []
            }
          },
          additionalProperties: false,
          required: ['topic', 'dialog']
        }
      }
    }
  })

  const story = response.output_parsed

  const counter = readdirSync(`${__dirname}/../stories`).length

  Bun.write(`${__dirname}/../stories/${counter}-${story.topic}.json`, JSON.stringify(story, null, 2))

  return response.output_parsed
}

export const generateSound = async (input: string, instructions = '', voice: 'ash' | 'onyx', name = 'speech.mp3') => {
  const audio = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input,
    instructions
  })

  await Bun.write(`${__dirname}/../public/${name}`, Buffer.from(await audio.arrayBuffer()))

  return name
}

export const generateText = async (input: string, name: string) => {
  const transcription = await openai.audio.transcriptions.create({
    file: createReadStream(`${__dirname}/../public/${input}`),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  })

  await Bun.write(`${__dirname}/../public/${name}`, JSON.stringify(transcription, null, 2))

  return name
}

export const generateSlide = async (prompt: string, name = 'slide.png') => {
  const image = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1536'
  })

  await Bun.write(`${__dirname}/../public/${name}`, Buffer.from(image.data[0].b64_json, 'base64'))

  return name
}
