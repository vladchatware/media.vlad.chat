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
import { YearInReview } from './YearInReview/Main'

const sampleStory = {
  "topic": "Waiting for the Weekend — An invitation to The Inner Work",
  "image": {
    "medium_format": "Vertical 4K smartphone cinematic (portrait), shallow depth for social-short",
    "subject_action": "A person in a simple apartment by a window, speaking aloud to their own elongated shadow on the wall; later putting phone down, inhaling, watching a patch of sky and a bird, subtly smiling.",
    "environment_time": "Early Monday morning, soft golden-hour window light with long shadows and dust motes.",
    "camera_angle_lens": "Slight low-angle intimate framing, ~50mm equivalence on full-frame, aperture f/1.8 for gentle bokeh",
    "composition_framing": "Vertical rule-of-thirds: subject on the right third, shadow occupying left third; occasional two-shot as shadow and person visually overlap.",
    "color_grading_film_stock": "Warm morning highlights with cool indigo shadows; filmic contrast, gentle grain for tactile warmth.",
    "light_behaivor_atmosphere": "Soft directional window light carving the shadow, subtle rim light on hair, visible dust particles creating quiet atmosphere.",
    "texture_detail": "Visible skin texture, knit sweater threads, steam from a mug, organic details emphasized for intimacy.",
    "mood_emotional_tone": "From restless and yearning to calm, awakened and gently joyful.",
    "style_lineage_reference": "Contemporary mindfulness short fused with Malick-like naturalism and minimalist shadow-play (influence: visual poetry, intimate confessionals).",
    "special_qualities": "Designed for short-form social video: whispery shadow voiceover, vertical intimacy, quick evocative beats that invite immediate inner practice."
  },
  "dialog": [
    {
      "text": "When does life actually start? Is real life only on Friday?",
      "narration": "A young person stands at the window on a gray Monday morning, phone in hand, shoulders tense. Their shadow stretches long across the plaster wall. The city hums faintly beyond the glass.",
      "instructions": "Slightly breathy, anxious curiosity; medium pace; rising intonation toward the end.",
      "side": "left",
      "shot": "medium",
      "mood": "restless, yearning",
      "voice": "onyx",
      "seconds": 8
    },
    {
      "text": "What if life isn't a date on the calendar but the attention you bring to this breath, this step, this sky?",
      "narration": "The shadow on the wall seems to answer before the lips do — a voice that belongs to the same room but knows deeper rhythms. Light slices the silhouette into warm and cool halves.",
      "instructions": "Calm, slow, soft but unwavering; low register; invitational tone.",
      "side": "right",
      "shot": "closeup",
      "mood": "contemplative",
      "voice": "ash",
      "seconds": 12
    },
    {
      "text": "But Mondays are work, chores, a countdown until Friday. How do I make this one sacred?",
      "narration": "The person gestures—half-exasperated, half-hopeful—scrolling through a feed full of weekend photos. The room smells faintly of coffee and detergent.",
      "instructions": "Wistful, quickening; a small laugh under the frustration; real, vulnerable.",
      "side": "left",
      "shot": "medium",
      "mood": "conflicted, honest",
      "voice": "onyx",
      "seconds": 8
    },
    {
      "text": "Start here: set the phone down. Feel one full inhale. Name one thing you see outside the window. Stay with that for one whole breath.",
      "narration": "The shadow points to the phone, then to the chest, then to the window. Outside, a single crow crosses the pale sky, the distant sound of a bus brakes faintly.",
      "instructions": "Low, coaxing whisper; steady cadence; compassionate insistence.",
      "side": "right",
      "shot": "closeup",
      "mood": "soothing, instructive",
      "voice": "ash",
      "seconds": 12
    },
    {
      "text": "I put it down. I breathed. The air is cold on my face; there’s a crow calling — for a moment Monday blinked awake.",
      "narration": "They place the phone face down on the table. A slow inhale, the shoulders soften. A small, surprised smile forms as the ordinary details arrive like guests at a long-forgotten table.",
      "instructions": "Soft surprise then warmth; slowed tempo as realization lands.",
      "side": "left",
      "shot": "medium",
      "mood": "awakened, tender",
      "voice": "onyx",
      "seconds": 12
    },
    {
      "text": "That’s the turn — you stopped waiting for life and started living this moment. Invitation: for two minutes tomorrow morning, name three things you feel with your body. Notice what changes. Do the inner work; ask your shadow to answer.",
      "narration": "The shadow and the person soften toward each other; light edges their faces like a small benediction. The room feels less like a stage and more like a chapel.",
      "instructions": "Encouraging, steady, slightly celebratory; clear call-to-action at the end.",
      "side": "right",
      "shot": "two-shot",
      "mood": "uplifting, hopeful",
      "voice": "ash",
      "seconds": 12
    }
  ]
}

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
      id="Poster"
      component={YearInReview}
      durationInFrames={490}
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
      // schema={carouselSchema}
      defaultProps={{
        story: storyData,
        image: '146.jpeg'
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
        video: 'Outro.mp4'
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
