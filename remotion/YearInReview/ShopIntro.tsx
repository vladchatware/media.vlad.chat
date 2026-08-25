
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

export const ShopIntro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const scale = spring({
        frame,
        fps,
        config: { damping: 200 },
    }) * (1 + bass * 0.25);

    const moveUp = interpolate(frame, [0, 30], [50, 0], {
        extrapolateRight: 'clamp',
    });

    const jitterX = (random(frame) - 0.5) * (bass * 60);
    const jitterY = (random(frame + 1) - 0.5) * (bass * 60);

    // Background text movement
    const bgRotate = interpolate(frame, [0, 100], [-5, 0]) + (bass * 15);
    const bgScale = interpolate(frame, [0, 100], [1, 1.1]) + (volume * 0.5);
    const accent = '#FF90E8';

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
            {/* Massive Invasive Background Texture */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${bgRotate}deg) scale(${bgScale})`,
                fontSize: '600px',
                fontWeight: 900,
                color: volume > 0.6 ? `rgba(255,255,255,${volume * 0.1})` : 'rgba(255,255,255,0.02)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                filter: volume > 0.6 ? `blur(${volume * 30}px) brightness(2)` : 'none'
            }}>
                SHOP
            </div>

            <div
                style={{
                    opacity,
                    transform: `scale(${scale}) translateY(${moveUp}px) translate(${jitterX}px, ${jitterY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '920px',
                }}
            >
                <h1 style={{
                    fontSize: '118px',
                    margin: 0,
                    lineHeight: 0.84,
                    letterSpacing: '-0.06em',
                    textTransform: 'uppercase',
                    textShadow: volume > 0.6
                        ? `0 0 ${volume * 100}px white`
                        : '0 20px 50px rgba(0,0,0,0.5)',
                    transform: `skewX(${(random(frame) - 0.5) * volume * 60}deg) scale(${1 + volume * 0.1})`,
                    filter: volume > 0.85 ? 'invert(1)' : 'none'
                }}>2025</h1>
                <h1
                    style={{
                        fontSize: '168px',
                        margin: 0,
                        lineHeight: 0.84,
                        marginTop: '2px',
                        letterSpacing: '-0.06em',
                        color: volume > 0.9 ? 'white' : 'transparent',
                        WebkitTextStroke: volume > 0.7
                            ? `${4 + volume * 12}px rgba(255,255,255,1)`
                            : '3px rgba(255,255,255,0.6)',
                        textShadow: volume > 0.7
                            ? `0 0 ${volume * 100}px rgba(255, 144, 232, 0.85)`
                            : '0 0 20px rgba(255,255,255,0.2)',
                        transform: `skewX(${(random(frame + 2) - 0.5) * volume * 40}deg) scale(${1 + bass * 0.2})`,
                        textAlign: 'center',
                    }}
                >
                    WRAPPED
                </h1>

                {/* Blinding Invasive Decorative Line */}
                <div style={{
                    width: interpolate(bass, [0, 1], [300, 1200], { extrapolateRight: 'clamp' }),
                    height: '20px',
                    backgroundColor: volume > 0.8 ? '#ffe5f8' : accent,
                    marginTop: '40px',
                    borderRadius: '2px',
                    boxShadow: `0 0 ${40 + bass * 200}px rgba(255,144,232,${0.75 + bass})`,
                    transform: `scaleY(${1 + bass * 10}) skewX(${jitterX}deg)`
                }} />
            </div>

            <div style={{
                position: 'absolute',
                bottom: '100px',
                width: '100%',
                textAlign: 'center',
                fontSize: '34px',
                fontWeight: 900,
                letterSpacing: interpolate(volume, [0, 1], [8, 16]) + 'px',
                textTransform: 'uppercase',
                opacity: 0.5 + volume * 0.5,
                color: volume > 0.8 ? '#ffe5f8' : accent,
                transform: `scale(${1 + volume * 0.08})`,
                whiteSpace: 'nowrap',
            }}>
                shop.vlad.chat
            </div>
        </AbsoluteFill>
    );
};
