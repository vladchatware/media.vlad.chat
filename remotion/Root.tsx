import React from 'react'
import { z } from 'zod'
import { Composition, staticFile } from 'remotion'
import { parseMedia } from '@remotion/media-parser'
import { Story, StoryMetadata } from './Story'
import { Thread } from './Thread'
import { Tweet } from './Tweet'
import { Slide, SlideProps } from './Slide'
import { storyProp, storySchema, threadSchema, tweetSchema, slideSchema, carouselSchema } from './types'
import { openAiWhisperApiToCaptions } from '@remotion/openai-whisper'
import { Carousel } from './Carousel'
import { Outro } from './Outro'
import { storyData } from './data'

const calculateMetadata = async ({ props }) => {
  const { slowDurationInSeconds } = await parseMedia({
    src: staticFile(props.sound as string),
    fields: { slowDurationInSeconds: true }
  })

  return {
    durationInFrames: Math.floor(slowDurationInSeconds * 30) + 10
  }
}

export const RemotionRoot: React.FC = () =>
  <>
    <Composition
      id="Thread"
      component={Thread}
      durationInFrames={10}
      fps={30}
      width={1284}
      height={2282}
      schema={threadSchema}
      defaultProps={{
        image: 'pic.jpeg',
        username: 'vlad.chat',
        content: "Most people aren't afraid to fail. They're afraid to succeed because that would require them to change. It would require them to become the person who was capable of success. It would require them to let go of the pleasures they are silently addicted to",
        sound: 'speech-0.mp3',
        mode: 'light'
      }}
      calculateMetadata={async ({ props }) => {
        const { slowDurationInSeconds } = await parseMedia({
          src: staticFile(props.sound as string),
          fields: { slowDurationInSeconds: true }
        })

        return {
          durationInFrames: Math.floor(slowDurationInSeconds * 30) + 10
        }
      }}
    />
    <Composition
      id="Tweet"
      component={Tweet}
      durationInFrames={10}
      fps={30}
      width={1284}
      height={2282}
      schema={tweetSchema}
      defaultProps={{
        image: 'pic.jpeg',
        username: 'vlad.chat',
        handle: '@vladchatware',
        content: "i'm pissed man. i might go full innawoods and disconnect. fuck corporations",
        sound: 'speech-0.mp3',
        mode: 'dark'
      }}
      calculateMetadata={async ({ props }) => {
        const { slowDurationInSeconds } = await parseMedia({
          src: staticFile(props.sound as string),
          fields: { slowDurationInSeconds: true }
        })

        return {
          durationInFrames: Math.floor(slowDurationInSeconds * 30) + 10
        }
      }}
    />
    <Composition
      id="Carousel"
      component={Carousel}
      fps={30}
      width={1080}
      height={1920}
      schema={carouselSchema}
      defaultProps={{
        story: require('../stories/143-The Judgment Spiral — Notice the judge, not the judged.json'),
        image: 'judgment.jpeg'
      }}
      calculateMetadata={async ({ props }) => {
        return {
          durationInFrames: props.story.dialog.reduce((acc, line) => acc + 1, 0)
        }
      }}
    />
    <Composition
      id="Story"
      component={Story}
      fps={30}
      width={1080}
      height={1920}
      schema={storyProp}
      defaultProps={{
        story: storyData,
        outroDurationInFrames: 0 // Placeholder, calculated in calculateMetadata
      } satisfies z.infer<typeof storyProp> as unknown as ({ story: StoryMetadata; outroDurationInFrames: number; })}
      calculateMetadata={async ({ props }) => {
        const sounds = await Promise.all(props.story.dialog.map(async (line, i) => {
          const { slowDurationInSeconds } = await parseMedia({
            src: staticFile(`speech-${i}.mp3`),
            fields: { slowDurationInSeconds: true }
          })

          const captionsPath = staticFile(`captions-${i}.json`)
          const captionsRes = await fetch(captionsPath)
          const transcription = await captionsRes.json()
          const { captions } = openAiWhisperApiToCaptions({ transcription })

          return {
            ...line,
            durationInFrames: Math.floor(slowDurationInSeconds * 30),
            sound: `speech-${i}.mp3`,
            captions
          }
        }))

        const { slowDurationInSeconds: outroSlowDurationInSeconds } = await parseMedia(({
          src: staticFile('Outro.mp4'),
          fields: { slowDurationInSeconds: true }
        }))

        const outroDurationInFrames = Math.floor(outroSlowDurationInSeconds * 30)

        const totalDuration = sounds.reduce((acc, sound) => acc + sound.durationInFrames, 0) + outroDurationInFrames

        return {
          props: {
            ...props,
            story: {
              topic: props.story.topic,
              dialog: sounds
            },
            outroDurationInFrames
          },
          durationInFrames: totalDuration
        }
      }}
    />
    <Composition
      id="Outro"
      component={Outro}
      durationInFrames={10}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        video: 'The Power of Compassion.mp4'
      }}
      calculateMetadata={async ({ props }) => {
        const { slowDurationInSeconds } = await parseMedia({
          src: staticFile(props.video),
          fields: { slowDurationInSeconds: true }
        })
        return {
          props,
          durationInFrames: Math.floor(slowDurationInSeconds * 30)
        }
      }}
    />
  </>
