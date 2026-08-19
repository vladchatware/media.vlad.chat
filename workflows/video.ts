import { generateSound, generateStory, generateText, generateVideo } from "../src/ai"
import { staticUrl } from "../remotion/assets"
import { video as renderVideo } from "./render"
import { system } from "../src/prompt"

export const video = async (prompt: string) => {
  "use workflow"

  const story = await generateStory(system, prompt)
  const dialog = []

  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)
    const reference = staticUrl(`shadow.png`)
    await generateVideo(section, reference, `video-${index}.mp4`)
    const sound = await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`,
    )
    const captionsSrc = await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
    dialog.push({ ...section, sound, captionsSrc })
  }

  const render = await renderVideo('Video', { story: { topic: story.topic, dialog } })

  return { story, video: render.url }
}
