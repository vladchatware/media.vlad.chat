import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const scale = spring({
        frame,
        fps,
        config: { damping: 200 },
    });

    const moveUp = interpolate(frame, [0, 30], [50, 0], {
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
                    opacity,
                    transform: `scale(${scale}) translateY(${moveUp}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <h1 style={{
                    fontSize: '180px',
                    margin: 0,
                    lineHeight: 0.8,
                    letterSpacing: '-0.06em',
                    textTransform: 'uppercase'
                }}>Music</h1>
                <h1
                    style={{
                        fontSize: '280px',
                        margin: 0,
                        lineHeight: 0.8,
                        marginTop: '-20px',
                        letterSpacing: '-0.08em',
                        color: 'rgba(255,255,255,0.4)',
                    }}
                >
                    AGENT
                </h1>
            </div>
        </AbsoluteFill>
    );
};
