import { start } from "workflow/api"
import { generateSlide, generateSound, generateStory, generateText } from '../src/ai'
import type { Story } from '../src/ai'
import { system } from '../src/prompt'
import { video } from './render'

const produceStory = async (story: Story) => {
  "use workflow"
  await generateSlide(story.image, `slide-0.png`)
  
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)
    
    await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
  }
}

export const story = async (prompt: string) => {
  "use workflow"

  const story = await generateStory(system, prompt)
  await start(produceStory, [story])
  await start(video, ['Story', story])

  return story
}

