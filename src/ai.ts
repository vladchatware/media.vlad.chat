import OpenAI from 'openai'
import { readdirSync, createReadStream, createWriteStream, writeFile, writeFileSync } from 'node:fs'
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
            image: {
              type: 'object', properties: {
                medium_format: { type: "string", description: "Specifies the type and style of the photographic medium, such as the camera format and resolution. Example: Full-frame DSLR portrait for high-resolution editorial photography." },
                subject_action: { type: "string", description: "Describes the subject and their action or pose, including physical characteristics and visual details. Example: A Brazilian female model with bleached blonde braids, emerging from darkness with her face bisected by light." },
                environment_time: { type: "string", description: "Defines the setting and time context of the scene, including atmospheric elements. Example: Minimal studio with a saturated cobalt-blue atmosphere and a narrow vertical spotlight." },
                camera_angle_lens: { type: "string", description: "Sets the camera perspective and lens details, including angle and aperture. Example: Head-on framing with a 50mm lens at f/2.0 for slight edge softness." },
                composition_framing: { type: "string", description: "Outlines the compositional structure and framing technique. Example: Golden section composition with a vertical slash of light as the dominant structural element." },
                color_grading_film_stock: { type: "string", description: "Specifies the color grading style and film stock reference for the visual aesthetic. Example: Monochrome cyan-blue overlay with deep indigo shadows, reminiscent of Ektachrome pushed two stops." },
                light_behaivor_atmosphere: { type: "string", description: "Details the lighting behavior and atmospheric effects, focusing on how light interacts with the subject and environment. Example: Artificial light beam carving through facial planes with a minimalist backdrop." },
                texture_detail: { type: "string", description: "Describes the level of texture and detail to emphasize in the subject and scene. Example: High-definition skin texture with visible imperfections and subtle hair frizz." },
                mood_emotional_tone: { type: "string", description: "Sets the emotional tone and mood of the image. Example: Solitary, geometric, and contemplative with undertones of alienation and revelation." },
                style_lineage_reference: { type: "string", description: "References artistic or photographic influences for the visual style. Example: Helmut Newton shadow studies combined with Noell Oszvald’s conceptual portraiture." },
                special_qualities: { type: "string", description: "Highlights unique or standout qualities of the image. Example: Hyper-minimalist with theatrical light cutting and emphasized facial architecture." },
              },
              additionalProperties: false,
              required: ['medium_format', 'subject_action', 'environment_time', 'camera_angle_lens', 'composition_framing', 'color_grading_film_stock', 'light_behaivor_atmosphere', 'texture_detail', 'mood_emotional_tone', 'style_lineage_reference', 'special_qualities']
            },
            dialog: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string', description: 'Dialog script.' },
                  narration: { type: 'string', description: 'Prose scene description in plain language. Describe characters, costumes, scenery, weather and other details. Be as descriptive to generate a video that matches your vision.' },
                  instructions: { type: 'string', description: 'control aspects of speech, including: Accent, Emotional range, Intonation, Impressions, Speed of speech, Tone, Whispering.' },
                  side: { type: 'string', enum: ['left', 'right'], description: 'The side of the conversation: Student -> Teacher is left, Student <- Teacher is right.' },
                  shot: { type: 'string', enum: ['closeup', 'medium', 'two-shot'], description: 'Two-Shot: frames two suvjects, side by side, to show their relationship or interaction. Close-Up: Frames a subject tightly, often focusing on the face, hands. Emphasizes emotion, detail or significance. Medium Shot: frames the subject from the waist up. Balances detail and context, often used for dialogue or character interactions.' },
                  mood: { type: 'string', description: 'overall tone, e.g. cinematic and tense, playful and suspenseful, luxurious anticipation.' },
                  voice: { type: 'string', enum: ['ash', 'onyx'], description: 'Ash is the teacher, Onyx is the student.' },
                  seconds: { type: 'number', enum: [4, 8, 12], description: 'The length of the section with a dialogue in it.' },
                },
                additionalProperties: false,
                required: ['text', 'narration', 'instructions', 'side', 'shot', 'mood', 'voice', 'seconds']
              },
              additionalProperties: false,
              required: []
            }
          },
          additionalProperties: false,
          required: ['topic', 'dialog', 'image']
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

export const listVideos = async () => {
  const res = await openai.videos.list()

  return res.data
}

export const downloadVideo = async (id, name) => {
  const res = await openai.videos.downloadContent(id)
  await Bun.write(`${__dirname}/../public/${name}`, Buffer.from(await res.arrayBuffer()))
}

export const generateVideo = async ({ text, narration, mood, instructions, shot, seconds }, reference, name = 'video.mp4') => {
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
  const input_reference = Bun.file(`${__dirname}/../public/${reference}`)
  const job = await openai.videos.create({
    prompt,
    input_reference,
    model: 'sora-2',
    seconds,
    size: '720x1280'
  })

  await new Promise((res, rej) => {
    let completed = false

    setInterval(async () => {
      if (completed) {
        return res(job)
      }

      try {
        const res = await openai.videos.retrieve(job.id)
        if (res.completed_at) completed = true
        if (res.error) return rej(res.error)
        process.stdout.write(`status: ${res.status}, completed: ${res.progress}\r`)
      } catch (e) {
        rej(e)
      }
    }, 1000)
  })

  const res = await openai.videos.downloadContent(job.id)
  await Bun.write(`${__dirname}/../public/${name}`, Buffer.from(await res.arrayBuffer()))
}

export const generateSlide = async (prompt: string, name = 'slide.png') => {
  const defaults = {
    medium_format: "Full-frame DSLR portrait I high-resolution editorial photograph",
    subject_action: "Brazilian female model with bleached blonde braids emerging from darkness, face bisected by a beam of harsh light, her eye perfectly illuminated. She has delicate tattoos, nose ring, and earrings",
    environment_time: "Minimal studio with saturated cobalt-blue atmosphere and a narrow vertical spotlight strip",
    camera_angle_lens: "Head-on framing with 50mm lens, f/2.0 for slight softness in edges",
    composition_framing: "Golden section composition, vertical slash of light as dominant structural element",
    color_grading_film_stock: "Monochrome cyan-blue overlay with deep indigo shadows, cinematic contrast reminiscent of Ektachrome pushed two stops",
    light_behaivor_atmosphere: "Artificial light beam carving through facial planes, minimalist backdrop exaggerates light-shape abstraction",
    texture_detail: "High-definition skin texture, visible skin detail, visible skin abnormalities and imperfections, subtle frizz in hair strands, abstracted facial contours",
    mood_emotional_tone: "Solitary, geometric, contemplative with undertones of alienation and revelation",
    style_lineage_reference: "Helmut Newton shadow studies meets conceptual portraiture of Noell Oszvald",
    special_qualities: "Hyper-minimalist, theatrical light cutting, facial architecture emphasized",
  }

  // const image = await openai.images.generate({
  //   model: 'gpt-image-1',
  //   prompt,
  //   size: '1024x1536'
  // })

  await Bun.write(`${__dirname}/../public/${name}`, Buffer.from(image.data[0].b64_json, 'base64'))

  return name
}
