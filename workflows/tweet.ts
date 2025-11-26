import { generateSound } from "../src/ai"
import { video } from "./render"

export const tweet = async (content: string, voice: 'ash' | 'onyx') => {
    "use workflow"
    
    const sound = await generateSound(content, '', voice, `speech-${voice}.mp3`)
    await video('Tweet', { sound, content })
}