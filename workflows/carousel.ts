import { generateSlide, generateStory } from '../src/ai'
import type { Story } from '../src/ai'
import { sequence } from './render'
import { system } from '../src/prompt'
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

export const carousel = async (prompt: string) => {
  "use workflow"

  await emitStart(`Starting carousel generation for: "${prompt.slice(0, 100)}..."`, { prompt })

  await emitStep('story', 'Generating story content...', 10)
  const story = await generateStory(system, prompt)
  
  await emitStep('image', `Generating slide image for "${story.topic}"...`, 40, { topic: story.topic })
  const image = await generateSlide(story.image, `${story.topic}.jpeg`)
  
  await emitStep('render', 'Rendering carousel sequence...', 70)
  await sequence('Carousel', { story, image })

  await emitComplete(`Carousel "${story.topic}" completed!`, { topic: story.topic })
  await closeProgress()
}
