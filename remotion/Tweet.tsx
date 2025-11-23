import React, { useEffect } from 'react'
import { Audio, AbsoluteFill, Img, staticFile, Sequence } from "remotion";
import { loadFont } from '@remotion/google-fonts/Roboto';
const { fontFamily } = loadFont(); // "Titan One"
import { CameraMotionBlur } from '@remotion/motion-blur';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 964,
    minHeight: 486,
    paddingBlock: 36,
    paddingInline: 36,
    borderRadius: 45,
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
    marginRight: 24
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
    lineHeight: 1.4,
    fontFamily: 'system-ui',
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  handle: {
    margin: 0,
    padding: 0,
    fontSize: 40,
    lineHeight: 1.1,
    fontWeight: '400',
    fontFamily: 'system-ui',
    letterSpacing: 0.3,
  },
  trailing: {

  },
  main: {
    paddingBlock: 58,
    // paddingBottom: 5,
  },
  footer: {
  }
}

const theme = {
  light: {
    color: 'rgb(14, 18, 23)',
    background: 'rgb(255, 255, 255)',
    fill: 'rgb(33, 33, 33)'
  },
  dark: {
    color: 'rgb(215, 215, 215)',
    background: 'rgba(0, 0, 0, 1)',
    fill: 'rgba(33, 33, 33, 1)'
  }
}

export const Tweet = ({ image, username, content, sound, handle, mode }: { image: string, username: string, content: string, sound: string, handle: string, mode: 'dark' | 'light'}) => {
  const _theme = theme[mode]
  return (<CameraMotionBlur shutterAngle={280} samples={1}>
    <AbsoluteFill>
      <AbsoluteFill style={{ ...styles.container, backgroundColor: _theme.fill }}>
        <div style={{ ...styles.content, backgroundColor: _theme.background }}>
          <div style={styles.innerContaner}>
            <header style={styles.header}>
              <Img src={staticFile(image)} width={105} height={105} style={styles.pic} />
              <div>
                <p style={{ ...styles.headerTitle, color: _theme.color }}>{username}</p>
                <p style={{ ...styles.handle, color: 'rgb(85, 99, 111)' }}>{handle}</p>
              </div>
            </header>
            <main style={styles.main}>
              <p style={{ ...styles.text, color: _theme.color }}>{content}</p>
              {/* <p style={{...styles.mainP, paddingTop: 14}}>Work hard 🫏</p> */}
            </main>
          </div>
        </div>
      </AbsoluteFill>
      {/* <AbsoluteFill> */}
      {/*   <Img src={staticFile('tweet-dark.JPG')} style={{opacity: '0.8'}} /> */}
      {/* </AbsoluteFill> */}
    </AbsoluteFill>
    <Sequence from={10}>
      <Audio src={staticFile(sound)} />
    </Sequence>
  </CameraMotionBlur>
  );
};
