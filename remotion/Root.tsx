import React from 'react'
import { z } from 'zod/v3'
import { Composition, staticFile } from 'remotion'
import { parseMedia } from '@remotion/media-parser'
import { openAiWhisperApiToCaptions } from '@remotion/openai-whisper'

import { YearInReview } from './YearInReview/Main'
import { Main as MusicMain } from './ProductUpdates/Main'
import { ShopMain } from './YearInReview/ShopMain'

import { Story, StoryMetadata } from './Story'
import { Video } from './Video'
import { Thread } from './Thread'
import { Tweet } from './Tweet'
import { Carousel } from './Carousel'
import { Outro } from './Outro'

import { storyData } from './data'
import { carouselSchema, outroSchema, storyProp, threadSchema, tweetSchema } from './types'

const getMediaDurationInFrames = async (src: string, paddingFrames = 0) => {
  const { slowDurationInSeconds } = await parseMedia({
    src: staticFile(src),
    fields: { slowDurationInSeconds: true },
  })

  return Math.floor(slowDurationInSeconds * 30) + paddingFrames
}

const calculateStoryMetadata = async ({ props }: { props: z.infer<typeof storyProp> }) => {
  const dialog = await Promise.all(
    props.story.dialog.map(async (line, i) => {
      const sound = line.sound ?? `speech-${i}.mp3`

      const { slowDurationInSeconds } = await parseMedia({
        src: staticFile(sound),
        fields: { slowDurationInSeconds: true },
      })

      const captionsPath = staticFile(`captions-${i}.json`)
      const captionsRes = await fetch(captionsPath)
      const transcription = await captionsRes.json()
      const { captions } = openAiWhisperApiToCaptions({ transcription })

      return {
        ...line,
        durationInFrames: Math.floor(slowDurationInSeconds * 30),
        sound,
        captions,
      }
    }),
  )

  const totalDuration = dialog.reduce((acc, line) => acc + line.durationInFrames, 0)

  return {
    props: {
      ...props,
      story: {
        topic: props.story.topic,
        dialog,
      },
    },
    durationInFrames: totalDuration,
  }
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="vlad-chat"
        component={MusicMain}
        durationInFrames={399}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="music-vlad-chat"
        component={YearInReview}
        durationInFrames={490}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="shop-vlad-chat"
        component={ShopMain}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />

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
          content:
            "Most people aren't afraid to fail. They're afraid to succeed because that would require them to change.",
          sound: 'speech-0.mp3',
          mode: 'light',
        }}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: await getMediaDurationInFrames(props.sound as string, 10),
        })}
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
          content: 'short thought',
          sound: 'speech-0.mp3',
          mode: 'dark',
        }}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: await getMediaDurationInFrames(props.sound as string, 10),
        })}
      />

      <Composition
        id="Carousel"
        component={Carousel}
        fps={30}
        width={1080}
        height={1920}
        schema={carouselSchema}
        defaultProps={{
          story: storyData,
          image: '181.jpeg',
        }}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.story.dialog.length,
        })}
      />

      <Composition
        id="Story"
        component={Story}
        fps={30}
        width={1080}
        height={1920}
        schema={storyProp}
        defaultProps={{
          story: {
            topic: storyData.topic,
            dialog: storyData.dialog.map((line, i) => ({
              ...line,
              sound: `speech-${i}.mp3`,
            })),
          },
          sound: '1939477514.mp4',
        } satisfies z.infer<typeof storyProp> as {
          story: StoryMetadata
          sound?: string
        }}
        calculateMetadata={calculateStoryMetadata as any}
      />

      <Composition
        id="Video"
        component={Video}
        fps={30}
        width={1080}
        height={1920}
        schema={storyProp}
        defaultProps={{
          story: {
            topic: storyData.topic,
            dialog: storyData.dialog.map((line, i) => ({
              ...line,
              sound: `speech-${i}.mp3`,
            })),
          },
          sound: '1939477514.mp4',
        } satisfies z.infer<typeof storyProp> as {
          story: StoryMetadata
          sound?: string
        }}
        calculateMetadata={calculateStoryMetadata as any}
      />

      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={10}
        fps={30}
        width={1080}
        height={1920}
        schema={outroSchema}
        defaultProps={{
          video: 'Outro.mp4',
        }}
        calculateMetadata={async ({ props }) => ({
          props,
          durationInFrames: await getMediaDurationInFrames(props.video),
        })}
      />
    </>
  )
}
