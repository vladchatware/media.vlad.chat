import { generateSlide, generateStory, readStory } from '../src/ai'
import type { Story } from '../src/ai'
import { sequence } from './render'
import { system } from '../src/prompt'

export const carousel = async (prompt: string) => {
  "use workflow"

  const story = await generateStory(system, prompt)
  const image = await generateSlide(story.image, `${story.topic}.jpeg`)
  await sequence('Carousel', { story, image })
}