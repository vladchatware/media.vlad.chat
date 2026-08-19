import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import OpenAI from 'openai'

const openai = new OpenAI()

const script = `A BPM and key only tell you part of the story.

Backroom analyzes how a track moves: its structure, energy, mood, instrumentation, and possible mix points.

Audio tagging adds semantic evidence, while timing analysis finds the moments that matter, like a buildup, breakdown, or low-end entrance.

The result isn't an automatic DJ. It's a prepared track, ready for your judgment.`

const output = 'remotion/BackroomFilm/public/backroom-explainer-voice-openai.mp3'
const timestampsOutput =
  'remotion/BackroomFilm/public/backroom-explainer-voice-openai.words.json'

const speech = await openai.audio.speech.create({
  model: 'gpt-4o-mini-tts',
  voice: 'cedar',
  input: script,
  instructions:
    'Calm, confident editorial narration for a refined music technology product. Natural conversational pacing. Warm low register. Avoid announcer energy, exaggerated emphasis, vocal fry, and synthetic-sounding pauses. Brief pause between paragraphs. Pronounce BPM as B P M.',
  response_format: 'mp3',
})

await writeFile(output, Buffer.from(await speech.arrayBuffer()))

const transcription = await openai.audio.transcriptions.create({
  file: createReadStream(output),
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['word'],
})

await writeFile(timestampsOutput, JSON.stringify(transcription, null, 2))

console.log(JSON.stringify({ output, timestampsOutput }, null, 2))
