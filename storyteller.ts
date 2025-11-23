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

const story = await generateStory(system, `The Judgment Spiral
He mentally tears someone apart for cutting him off.
Higher self: “Notice the judge, not the judged.”
He watches the thoughts instead of feeding them — they dissolve into stillness.
Caption: “I stopped trying to fix them and fixed my focus instead.”`)

console.log(story.topic)
// const story = await readStory('127-Impatience in Traffic')
// await produceStory(story)
// await renderStory(story)

const stories = [
  // prompt
  // "Naive to Wise Innocence",
  // "Forgetting the Child",
  // "Ego's Loud Excuses",
  // "Resistance to Surrender",
  // "The Sage's Innocence"
]

for (const prompt of stories) {
  const story = await generateStory(system, prompt)
  await produceStory(story)
  await renderStory(story)
}


