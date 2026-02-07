import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';
import { useAudio } from './AudioProvider';

const GRID_COLS = 12;
const GRID_ROWS = 20;

export const SereneBackground: React.FC = () => {
    const frame = useCurrentFrame();
    const { volume, bass } = useAudio();
    const { width, height, fps } = useVideoConfig();
    const t = frame / fps;

    // Generative Deconstructed Grid Logic
    const lines = React.useMemo(() => {
        const tempLines = [];
        // Vertical Broken Lines
        for (let i = 0; i <= GRID_COLS; i++) {
            const x = (i / GRID_COLS) * 100;
            const segments = 4;
            for (let s = 0; s < segments; s++) {
                const seed = i * 100 + s;
                const startY = (s / segments) * 100;
                const endY = ((s + 1) / segments) * 100;
                tempLines.push({
                    type: 'v',
                    x: `${x}%`,
                    top: `${startY}%`,
                    height: `${endY - startY}%`,
                    opacity: random(seed) * 0.3,
                    seed
                });
            }
        }
        // Horizontal Broken Lines
        for (let i = 0; i <= GRID_ROWS; i++) {
            const y = (i / GRID_ROWS) * 100;
            const segments = 3;
            for (let s = 0; s < segments; s++) {
                const seed = i * 200 + s + 5000;
                const startX = (s / segments) * 100;
                const endX = ((s + 1) / segments) * 100;
                tempLines.push({
                    type: 'h',
                    y: `${y}%`,
                    left: `${startX}%`,
                    width: `${endX - startX}%`,
                    opacity: random(seed) * 0.3,
                    seed
                });
            }
        }
        return tempLines;
    }, []);

    return (
        <AbsoluteFill style={{ backgroundColor: '#dcdcdc', overflow: 'hidden' }}>
            {/* Deconstructed Generative Grid */}
            <AbsoluteFill style={{ opacity: 0.6 }}>
                {lines.map((line, idx) => {
                    const isGlitch = random(line.seed + Math.floor(frame / 2)) > 0.8;
                    const audioBoost = isGlitch ? bass * 40 : 0;
                    const glitchOpacity = isGlitch ? volume : line.opacity;
                    const jitter = (random(line.seed + frame) - 0.5) * (bass * 20);

                    return (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                backgroundColor: 'black',
                                opacity: glitchOpacity * (0.5 + bass * 0.5),
                                ...(line.type === 'v' ? {
                                    left: line.x,
                                    top: line.top,
                                    width: '1px',
                                    height: line.height,
                                    transform: `translateX(${jitter + audioBoost}px)`,
                                } : {
                                    top: line.y,
                                    left: line.left,
                                    height: '1px',
                                    width: line.width,
                                    transform: `translateY(${jitter + audioBoost}px)`,
                                }),
                                transition: 'opacity 0.1s ease-out',
                            }}
                        />
                    );
                })}
            </AbsoluteFill>

            {/* Fluid Organic Blobs (Lava Lamp) - Purely time-based for natural flow */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', filter: 'blur(120px)' }}>
                {/* Blob 1 */}
                <div style={{
                    position: 'absolute',
                    width: '1000px',
                    height: '1000px',
                    borderRadius: '50%',
                    backgroundColor: 'black',
                    left: `${20 + Math.sin(t * 0.3) * 15}%`,
                    top: `${15 + Math.cos(t * 0.4) * 10}%`,
                    transform: 'scale(1.4)',
                    opacity: 0.3
                }} />
                {/* Blob 2 */}
                <div style={{
                    position: 'absolute',
                    width: '1400px',
                    height: '1400px',
                    borderRadius: '50%',
                    backgroundColor: 'black',
                    right: `${-10 + Math.cos(t * 0.25) * 10}%`,
                    bottom: `${10 + Math.sin(t * 0.35) * 15}%`,
                    transform: 'scale(1.1)',
                    opacity: 0.2
                }} />
                {/* Blob 3 - Small detail */}
                <div style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '45%',
                    backgroundColor: 'black',
                    left: `${10 + Math.sin(t * 0.5) * 20}%`,
                    bottom: `${30 + Math.cos(t * 0.6) * 15}%`,
                    transform: `rotate(${t * 10}deg) scale(1.2)`,
                    opacity: 0.15
                }} />
            </div>

            {/* Diffused Center Highlight */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '1000px',
                height: '1000px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                transform: `translate(-50%, -50%) scale(${1 + bass * 0.2})`,
                opacity: 0.5,
                filter: 'blur(50px)'
            }} />

            {/* Grain Overlay */}
            <AbsoluteFill style={{
                opacity: 0.08,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
                pointerEvents: 'none'
            }} />
        </AbsoluteFill>
    );
};
