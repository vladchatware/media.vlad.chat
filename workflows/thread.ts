import { generateSound } from "../src/ai"
import { video } from "./render"

export const thread = async (content: string, voice: 'ash' | 'onyx') => {
    "use workflow"

    const sound = await generateSound(content, '', voice, `speech-${voice}.mp3`)
    await video('Thread', { image: 'pic.jpeg', username: 'vlad.chat', content, sound, mode: 'light' })
}