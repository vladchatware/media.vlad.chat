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
          "topic": "Mindless Chatter",
          "dialog": [
            {
              "text": "Why won't my mind ever quiet down? I'm exhausted by the constant noise—what if this is all I'll ever be?",
              "narration": "A young person sits on the edge of a rooftop at dusk, legs dangling. City lights shimmer below like a distant galaxy. Their jacket is ordinary, hair tousled from wind. A long shadow stretches from their shoulder across the concrete and up the brick wall—taller, steadier, almost alive. The air smells of rain and possibility.",
              "instructions": "Breathy, vulnerable, quick inhale before lines, rising intonation at the end; honest, a touch of fear.",
              "side": "left",
              "shot": "medium",
              "mood": "questioning",
              "voice": "onyx",
              "seconds": 4
            },
            {
              "text": "Because you keep treating the noise like it defines you. The chatter learned to protect you; it learned how to get attention. This is the invitation to the Inner Work: stop feeding the story and listen for what the story is hiding.",
              "narration": "The shadow's voice seems to come from the wall itself. Up close you notice its edges ripple like smoke; it wears no clothes but carries an ancient calm. The skyline frames the shadow as if it's an elder at a campfire telling a truth. Night air is still, the city's hum receding.",
              "instructions": "Low, steady, compassionate; slow cadence with gentle emphasis on 'invitation' and 'listen'; confident and loving.",
              "side": "right",
              "shot": "closeup",
              "mood": "wise",
              "voice": "ash",
              "seconds": 8
            },
            {
              "text": "But how do I stop believing it? The mind says, 'You're not enough,' 'You need more,' 'What if it all falls apart.' I don't know which part of me to trust.",
              "narration": "The person presses their palms to their temples as the words tumble out. The shadow remains still, an unblinking presence on the brick. The wind tugs a loose thread from the person's sleeve; small details feel huge in the quiet. Vulnerability is raw but honest.",
              "instructions": "Urgent, a little shaky, quickening pace when listing the thoughts; ends with a softer, questioning tone.",
              "side": "left",
              "shot": "medium",
              "mood": "conflicted",
              "voice": "onyx",
              "seconds": 12
            },
            {
              "text": "Those phrases are themes of consciousness—wounds trying to keep you safe by repeating themselves. First, name them. Then feel them without fighting. Witness the pattern: wounding, seeking, reacting. When you stop identifying with the chatter, it loses its power. Tear off the veils and open the mystery of yourself; the hero's journey is inside you.",
              "narration": "The shadow leans forward slightly, voice like warm stone. As it speaks, faint images flicker across the wall—childhood echoes, a closed door, a horizon—then dissolve. The city breathes with them. It's as if the rooftop becomes a small theater for inner truth. The sky is a deep indigo, stars pricking awake.",
              "instructions": "Reassuring, deliberate, slightly resonant; pause after 'name them' and 'witness the pattern' to let each idea land. Soft crescendo on 'hero's journey'.",
              "side": "right",
              "shot": "closeup",
              "mood": "soothing",
              "voice": "ash",
              "seconds": 12
            },
            {
              "text": "Start with one minute: breathe, notice one recurring thought, and ask, 'Is this true right now?' If it isn't, breathe it out. Do this daily. Reflect: where is your mindless chatter keeping you from love, peace, or joy? Your Inner Work begins when you choose to look. Will you begin today?",
              "narration": "The camera pulls back into a two-shot: the person and their shadow on the wall together, framed by city lights and an open sky. The atmosphere is quiet but charged with possibility. The person's shoulders drop a fraction; a small, hopeful smile appears. The shadow's form is less sharp now—softer, as if relaxed.",
              "instructions": "Warm, invitational, gentle encouragement; slower pace for the practical steps, then a clear, slightly rising tone on the closing question to invite action.",
              "side": "right",
              "shot": "two-shot",
              "mood": "inspirational",
              "voice": "ash",
              "seconds": 8
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

