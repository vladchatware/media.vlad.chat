import { generateStory, generateText, generateVideo } from "../src/ai"
import { video as renderVideo } from "./render"
import { system } from "../src/prompt"

export const video = async (prompt: string) => {
  "use workflow"

  const story = await generateStory(system, prompt)
  
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)
    await generateVideo(section, `shadow-${section.side}-${section.shot}.png`, `video-${index}.mp4`)
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
  }

  await renderVideo('Video', { story })
}
