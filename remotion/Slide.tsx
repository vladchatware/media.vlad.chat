import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { loadFont } from '@remotion/google-fonts/NotoSans';
import { Caption } from '@remotion/captions';
import { styles, captionPositionStyle } from './Captions';

const { fontFamily } = loadFont();

export type SlideProps = {
  image: string;
  text: string;
  side: 'left' | 'right';
  shot: 'two-shot' | 'closeup' | 'medium';
};

const slideStyles = {
  text: {
    fontSize: 50,
    fontWeight: 600,
    fontFamily,
    color: 'white',
    textAlign: 'center' as const,
    lineHeight: 1.2,
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(5px)',
    padding: 30,
    borderRadius: 20,
    maxWidth: '80%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  }
};

export const Slide = ({ image, text, side, shot }: SlideProps) => {
  return (
    <CameraMotionBlur shutterAngle={280} samples={1}>
      <Img src={image.startsWith('http') ? image : staticFile(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <AbsoluteFill style={{ ...styles.container, ...captionPositionStyle[`${side}-${shot}`] }}>
        <div style={slideStyles.textContainer}>
          <div style={slideStyles.text}>
            {text}
          </div>
        </div>
      </AbsoluteFill>
    </CameraMotionBlur>
  );
};

