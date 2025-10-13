import { Audio, AbsoluteFill, Img, staticFile, Sequence, Series, useCurrentFrame, OffthreadVideo } from "remotion";
import { loadFont } from '@remotion/google-fonts/NotoSans';
const { fontFamily } = loadFont();
import { CameraMotionBlur } from '@remotion/motion-blur';
import { createTikTokStyleCaptions, Caption } from '@remotion/captions';
import { storySchema } from "./types";
import { z } from "zod";

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  caption: {
    backgroundColor: 'white',
    paddingInline: 24,
    marginBlock: -5,
    borderRadius: 16,
    borderSize: 1,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  captionToken: {
    fontSize: 52,
    fontWeight: 600,
    fontFamily,
  },
  main: {
    flex: 1,
  }
}

const inFrame = (frame, from, to) => {
  const frameFrom = Math.floor(from / (1000 / 30))
  const frameTo = Math.floor(to / (1000 / 30))
  return frameFrom <= frame && frame <= frameTo
}

const captionPositionStyle = {
  'left-closeup': {
    paddingTop: 800
  },
  'left-medium': {
    paddingTop: 100
  },
  'right-closeup': {
    paddingBottom: 1200
  },
  'right-medium': {
    paddingTop: 100
  },
  'left-two-shot': {
    paddingTop: 100
  },
  'right-two-shot': {
    paddingTop: 100
  }
}

const Captions = ({ captions, captionPosition, combineTokensWithinMilliseconds }) => {
  const frame = useCurrentFrame()
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds,
  });

  return <Series>
    {pages.map((caption, j) => {
      const durationInFrames = Math.floor((caption.durationMs / 1000) * 30)
      return <Series.Sequence
        key={j}
        premountFor={1}
        postmountFor={1}
        durationInFrames={durationInFrames || 10}
      >
        <AbsoluteFill style={{ ...captionPositionStyle[captionPosition], ...styles.container }}>
          <div style={styles.caption}>
            {caption.tokens.map((token, i) => {
              const visible = inFrame(frame, token.fromMs, token.toMs)
              const style = visible ? { color: 'red' } : { color: 'black' }

              return <span key={i} style={{ ...style, ...styles.captionToken }}>
                {token.text}
              </span>
            })}
          </div>
        </AbsoluteFill>
      </Series.Sequence>
    }
    )}
  </Series >
}

type StoryMetadata = {
  dialog: {
    text: string
    instructions: string
    side: 'left' | 'right',
    shot: 'two-shot' | 'closeup' | 'medium'
    voice: 'onyx' | 'ash',
    durationInFrames: number,
    sound: string,
    captions: Caption[]
  }[]
}

const shots = {
  'left-closeup': 'shadow-left-closeup.png',
  'left-medium': 'shadow-left-medium.png',
  'two-shot': 'shadow-two-shot.png',
  'right-closeup': 'shadow-right-closeup.png',
  'right-medium': 'shadow-right-medium.png',
  'left-two-shot': 'shadow-two-shot.png',
  'right-two-shot': 'shadow-two-shot.png'
}


export const Story = ({ story, outroDurationInFrames }: { story: StoryMetadata }) => {
  return (<CameraMotionBlur shutterAngle={280} samples={1}>
    <OffthreadVideo src={staticFile('1939477514.mp4')} volume={0.1} style={{ visibility: 'hidden' }} showInTimeline={false} />
    <Series>
      {story.dialog.map((line, i) =>
        <Series.Sequence key={i} premountFor={30} durationInFrames={line.durationInFrames || 10}>
          <Img src={staticFile(shots[`${line.side}-${line.shot}`])} style={styles.img} />
          <AbsoluteFill style={styles.container}>
            <Audio src={staticFile(line.sound)} />
            <Captions
              captions={line.captions}
              captionPosition={`${line.side}-${line.shot}`}
              combineTokensWithinMilliseconds={1200} />
          </AbsoluteFill>
        </Series.Sequence>
      )}
      <Series.Sequence key={story.dialog.length + 1} premountFor={30} durationInFrames={outroDurationInFrames}>
        <OffthreadVideo src={staticFile('Outro.mp4')} />
      </Series.Sequence>
    </Series>
  </CameraMotionBlur>
  );
};

