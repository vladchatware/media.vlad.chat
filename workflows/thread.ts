import { generateSound } from "../src/ai"
import { staticUrl } from "../remotion/assets"
import { video } from "./render"

export const thread = async (content: string, voice: 'ash' | 'onyx') => {
    "use workflow"

    const sound = await generateSound(content, '', voice, `speech-${voice}.mp3`)
    const render = await video('Thread', { image: staticUrl('pic.jpeg'), username: 'vlad.chat', content, sound, mode: 'light' })

    return { content, voice, video: render.url }
}