import { generateSlide, generateSound, generateStory, generateText, readStory } from '../src/ai'
import type { Story } from '../src/ai'
import { system } from '../src/prompt'
import { video } from './render'

const produceStory = async (story: Story) => {
  "use workflow"
  const image = await generateSlide(story.image, `slide-0.png`)

  const dialog = []
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)

    const sound = await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    const captionsSrc = await generateText(`speech-${index}.mp3`, `captions-${index}.json`)

    dialog.push({ ...section, sound, captionsSrc })
  }

  return { topic: story.topic, dialog, image }
}

export const story = async (prompt: string) => {
  "use workflow"

  const story = await generateStory(system, prompt)
  const media = await produceStory(story)
  const render = await video('Story', media)

  return { story, video: render.url }
}
