import { start } from "workflow/api"
import { generateSlide, generateSound, generateStory, generateText } from '../src/ai'
import type { Story } from '../src/ai'
import { system } from '../src/prompt'
import { video } from './render'
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

const produceStory = async (story: Story) => {
  "use workflow"
  
  const totalSteps = story.dialog.length * 2 + 1 // slides + (sound + text per dialog)
  let currentStep = 0

  await emitStep('slide', `Generating slide image...`, Math.round((currentStep / totalSteps) * 100))
  await generateSlide(story.image, `slide-0.png`)
  currentStep++
  
  for (const [index, section] of story.dialog.entries()) {
    await emitStep('audio', `Generating audio for ${section.voice}: "${section.text.slice(0, 50)}..."`, Math.round((currentStep / totalSteps) * 100))
    
    await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    currentStep++

    await emitStep('captions', `Generating captions for section ${index + 1}...`, Math.round((currentStep / totalSteps) * 100))
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
    currentStep++
  }
}

export const story = async (prompt: string) => {
  "use workflow"

  await emitStart(`Starting story generation for: "${prompt.slice(0, 100)}..."`, { prompt })

  await emitStep('story', 'Generating story structure with AI...', 5)
  const storyData = await generateStory(system, prompt)
  
  await emitStep('production', `Story "${storyData.topic}" created. Starting media production...`, 15, { topic: storyData.topic })
  await start(produceStory, [storyData])
  
  await emitStep('render', 'Rendering final video...', 90)
  await start(video, ['Story', storyData])

  await emitComplete(`Story "${storyData.topic}" completed!`, { topic: storyData.topic })
  await closeProgress()

  return storyData
}
