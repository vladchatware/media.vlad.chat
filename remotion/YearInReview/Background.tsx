import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export const Background: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Create a noise overlay using SVG filter
    const noiseFilter = useMemo(() => (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="noiseFilter">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.8"
                    numOctaves="3"
                    stitchTiles="stitch"
                />
            </filter>
        </svg>
    ), []);

    // Animate gradient positions
    const t = frame / fps;

    // Rotating blobs
    const blob1X = 50 + 30 * Math.sin(t * 0.5);
    const blob1Y = 50 + 20 * Math.cos(t * 0.3);

    const blob2X = 20 + 30 * Math.cos(t * 0.4);
    const blob2Y = 80 + 20 * Math.sin(t * 0.6);

    const blob3X = 80 + 20 * Math.sin(t * 0.7);
    const blob3Y = 30 + 30 * Math.cos(t * 0.5);

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
            {noiseFilter}

            {/* Background Blobs */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    filter: 'blur(80px)',
                    transform: 'scale(1.5)',
                }}
            >
                {/* Red Blob */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${blob1X}%`,
                        top: `${blob1Y}%`,
                        width: '60%',
                        height: '60%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(255,50,0,1) 0%, rgba(255,0,0,0) 70%)',
                    }}
                />

                {/* Orange/Yellow Blob */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${blob2X}%`,
                        top: `${blob2Y}%`,
                        width: '70%',
                        height: '70%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(255,180,0,1) 0%, rgba(255,100,0,0) 70%)',
                    }}
                />

                {/* Deep Red/Dark Blob */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${blob3X}%`,
                        top: `${blob3Y}%`,
                        width: '80%',
                        height: '80%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(150,0,0,1) 0%, rgba(50,0,0,0) 70%)',
                    }}
                />
            </div>

            {/* Noise Overlay */}
            <AbsoluteFill
                style={{
                    opacity: 0.15,
                    filter: 'url(#noiseFilter)',
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none',
                }}
            />
        </AbsoluteFill>
    );
};
