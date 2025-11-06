import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { generateSound, readStory, generateStory, generateText, generateVideo } from './src/ai'
import { RenderMediaOnProgress } from '@remotion/renderer'
import prompt from './prompt/prompt.md' with {type: 'text'}
import system from './prompt/system.md' with {type: 'text'}

const produceStory = async (story) => {
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
    concurrency: 2,
    timeoutInMilliseconds: 100000,
    onProgress,
    verbose: false,
    hardwareAcceleration: 'if-possible'
  })
}

// const _story = await readStory('175-The Identity of Pain')
// await produceStory(_story)
// await renderStory(_story)


const stories = [
]

for (const prompt of stories) {
  const story = await generateStory(system, prompt)
  await produceStory(story)
  await renderStory(story)
}


