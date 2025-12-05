import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const SummaryText: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = interpolate(frame, [0, 100], [1, 1.2]);
    const opacity = interpolate(frame, [0, 20], [0, 1]);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                padding: '50px'
            }}
        >
            <div
                style={{
                    opacity,
                    transform: `scale(${scale})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 0.75,
                    textTransform: 'uppercase'
                }}
            >
                <h1 style={{ fontSize: '180px', margin: 0, letterSpacing: '-0.06em' }}>CRAFT</h1>
                <h1 style={{ fontSize: '180px', margin: 0, letterSpacing: '-0.06em' }}>THE</h1>
                <h1 style={{ fontSize: '180px', margin: 0, letterSpacing: '-0.06em' }}>STORY</h1>
                <h1 style={{ fontSize: '130px', margin: 0, letterSpacing: '-0.06em', marginTop: '20px', color: 'rgba(255,255,255,0.8)' }}>THROUGH MUSIC</h1>
            </div>

            <AbsoluteFill style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '100px',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', opacity: 1 }}>
                    <div style={{
                        marginRight: '20px',
                        fontSize: '30px',
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        textTransform: 'uppercase'
                    }}>Available now at</div>
                    <div style={{
                        fontSize: '40px',
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        color: '#FFaa00'
                    }}>music.vlad.chat</div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
