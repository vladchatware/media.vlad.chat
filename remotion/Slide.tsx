import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { styles, captionPositionStyle } from './Captions';

const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Roboto, Arial, sans-serif';

export type SlideProps = {
  image: string;
  text: string;
  side: 'left' | 'right';
  shot: 'two-shot' | 'closeup' | 'medium';
};

const slideStyles = {
  text: {
    fontSize: 54,
    fontWeight: 800,
    fontFamily,
    textAlign: 'center' as const,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
  },
  textContainer: {
    maxWidth: '85%',
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center' as const,
    position: 'relative' as const,
    filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.25))',
    zIndex: 10,
  },
  span: {
    padding: '14px 34px',
    borderRadius: '12px',
    boxDecorationBreak: 'clone' as const,
    WebkitBoxDecorationBreak: 'clone' as const,
    display: 'inline',
  }
};

export const Slide = ({ image, text, side, shot }: SlideProps) => {
  return (
    <CameraMotionBlur shutterAngle={280} samples={1}>
      <Img src={image.startsWith('http') ? image : staticFile(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* SVG Filter for "Gooey" effect that creates the inner rounded corners */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 45 -15" result="goo" />
        </filter>
      </svg>

      <AbsoluteFill style={{ ...styles.container, ...captionPositionStyle[`${side}-${shot}`] }}>
        <div style={slideStyles.textContainer}>
          {/* Background Layer with Gooey Filter */}
          <div style={{
            ...slideStyles.text,
            filter: 'url(#gooey)',
            position: 'absolute',
            zIndex: 0,
            width: '100%',
          }}>
            <span style={{ ...slideStyles.span, backgroundColor: 'white', color: 'transparent' }}>
              {text}
            </span>
          </div>

          {/* Sharp Text Layer on Top */}
          <div style={{
            ...slideStyles.text,
            position: 'relative',
            zIndex: 1,
            width: '100%'
          }}>
            <span style={{ ...slideStyles.span, backgroundColor: 'transparent', color: 'black' }}>
              {text}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </CameraMotionBlur>
  );
};
