import React, { useEffect, useState } from "react";
import { Audio, AbsoluteFill, Img, Sequence, cancelRender, continueRender, delayRender } from "remotion";
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Caption } from '@remotion/captions';
import { openAiWhisperApiToCaptions } from '@remotion/openai-whisper';
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

const DialogCaptions: React.FC<{
  captionsSrc?: string;
  captions?: Caption[];
  captionPosition: string;
  combineTokensWithinMilliseconds: number;
}> = ({ captionsSrc, captions, ...rest }) => {
  const [resolved, setResolved] = useState<Caption[] | null>(
    captions?.length ? captions : captionsSrc ? null : [],
  )

  useEffect(() => {
    if (!captionsSrc || captions?.length) return
    let alive = true
    const handle = delayRender(`Fetching captions from ${captionsSrc}`)
    fetch(staticUrl(captionsSrc))
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch captions: ${res.status} ${res.statusText}`)
        return res.json()
      })
      .then((data) => {
        if (!alive) return
        const converted = openAiWhisperApiToCaptions({ transcription: data })
        setResolved(converted.captions)
        continueRender(handle)
      })
      .catch((error) => {
        if (alive) cancelRender(error)
      })
    return () => {
      alive = false
      continueRender(handle)
    }
  }, [captionsSrc, captions])

  if (!resolved) return null
  return <Captions captions={resolved} {...rest} />
}

export const Story = ({ story, sound = '1939477514.mp4' }: { story: StoryMetadata; sound?: string }) => {
  const sections = story.dialog.map((line, i) => {
    const sound = line.sound ?? `speech-${i}.mp3`
    const durationInFrames = line.durationInFrames ?? Math.max(1, Math.floor((line.seconds ?? 8) * 30))
    return { ...line, sound, durationInFrames }
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
