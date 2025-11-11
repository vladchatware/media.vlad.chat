import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { generateSound, readStory, generateStory, generateText, generateVideo, generateSlide } from './src/ai'
import type { Story } from './src/ai'
import { RenderMediaOnProgress } from '@remotion/renderer'
import prompt from './prompt/prompt.md' with {type: 'text'}
import system from './prompt/system.md' with {type: 'text'}

const produceStory = async (story: Story) => {
  // await generateSlide(story.image, `slide-0.png`)
  
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)
    // await generateVideo(section, `shadow-${section.side}-${section.shot}.png`, `video-${index}.mp4`)
    await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
  }
}

const renderStory = async (story) => {
  const serveUrl = await bundle({
    entryPoint: './remotion/index.ts'
  })

  const composition = await selectComposition({
    serveUrl,
    id: 'Story',
    inputProps: {
      story,
    }
  })

  const onProgress: RenderMediaOnProgress = ({ progress }) => {
    process.stdout.write(`Rendering is ${Math.floor(progress * 100)}% complete\r`);
  };

  await renderMedia({
    composition,
    serveUrl,
    outputLocation: `out/${story.topic}.mp4`,
    codec: 'h264',
    concurrency: 4,
    timeoutInMilliseconds: 100000,
    onProgress,
    verbose: false,
    hardwareAcceleration: 'if-possible',
    videoBitrate: '8000k'
  })
}

const story = await readStory('1-The Tantrum of Mineness')
await generateVideo(story)

const stories = [
  prompt
  // "The Tantrum of Mineness",
  // "Impatience in Traffic",
  // "The God-Complex of Cleanliness",
  // "Boredom's Muddy Lens",
  // "Arrogance of Ownership",
  // "The Victim of Interruptions",
  // "Forgetting the Heartbeat",
  // "Judging the Mango",
  // "The Ego's Credit Claim",
  // "The Child's Awe Returns"
]

for (const prompt of stories) {
  const story = await generateStory(system, prompt)
  await produceStory(story)
  await renderStory(story)
}


