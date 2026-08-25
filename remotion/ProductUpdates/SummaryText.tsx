import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, random } from 'remotion';
import { useAudio } from './AudioProvider';

export const SummaryText: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const scale = interpolate(frame, [0, 100], [1, 1.2]) * (1 + bass * 0.3);
    const opacity = interpolate(frame, [0, 6], [0, 1]);

    const jitterX = (random(frame + 10) - 0.5) * (bass * 80);
    const jitterY = (random(frame + 11) - 0.5) * (bass * 80);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                color: 'black',
                textAlign: 'center',
                padding: '50px'
            }}
        >
            <div
                style={{
                    opacity,
                    transform: `scale(${scale}) translate(${jitterX}px, ${jitterY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 0.75,
                    textTransform: 'uppercase',
                    zIndex: 10
                }}
            >
                <div>
                    <h1 style={{
                        fontSize: '160px',
                        margin: 0,
                        letterSpacing: '-0.08em',
                        fontWeight: 1000,
                        color: 'black',
                        textShadow: volume > 0.6 ? `0 0 ${volume * 100}px rgba(0,0,0,0.3)` : '0 10px 40px rgba(0,0,0,0.1)',
                    }}>READY</h1>
                </div>
                <div>
                    <h1 style={{
                        fontSize: '160px',
                        margin: 0,
                        letterSpacing: '-0.08em',
                        fontWeight: 1000,
                        color: 'black',
                        textShadow: volume > 0.6 ? `0 0 ${volume * 100}px rgba(0,0,0,0.3)` : '0 10px 40px rgba(0,0,0,0.1)',
                    }}>TO LAUNCH</h1>
                </div>
                <div>
                    <h1 style={{
                        fontSize: '200px',
                        margin: 0,
                        letterSpacing: '-0.08em',
                        fontWeight: 1000,
                        WebkitTextStroke: '6px black',
                        WebkitTextFillColor: 'transparent',
                    }}>YOURS?</h1>
                </div>
            </div>

            <AbsoluteFill style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '100px',
                pointerEvents: 'none'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 1,
                    flexDirection: 'column',
                    zIndex: 10,
                    filter: volume > 0.85 ? 'invert(1)' : 'none',
                }}>
                    <h1 style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '130px',
                        fontWeight: 1000,
                        margin: 0,
                        textAlign: 'left',
                        lineHeight: 0.85,
                        letterSpacing: '-0.07em',
                        textTransform: 'uppercase',
                        color: 'black',
                        textShadow: volume > 0.6 ? `0 0 ${volume * 100}px rgba(0,0,0,0.2)` : 'none',
                    }}>
                        VLAD.CHAT
                    </h1>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
