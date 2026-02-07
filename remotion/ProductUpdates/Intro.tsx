
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, random } from 'remotion';
import { AudioProvider, useAudio } from './AudioProvider';

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const opacity = interpolate(frame, [0, 6], [0, 1]);
    const scale = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.8 },
    }) * (1 + bass * 0.25);

    const moveUp = interpolate(frame, [0, 10], [30, 0], {
        extrapolateRight: 'clamp',
    });

    const jitterX = (random(frame) - 0.5) * (bass * 60);
    const jitterY = (random(frame + 1) - 0.5) * (bass * 60);

    // Background text movement
    const bgRotate = interpolate(frame, [0, 100], [-5, 0]) + (bass * 15);
    const bgScale = interpolate(frame, [0, 100], [1, 1.1]) + (volume * 0.5);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                color: 'black',
            }}
        >
            {/* Massive Invasive Background Texture */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${bgRotate}deg) scale(${bgScale})`,
                fontSize: '600px',
                fontWeight: 1000,
                color: 'rgba(0,0,0,0.02)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
            }}>
                NEW
            </div>

            <div
                style={{
                    opacity,
                    transform: `scale(${scale}) translateY(${moveUp}px) translate(${jitterX}px, ${jitterY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}
            >
                <div style={{
                    transform: `skewX(${(random(frame) - 0.5) * volume * 20}deg) scale(${1 + volume * 0.05})`,
                    filter: volume > 0.85 ? 'invert(1)' : 'none',
                    opacity: volume > 0.8 ? (random(frame) > 0.5 ? 1 : 0.8) : 1,
                }}>
                    <h1 style={{
                        fontSize: '180px',
                        margin: 0,
                        lineHeight: 0.8,
                        letterSpacing: '-0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 1000,
                        color: 'black',
                        textShadow: volume > 0.6
                            ? `0 0 ${volume * 100}px rgba(0,0,0,0.4)`
                            : '0 20px 50px rgba(0,0,0,0.1)',
                    }}>PRODUCT</h1>
                </div>

                <div style={{
                    transform: `skewX(${(random(frame + 1) - 0.5) * volume * 15}deg) scale(${1 + bass * 0.1})`,
                    opacity: volume > 0.9 ? (random(frame + 4) > 0.5 ? 1 : 0.4) : 1,
                }}>
                    <h1
                        style={{
                            fontSize: '240px',
                            margin: 0,
                            lineHeight: 0.7,
                            marginTop: '-10px',
                            letterSpacing: '-0.08em',
                            WebkitTextStroke: volume > 0.4
                                ? `${8 + volume * 20}px black`
                                : '4px black',
                            WebkitTextFillColor: 'transparent',
                            textShadow: volume > 0.7
                                ? `0 0 ${volume * 130}px white`
                                : 'none',
                        }}
                    >
                        UPDATES
                    </h1>
                </div>

                {/* Blinding Invasive Decorative Line */}
                <div style={{
                    width: interpolate(bass, [0, 1], [300, 1200], { extrapolateRight: 'clamp' }),
                    height: '20px',
                    backgroundColor: 'black',
                    marginTop: '40px',
                    borderRadius: '2px',
                    boxShadow: `0 0 ${40 + bass * 200}px rgba(0,0,0,0.2)`,
                    transform: `scaleY(${1 + bass * 10}) skewX(${jitterX}deg)`
                }} />
            </div>

            <div style={{
                position: 'absolute',
                bottom: '100px',
                width: '100%',
                textAlign: 'center',
                fontSize: '40px',
                fontWeight: 900,
                letterSpacing: interpolate(volume, [0, 1], [10, 80]) + 'px',
                textTransform: 'uppercase',
                opacity: 0.5 + volume * 0.5,
                color: 'black',
                transform: `scale(${1 + volume * 0.4})`
            }}>
                vlad.chat
            </div>
        </AbsoluteFill>
    );
};
