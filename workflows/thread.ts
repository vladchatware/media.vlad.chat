import { generateSound } from "../src/ai"
import { video } from "./render"
import { staticUrl } from "../remotion/assets"
import { emitStart, emitStep, emitComplete, emitFailure, closeProgress } from '../src/progress'

export const thread = async (content: string, voice: 'ash' | 'onyx') => {
    "use workflow"

    try {
        await emitStart(`Starting thread video generation`, { voice, contentPreview: content.slice(0, 100) })

        await emitStep('audio', `Generating voiceover with ${voice} voice...`, 30)
        const sound = await generateSound(content, '', voice, `speech-${voice}.mp3`)

        await emitStep('render', 'Rendering thread video...', 70)
        const render = await video('Thread', { image: staticUrl('pic.jpeg'), username: 'vlad.chat', content, sound, mode: 'light' })

        await emitComplete(`Thread video completed!`, { voice })

        return { content, voice, video: render.url }
    } catch (error) {
        await emitFailure('Thread video generation', error)
        throw error
    } finally {
        await closeProgress()
    }
}
