import React from 'react'
import { Composition, staticFile } from 'remotion'
import { parseMedia } from '@remotion/media-parser'
import { Story } from './Story'
import { Thread } from './Thread'
import { Tweet } from './Tweet'
import { storyProp, storySchema, threadSchema, tweetSchema } from './types'
import { openAiWhisperApiToCaptions } from '@remotion/openai-whisper'
import { Main } from './Main'
import { Outro } from './Outro'

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
      id="Story"
      component={Story}
      fps={30}
      width={1080}
      height={1920}
      schema={storyProp}
      defaultProps={{
        story: {
          "topic": "The Power Within",
          "dialog": [
            {
              "text": "Shadow... why do you feel like a storm inside me?",
              "instructions": "Accent: neutral. Emotional range: vulnerable, small. Intonation: rising at end, breathy. Speed: slow, hesitant. Tone: childlike curiosity and worry.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Because I've been carrying every 'no' and every scar you tried to tuck away.",
              "instructions": "Accent: neutral. Emotional range: gentle, wise. Intonation: even, reassuring. Speed: measured. Tone: warm, steady like an old friend.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "But you scare me. I push you away and pretend you're not there.",
              "instructions": "Accent: neutral. Emotional range: anxious, ashamed. Intonation: quickened, trailing off. Speed: slightly hurried. Tone: small, confessing.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Pushing only tightens the wound. Hiding made you safe from others, but it kept you small from yourself.",
              "instructions": "Accent: neutral. Emotional range: compassionate, firm. Intonation: calming, deliberate. Speed: steady. Tone: gentle teacher, non-blaming.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "How do I meet you without drowning in everything you've got?",
              "instructions": "Accent: neutral. Emotional range: fearful but curious. Intonation: rising-question. Speed: cautious. Tone: young, searching for a map.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Breathe. Witness me like you would a bruise — notice the color, the hurt, without flinching. Ask what it needs, then listen.",
              "instructions": "Accent: neutral. Emotional range: calm, instructive. Intonation: slow, rhythmic. Speed: deliberate. Tone: grounding, very gentle.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "I keep feeling shame. I thought hiding would keep me safe from being broken.",
              "instructions": "Accent: neutral. Emotional range: tender, ashamed. Intonation: soft, confessional. Speed: slow. Tone: honest and small.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Shame thrives in secrecy. Light dissolves it. Naming it — out loud, inside you — takes its power away.",
              "instructions": "Accent: neutral. Emotional range: encouraging, poetic. Intonation: warm, metaphorical. Speed: steady. Tone: hopeful and evocative.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "If I feel it fully, won't it take over? Won't I become the hurt?",
              "instructions": "Accent: neutral. Emotional range: worried, doubtful. Intonation: pleading. Speed: moderate. Tone: vulnerable, young.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Feeling isn't being swallowed — it's clearing the room. Stay with the sensation, name it, then choose how you reply. That choice is your freedom.",
              "instructions": "Accent: neutral. Emotional range: firm, empowering. Intonation: rising then steady. Speed: measured. Tone: resolute yet compassionate.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "Okay... I forgive myself for hiding. I forgive myself for thinking I needed to be perfect.",
              "instructions": "Accent: neutral. Emotional range: soft relief, sincere. Intonation: calm, affirming. Speed: slow. Tone: healing, quieter strength.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "And I forgive you for fearing me. We are parts of one heart — when you welcome me, you reclaim the energy wasted on pretending.",
              "instructions": "Accent: neutral. Emotional range: tender, relieved. Intonation: warm, embracing. Speed: gentle. Tone: comforting, like a hand on the shoulder.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "It's like the storm turned into a window. I can see the sky now.",
              "instructions": "Accent: neutral. Emotional range: surprised delight. Intonation: light, rising. Speed: brighter, quicker. Tone: amazed and hopeful.",
              "side": "left",
              "voice": "onyx"
            },
            {
              "text": "Remember: the greatest journey is inward. The power you look for outside already lives inside you — waiting for your courage to stop running and start listening.",
              "instructions": "Accent: neutral. Emotional range: inspiring, calm. Intonation: steady crescendo. Speed: measured, deliberate. Tone: deep, resonant, encouraging.",
              "side": "right",
              "voice": "ash"
            },
            {
              "text": "Take a breath. Who is the shadow you can invite in today? Share one small step you'll take to meet them in the comments — or pause and reflect for a moment.",
              "instructions": "Accent: neutral. Emotional range: inviting, gentle. Intonation: soft call to action. Speed: calm, concise. Tone: warm invitation to reflect and engage.",
              "side": "right",
              "voice": "ash"
            }
          ]
        }
      }}
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
  </>

