import { bundle } from '@remotion/bundler'
import { renderFrames, selectComposition } from '@remotion/renderer'
import { generateSlide, generateStory, readStory } from './src/ai'
import type { Story } from './src/ai'
import { mkdirSync, existsSync } from 'node:fs'
import system from './prompt/system.md' with {type: 'text'}

const produceCarousel = async (story: Story) => {
  console.log(`Generating image for ${story.topic}...`)
  await generateSlide(story.image, `${story.topic}.jpeg`)
}

const renderCarousel = async (story: Story, image = 'waking-from-the-con.jpeg') => {
  console.log(`Bundling...`)
  const serveUrl = await bundle({
    entryPoint: './remotion/index.ts'
  })

  console.log(`Selecting composition...`)
  const composition = await selectComposition({
    serveUrl,
    id: 'Carousel',
    inputProps: {
      story,
      image
    }
  })

  const outputDir = `out/${story.topic}`
  if (!existsSync(outputDir)){
      mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Rendering ${composition.durationInFrames} slides to ${outputDir}...`)

  await renderFrames({
    composition,
    serveUrl,
    outputDir,
    imageFormat: 'png',
    inputProps: {
      story,
      image
    },
    onStart: () => console.log('Rendering frames...'),
    onFrameUpdate: (f) => process.stdout.write(`Rendered frame ${f}\r`),
  })
  
  console.log(`\nDone! saved to ${outputDir}`)
}

const stories = [
    [166, 'The Surrender of Control']
]

// const story = await generateStory(system, `Waking from the Con

// To run with an existing story:
// const story = await readStory('145-The Need to Be Right — Choosing Peace Over Winning')

for (const [index, topic] of stories) {
    const story = await readStory(`${index}-${topic}`)
    // await produceCarousel(story)
    await renderCarousel(story, `${index}.jpeg`)
    console.log(`Generated story: ${story.topic}`)
}


// await produceCarousel(story)
// await renderCarousel(story)

