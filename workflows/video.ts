import { generateStory, generateText, generateVideo } from "../src/ai"
import { video as renderVideo } from "./render"
import { system } from "../src/prompt"
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

export const video = async (prompt: string) => {
  "use workflow"

  await emitStart(`Starting AI video generation for: "${prompt.slice(0, 100)}..."`, { prompt })

  await emitStep('story', 'Generating story structure...', 5)
  const story = await generateStory(system, prompt)
  
  const totalSections = story.dialog.length
  
  for (const [index, section] of story.dialog.entries()) {
    const sectionProgress = 10 + Math.round((index / totalSections) * 70)
    
    await emitStep('video', `Generating video ${index + 1}/${totalSections}: ${section.voice} - "${section.text.slice(0, 40)}..."`, sectionProgress, { 
      section: index + 1, 
      total: totalSections,
      voice: section.voice 
    })
    await generateVideo(section, `shadow-${section.side}-${section.shot}.png`, `video-${index}.mp4`)
    
    await emitStep('captions', `Generating captions for section ${index + 1}...`, sectionProgress + 5)
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
  }

  await emitStep('render', 'Rendering final video composition...', 90)
  await renderVideo('Video', { story })

  await emitComplete(`AI Video "${story.topic}" completed!`, { topic: story.topic })
  await closeProgress()
}
