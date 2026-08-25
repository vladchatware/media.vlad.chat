import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { features } from './data';

const ListItem: React.FC<{ item: typeof features[0]; index: number; showCover: boolean }> = ({ item, index, showCover }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Animate in
    const delay = index * 8;
    const progress = spring({
        frame: frame - delay,
        fps,
        config: { damping: 100 },
    });

    const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
    const translateX = interpolate(progress, [0, 1], [-100, 0]);

    if (frame < delay) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // Center content
                marginBottom: '40px', // increased spacing
                opacity,
                transform: `translateX(${translateX}px)`,
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                <div style={{
                    fontSize: '60px', // Increased font size
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.9,
                    textTransform: 'uppercase',
                    textAlign: 'left' // Keep text left aligned relative to itself, but centered in container
                }}>{item.title}</div>
                <div style={{
                    fontSize: '32px', // Increased font size
                    opacity: 0.8,
                    fontWeight: 600,
                    marginTop: '5px',
                    letterSpacing: '-0.02em',
                    textAlign: 'left'
                }}>{item.subtext}</div>
            </div>
        </div>
    );
};

export const TopList: React.FC = () => {
    return (
        <AbsoluteFill style={{ padding: '80px', paddingTop: '200px' }}>
            <h1 style={{
                fontFamily: 'Inter, sans-serif',
                color: 'white',
                fontSize: '100px',
                fontWeight: 900,
                marginBottom: '60px',
                marginTop: '100px',
                textAlign: 'left',
                width: '100%',
                lineHeight: 0.85,
                letterSpacing: '-0.06em',
                textTransform: 'uppercase',
            }}>
                What's<br />New
            </h1>
            <div style={{ marginTop: '20px', width: '100%' }}>
                {features.map((item, i) => (
                    <ListItem key={i} item={item} index={i} showCover={false} />
                ))}
            </div>
        </AbsoluteFill>
    );
};
