import React from 'react'
import { Composition, staticFile } from 'remotion'
import { parseMedia } from '@remotion/media-parser'
import { Story } from './Story'
import { Thread } from './Thread'
import { Tweet } from './Tweet'
import { storySchema, threadSchema, tweetSchema } from './types'
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
      id="Story"
      component={Story}
      fps={30}
      width={1080}
      height={1920}
      schema={storySchema}
      defaultProps={{
        story: {
          topic: "A Moment of Patience - healing the shadow through inner work",
          dialog: [
            {
              text: "Why does healing take so long? I try to be patient but every time I think I'm improving, the old anger and shame come back—what am I doing wrong?",
              instructions: "voice: breathy youth; emotional range: anxious to hopeful; intonation: rising at the end; speed: slightly quick; tone: earnest, vulnerable",
              side: "left",
              voice: "onyx"
            },
            {
              text: "You are not doing anything 'wrong.' Healing is not a race; it's learning to be with what you once fled from. Patience here is a practice, not a timetable.",
              instructions: "warm, low, steady; emotional range: calm, compassionate; intonation: even; speed: slow; tone: reassuring",
              side: "right",
              voice: "ash"
            },
            {
              text: "But my shadow feels huge—like it swallows the progress I make. How do I stop being afraid of it?",
              instructions: "soft, fragile; emotional range: fearful to curious; intonation: pleading; speed: moderate; tone: small and open",
              side: "left",
              voice: "onyx"
            },
            {
              text: "Imagine a garden that floods each spring. If you fight the water with your hands you'll tire quickly. If you plant differently—deeper roots, stones to guide the flow—the same water becomes life. Your shadow is part of the season; learn its language and it will stop wrecking the house.",
              instructions: "metaphoric, steady; emotional range: patient wisdom; intonation: rising then softening; speed: measured; tone: vivid and calm",
              side: "right",
              voice: "ash"
            },
            {
              text: "That sounds poetic, but in a moment of panic I can't remember metaphors. I just react.",
              instructions: "rushed, honest; emotional range: frustrated; intonation: clipped; speed: quick; tone: candid",
              side: "left",
              voice: "onyx"
            },
            {
              text: "Then begin with one small thing: the pause. When a trigger flares, take a single held breath—notice the sensation, name the feeling silently, and say, 'I see you.' Not to fix it, only to welcome it. That tiny pause interrupts the old loop and teaches your nervous system another way.",
              instructions: "gentle, instructional; emotional range: encouraging; intonation: calm crescendos on key phrases; speed: slow; tone: guiding",
              side: "right",
              voice: "ash"
            },
            {
              text: "A single held breath. I can try that. It feels almost too small to matter.",
              instructions: "hesitant then a little lighter; emotional range: doubtful to tentative hope; intonation: falling then hopeful; speed: moderate; tone: soft",
              side: "left",
              voice: "onyx"
            },
            {
              text: "Small is everything. Each patient pause is a stitch—over time they mend the fabric. Your shadow isn't an enemy to defeat; it's a story to listen to. When you listen with steady patience, the story changes.",
              instructions: "warm, resonant; emotional range: confident compassion; intonation: emphatic on 'small' and 'listen'; speed: slow; tone: nurturing",
              side: "right",
              voice: "ash"
            },
            {
              text: "Okay—today I'll try one pause every time I feel the old surge. If nothing else, I'll practice being kind to myself in the in-between.",
              instructions: "quiet resolve; emotional range: resolved, calm; intonation: steady uplift at the end; speed: moderate; tone: sincere",
              side: "left",
              voice: "onyx"
            },
            {
              text: "Good. Start there. Healing keeps company with patience. Each small moment you offer to yourself is the greatest proof of love. Take one minute now—pause, breathe, name one feeling—and come back below to share what you noticed.",
              instructions: "soft command, inviting; emotional range: warm encouragement; intonation: gentle crescendo toward CTA; speed: slow; tone: hopeful, present; whispering at the final phrase for intimacy",
              side: "right",
              voice: "ash"
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

        const totalDuration = sounds.reduce((acc, sound) => acc + sound.durationInFrames, 0)

        return {
          props: {
            ...props,
            story: {
              topic: props.story.topic,
              dialog: sounds
            }
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

