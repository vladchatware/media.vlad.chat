import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

export const SummaryText: React.FC = () => {
    const frame = useCurrentFrame();
    const { volume, bass } = useAudio();

    const introOpacity = interpolate(frame, [0, 14], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const lockupScale = interpolate(frame, [0, 120], [0.92, 1.14]) * (1 + bass * 0.24);

    const lockupY = interpolate(frame, [0, 40], [80, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const wipe = interpolate(frame, [16, 54], [0, 100], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const jitterX = (random(frame + 9) - 0.5) * (18 + bass * 70);
    const jitterY = (random(frame + 10) - 0.5) * (18 + bass * 70);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                padding: '50px',
            }}
        >
            <div
                style={{
                    opacity: introOpacity,
                    transform: `translate(${jitterX}px, ${jitterY}px) translateY(${lockupY}px) scale(${lockupScale})`,
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '980px',
                }}
            >
                <div style={{ position: 'relative', height: '170px' }}>
                    <h1 style={{
                        fontSize: '130px',
                        margin: 0,
                        lineHeight: 0.86,
                        letterSpacing: '-0.06em',
                        textTransform: 'uppercase',
                        color: 'transparent',
                        WebkitTextStroke: '3px rgba(255,255,255,0.7)',
                    }}>CRAft the story</h1>
                    <h1 style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        fontSize: '130px',
                        margin: 0,
                        lineHeight: 0.86,
                        letterSpacing: '-0.06em',
                        textTransform: 'uppercase',
                        color: 'white',
                        clipPath: `inset(0 ${100 - wipe}% 0 0)`,
                        textShadow: `0 0 ${30 + volume * 120}px rgba(255,170,0,0.85)`,
                        transform: `skewX(${(random(frame + 12) - 0.5) * volume * 35}deg)`,
                    }}>CRAft the story</h1>
                </div>

                <div style={{
                    fontSize: '140px',
                    lineHeight: 0.8,
                    letterSpacing: '-0.07em',
                    textTransform: 'uppercase',
                    color: volume > 0.78 ? '#ffb300' : 'white',
                    textShadow: `0 0 ${22 + bass * 120}px rgba(255,170,0,0.75)`,
                    transform: `scale(${1 + bass * 0.16}) skewX(${(random(frame + 14) - 0.5) * 18 * volume}deg)`,
                }}>
                    through music
                </div>

                <div style={{
                    marginTop: '36px',
                    height: '16px',
                    width: `${interpolate(bass, [0, 1], [300, 920], { extrapolateRight: 'clamp' })}px`,
                    background: volume > 0.8 ? 'white' : '#FFaa00',
                    boxShadow: `0 0 ${25 + bass * 150}px rgba(255,170,0,0.8)`,
                    marginInline: 'auto',
                    transform: `scaleY(${1 + bass * 6})`,
                }} />
            </div>

            <AbsoluteFill
                style={{
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    paddingBottom: '92px',
                    pointerEvents: 'none',
                }}
            >
                <div style={{
                    fontSize: '34px',
                    fontWeight: 900,
                    color: '#FFaa00',
                    textTransform: 'uppercase',
                    letterSpacing: `${interpolate(frame, [0, 80], [8, 16], { extrapolateRight: 'clamp' })}px`,
                    transform: `scale(${1 + volume * 0.08})`,
                    textShadow: '0 0 20px rgba(255,170,0,0.7)',
                    whiteSpace: 'nowrap',
                }}>
                    music.vlad.chat
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
