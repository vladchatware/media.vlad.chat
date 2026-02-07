import React from "react";
import { Audio, AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CameraMotionBlur } from '@remotion/motion-blur';
import { Caption } from '@remotion/captions';
import { Captions, styles } from './Captions';

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
    captions?: Caption[],
    narration?: string,
    mood?: string,
    seconds?: number
  }[]
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
    <OffthreadVideo
      src={staticFile(sound)}
      volume={0.1}
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
      showInTimeline={false}
    />
    {timeline.map((line, i) => (
      <Sequence key={`audio-${i}`} from={line.start} durationInFrames={line.durationInFrames}>
        <Audio src={staticFile(line.sound)} volume={1} />
      </Sequence>
    ))}
    <CameraMotionBlur shutterAngle={280} samples={1}>
      <AbsoluteFill>
        {timeline.map((line, i) => {
          return <Sequence key={i} from={line.start} durationInFrames={line.durationInFrames}>
            <Img src={staticFile('the-need-to-be-right.jpeg')} style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
            <AbsoluteFill style={styles.container}>
              <Captions
                captions={line.captions}
                captionPosition={`${line.side}-${line.shot}`}
                combineTokensWithinMilliseconds={1200} />
            </AbsoluteFill>
          </Sequence>
        })}
      </AbsoluteFill>
    </CameraMotionBlur>
  </>
  );
};
