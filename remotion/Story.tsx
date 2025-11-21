import React from "react";
import { Audio, AbsoluteFill, Img, staticFile, Series, OffthreadVideo } from "remotion";
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
    durationInFrames: number,
    sound: string,
    captions: Caption[],
    // Extra fields present in defaultProps
    narration?: string,
    mood?: string,
    seconds?: number
  }[]
}

export const Story = ({ story }: { story: StoryMetadata }) => {
  return (<CameraMotionBlur shutterAngle={280} samples={1}>
    <OffthreadVideo src={staticFile('1939477514.mp4')} volume={0.1} style={{ visibility: 'hidden' }} showInTimeline={false} />
    <Series>
      {story.dialog.map((line, i) =>
        <Series.Sequence key={i} premountFor={30} durationInFrames={line.durationInFrames || 10}>
          <Img src={staticFile(`${story.topic}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
          <AbsoluteFill style={styles.container}>
            <Audio src={staticFile(line.sound)} />
            <Captions
              captions={line.captions}
              captionPosition={`${line.side}-${line.shot}`}
              combineTokensWithinMilliseconds={1200} />
          </AbsoluteFill>
        </Series.Sequence>
      )}
    </Series>
  </CameraMotionBlur>
  );
};
