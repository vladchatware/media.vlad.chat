import { generateSound } from "../src/ai"
import { video } from "./render"
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

export const tweet = async (content: string, voice: 'ash' | 'onyx') => {
  "use workflow"

  await emitStart(`Starting tweet video generation`, { voice, contentPreview: content.slice(0, 100) })
  
  await emitStep('audio', `Generating voiceover with ${voice} voice...`, 30)
  const sound = await generateSound(content, '', voice, `speech-${voice}.mp3`)
  
  await emitStep('render', 'Rendering tweet video...', 70)
  await video('Tweet', { sound, content })

  await emitComplete(`Tweet video completed!`, { voice })
  await closeProgress()
}
