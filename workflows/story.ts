import { generateSlide, generateSound, generateStory, generateText, readStory } from '../src/ai'
import type { Story } from '../src/ai'
import { system } from '../src/prompt'
import { video } from './render'
import { emitStart, emitStep, emitComplete, emitFailure, closeProgress } from '../src/progress'

const produceStory = async (story: Story) => {
  "use workflow"

  const totalSteps = story.dialog.length * 2 + 1 // slides + (sound + text per dialog)
  let currentStep = 0

  await emitStep('slide', 'Generating slide image...', Math.round((currentStep / totalSteps) * 100))
  const image = await generateSlide(story.image, `slide-0.png`)
  currentStep++

  const dialog = []
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)

    await emitStep('audio', `Generating audio for ${section.voice}: "${section.text.slice(0, 50)}..."`, Math.round((currentStep / totalSteps) * 100))
    const sound = await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    currentStep++

    await emitStep('captions', `Generating captions for section ${index + 1}...`, Math.round((currentStep / totalSteps) * 100))
    const captionsSrc = await generateText(sound, `captions-${index}.json`)
    currentStep++

    dialog.push({ ...section, sound, captionsSrc })
  }

  return { topic: story.topic, dialog, image }
}

export const story = async (prompt: string) => {
  "use workflow"

  try {
    await emitStart(`Starting story generation for: "${prompt.slice(0, 100)}..."`, { prompt })

    await emitStep('story', 'Generating story structure with AI...', 5)
    const story = await generateStory(system, prompt)

    await emitStep('production', `Story "${story.topic}" created. Starting media production...`, 15, { topic: story.topic })
    const media = await produceStory(story)

    await emitStep('render', 'Rendering final video...', 90)
    const render = await video('Story', media)

    await emitComplete(`Story "${story.topic}" completed!`, { topic: story.topic })

    return { story, video: render.url }
  } catch (error) {
    await emitFailure('Story generation', error)
    throw error
  } finally {
    await closeProgress()
  }
}
