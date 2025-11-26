import React from 'react'
import { Audio, AbsoluteFill, Img, staticFile, Sequence } from "remotion";
import { loadFont } from '@remotion/google-fonts/Roboto';
const { fontFamily } = loadFont(); // "Titan One"
import { CameraMotionBlur } from '@remotion/motion-blur';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 1050,
    minHeight: 530,
    paddingBlock: 36,
    paddingInline: 28,
    borderRadius: 30,
    boxShadow: '1px 1px 60px 5px rgba(0, 0, 0, 0.25)'
  },
  innerContaner: {
    // paddingTop: 27,
    // paddingBottom: 27
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(255, 0, 0, 0.1)'
  },
  pic: {
    borderRadius: 60,
    marginRight: 30
  },
  headerTitle: {
    margin: 0,
    padding: 0,
    fontSize: 40,
    lineHeight: 1.1,
    fontWeight: '600',
    fontFamily: 'system-ui',
    letterSpacing: 0.3,
  },
  text: {
    margin: 0,
    padding: 0,
    fontSize: 40,
    lineHeight: 1.28,
    fontFamily: 'system-ui',
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  trailing: {

  },
  main: {
    paddingBlock: 36,
    // paddingBottom: 5,
  },
  footer: {
  }
}

const theme = {
  light: {
    color: 'rgb(40, 40, 40)',
    background: 'rgb(255, 255, 255)',
    fill: 'rgb(241, 241, 241)'
  },
  dark: {
    color: 'rgb(250, 250, 250)',
    background: 'rgba(30, 30, 30, 1)',
    fill: 'rgba(26, 26, 26, 1)'
  }
}

export const Thread = ({ image, username, content, sound, mode }: { image: string, username: string, content: string, sound: string, mode: 'dark' | 'light' }) => {
  const _theme = theme[mode]
  return (<CameraMotionBlur shutterAngle={280} samples={1}>
    <AbsoluteFill>
      {/* <AbsoluteFill> */}
      {/*   <Img src={staticFile('threads-dark.JPG')} style={{}} /> */}
      {/* </AbsoluteFill> */}
      <AbsoluteFill style={{ ...styles.container, backgroundColor: _theme.fill }}>
        <div style={{ ...styles.content, backgroundColor: _theme.background }}>
          <div style={styles.innerContaner}>
            <header style={styles.header}>
              <Img src={staticFile(image)} width={88} height={88} style={styles.pic} />
              <p style={{ ...styles.headerTitle, color: _theme.color }}>{username}</p>
            </header>
            <main style={styles.main}>
              <p style={{...styles.text, color: _theme.color}}>{content}</p>
              {/* <p style={{...styles.mainP, paddingTop: 14}}>Work hard 🫏</p> */}
            </main>
          </div>
        </div>
      </AbsoluteFill>
      {/* <AbsoluteFill> */}
      {/*   <Img src={staticFile('threads-dark.JPG')} style={{}} /> */}
      {/* </AbsoluteFill> */}
    </AbsoluteFill>
    <Sequence from={10}>
      <Audio src={staticFile(sound)} />
    </Sequence>
  </CameraMotionBlur>
  );
};
