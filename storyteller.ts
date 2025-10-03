import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { generateSound, readStory, generateStory, generateText } from './src/ai'
import { RenderMediaOnProgress } from '@remotion/renderer'
import prompt from './prompt/prompt.md' with {type: 'text'}
import system from './prompt/system.md' with {type: 'text'}

const generateVideo = async (story) => {
  // const image = await generateSlide(section.image, `image-${index}.png`)
  for (const [index, section] of story.dialog.entries()) {
    console.log(`${section.voice}: ${section.text}`)
    await generateSound(
      section.text,
      section.instructions,
      section.voice,
      `speech-${index}.mp3`
    )
    await generateText(`speech-${index}.mp3`, `captions-${index}.json`)
  }

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
    onProgress
  })
}

const _story = await readStory('115-The Voice of Doubt — neti, neti and befriending the shadow')
await generateVideo(_story)

const stories = [
  "Blaming the Rules: The boy resents his teacher’s strict classroom rules, thinking, “Life is unfair.” A moment of self-honesty reveals his resistance, softening his perspective.",
  "The Trap of Comparison: Envying a classmate’s praise from the teacher, the boy thinks, “Must be nice to be them.” Journaling helps him release this narrative, finding inner worth.",
  "Releasing the Past: The boy holds a grudge against his teacher for a past failure, thinking, “I’ll never succeed.” Affirming “I am not my past,” he begins to let go and heal.",
  "The Fear of Failure: Nervous about a class presentation, the boy thinks, “I’ll just fail.” Pausing to chant “neti, neti,” he sees his fear as a story, not reality, and feels freer.",
  "Challenging the Ego: The boy dismisses his teacher’s encouragement as “fake,” projecting his own insecurity. Reflecting, he recognizes his ego’s resistance, opening to trust.",
  "The Story of Struggle: Feeling overwhelmed by schoolwork, the boy thinks, “Life is hard.” A mindfulness practice helps him see this as a narrative, not truth, shifting his view of his teacher.",
  "Breaking Free from Blame: The boy blames his teacher for his stress, thinking, “If only they were nicer.” Realizing his mind’s rationalization, he chooses compassion for both.",
  "The Illusion of Lack: The boy feels inadequate compared to his teacher’s expectations, thinking, “I’m not enough.” Affirming “I am not this doubt,” he embraces his potential.",
  "Courage to Let Go: The boy resists his teacher’s high standards, thinking, “This won’t work for me.” Reflecting on his inner dialogue, he releases resistance, finding peace within."
]

for (const prompt of stories) {
  const story = await generateStory(system, prompt)
  await generateVideo(story)
}


