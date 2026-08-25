import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const titleOpacity = interpolate(frame, [10, 18], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const titleScale = spring({
        frame: frame - 10,
        fps,
        config: { damping: 140, stiffness: 120 },
    }) * (1 + bass * 0.2);

    const titleY = interpolate(frame, [10, 26], [90, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const wipe = interpolate(frame, [16, 34], [0, 100], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const jitterX = (random(frame) - 0.5) * (bass * 60);
    const jitterY = (random(frame + 1) - 0.5) * (bass * 60);

    const bgRotate = interpolate(frame, [0, 90], [-10, 2]) + bass * 18;
    const bgScale = interpolate(frame, [0, 90], [1.3, 1]) + volume * 0.45;

    const domainOpacity = interpolate(frame, [32, 46], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const domainLetter = interpolate(frame, [32, 56], [8, 16], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                color: 'white',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${bgRotate}deg) scale(${bgScale})`,
                    fontSize: '620px',
                    fontWeight: 900,
                    color: volume > 0.6 ? `rgba(255,255,255,${volume * 0.12})` : 'rgba(255,255,255,0.02)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    filter: volume > 0.6 ? `blur(${volume * 30}px) brightness(2)` : 'none',
                }}
            >
                MUSIC
            </div>

            <div
                style={{
                    opacity: titleOpacity,
                    transform: `scale(${titleScale}) translateY(${titleY}px) translate(${jitterX}px, ${jitterY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '920px',
                }}
            >
                <h1
                    style={{
                        fontSize: '118px',
                        margin: 0,
                        lineHeight: 0.84,
                        letterSpacing: '-0.06em',
                        textTransform: 'uppercase',
                        textShadow: volume > 0.6 ? `0 0 ${volume * 90}px white` : '0 20px 50px rgba(0,0,0,0.5)',
                        transform: `skewX(${(random(frame + 2) - 0.5) * volume * 55}deg) scale(${1 + volume * 0.08})`,
                        filter: volume > 0.9 ? 'invert(1)' : 'none',
                    }}
                >
                    MUSIC
                </h1>

                <div style={{ position: 'relative', height: '170px', marginTop: '2px', width: '100%' }}>
                    <h1
                        style={{
                            fontSize: '168px',
                            margin: 0,
                            lineHeight: 0.84,
                            letterSpacing: '-0.06em',
                            color: 'transparent',
                            WebkitTextStroke: '3px rgba(255,255,255,0.6)',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                        }}
                    >
                        AGENT
                    </h1>

                    <h1
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            fontSize: '168px',
                            margin: 0,
                            lineHeight: 0.84,
                            letterSpacing: '-0.06em',
                            color: 'white',
                            textTransform: 'uppercase',
                            clipPath: `inset(0 ${100 - wipe}% 0 0)`,
                            textShadow: `0 0 ${20 + volume * 120}px rgba(255, 170, 0, 0.85)`,
                            transform: `skewX(${(random(frame + 4) - 0.5) * volume * 40}deg)`,
                            textAlign: 'center',
                        }}
                    >
                        AGENT
                    </h1>
                </div>

                <div
                    style={{
                        width: interpolate(bass, [0, 1], [260, 1100], { extrapolateRight: 'clamp' }),
                        height: '18px',
                        backgroundColor: volume > 0.8 ? 'white' : '#FFaa00',
                        marginTop: '24px',
                        borderRadius: '2px',
                        boxShadow: `0 0 ${30 + bass * 180}px rgba(255,170,0,${0.7 + bass})`,
                        transform: `scaleY(${1 + bass * 8}) skewX(${jitterX * 0.2}deg)`,
                    }}
                />
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: '100px',
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '34px',
                    fontWeight: 900,
                    letterSpacing: `${domainLetter}px`,
                    textTransform: 'uppercase',
                    opacity: domainOpacity,
                    color: volume > 0.8 ? '#FFaa00' : 'white',
                    transform: `scale(${1 + volume * 0.08})`,
                    whiteSpace: 'nowrap',
                }}
            >
                music.vlad.chat
            </div>
        </AbsoluteFill>
    );
};
