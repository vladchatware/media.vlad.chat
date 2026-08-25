import React, { useEffect, useState } from "react";
import { Audio, AbsoluteFill, Img, Sequence, continueRender, delayRender } from "remotion";
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Caption } from '@remotion/captions';
import { Captions, styles } from './Captions';
import { staticUrl } from './assets';

export type StoryMetadata = {
  topic: string,
  dialog: {
    text: string
    instructions: string
    side: 'left' | 'right',
    shot: 'two-shot' | 'closeup' | 'medium'
    voice: 'onyx' | 'ash',
    durationInFrames?: number,
    sound?: string,
    captionsSrc?: string,
    captions?: Caption[],
    narration?: string,
    mood?: string,
    seconds?: number
  }[]
}

// Whisper verbose_json words are in seconds; Captions expects milliseconds.
const whisperToCaptions = (data: any): Caption[] =>
  (data?.words ?? []).map((w: any) => ({
    text: w.word,
    start: Math.round(w.start * 1000),
    end: Math.round(w.end * 1000),
  }))

const DialogCaptions: React.FC<{
  captionsSrc?: string;
  captions?: Caption[];
  captionPosition: string;
  combineTokensWithinMilliseconds: number;
}> = ({ captionsSrc, captions, ...rest }) => {
  const [resolved, setResolved] = useState<Caption[] | null>(captions ?? null)

  useEffect(() => {
    if (!captionsSrc || captions) return
    let alive = true
    const handle = delayRender(`Fetching captions from ${captionsSrc}`)
    fetch(captionsSrc)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return
        setResolved(whisperToCaptions(data))
        continueRender(handle)
      })
      .catch(() => {
        if (alive) continueRender(handle)
      })
    return () => { alive = false }
  }, [captionsSrc])

  if (!resolved) return null
  return <Captions captions={resolved} {...rest} />
}

export const Story = ({ story, sound = '1939477514.mp4' }: { story: StoryMetadata; sound?: string }) => {
  const sections = story.dialog.map((line, i) => {
    const sound = line.sound ?? `speech-${i}.mp3`
    const captions = line.captions ?? []
    const durationInFrames = line.durationInFrames ?? Math.max(1, Math.floor((line.seconds ?? 8) * 30))
    return { ...line, sound, captions, durationInFrames }
  })

  let cursor = 0
  const timeline = sections.map((line) => {
    const start = cursor
    cursor += line.durationInFrames
    return { ...line, start }
  })

  return (<>
    <Audio src={staticUrl(sound)} volume={0.1} />
    <AbsoluteFill>
      {timeline.map((line, i) => {
        return <Sequence key={i} from={line.start} durationInFrames={line.durationInFrames}>
          <Audio src={staticUrl(line.sound)} volume={1} />
          <CameraMotionBlur shutterAngle={280} samples={1}>
            <Img src={staticUrl('the-need-to-be-right.jpeg')} style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
            <AbsoluteFill style={styles.container}>
              <DialogCaptions
                captionsSrc={line.captionsSrc}
                captions={line.captions}
                captionPosition={`${line.side}-${line.shot}`}
                combineTokensWithinMilliseconds={1200} />
            </AbsoluteFill>
          </CameraMotionBlur>
        </Sequence>
      })}
    </AbsoluteFill>
  </>
  );
};
