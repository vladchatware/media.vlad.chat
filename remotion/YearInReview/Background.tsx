
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, interpolate, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

const LensFlare: React.FC<{ frame: number; seed: number; volume: number; bass: number }> = ({ frame, seed, volume, bass }) => {
    const x = random(seed) * 100;
    const y = random(seed + 1) * 100;

    // Invasive Anamorphic horizontal streak
    const streakWidth = 3000 * (0.8 + volume);
    const streakHeight = 10 + volume * 100;
    const streakOpacity = interpolate(volume, [0.5, 0.9], [0, 1], { extrapolateLeft: 'clamp' });

    // Blinding Central Glare
    const glareSize = 1000 * (0.5 + volume);
    const glareOpacity = interpolate(volume, [0.4, 0.8], [0, 1], { extrapolateLeft: 'clamp' });

    if (volume < 0.45) return null;

    return (
        <div style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
        }}>
            {/* Blinding Center Burst */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: glareSize,
                height: glareSize,
                background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,180,0,0.6) 10%, rgba(255,0,0,0.2) 30%, transparent 70%)',
                filter: 'blur(10px)',
                opacity: glareOpacity,
                mixBlendMode: 'plus-lighter',
                transform: 'translate(-50%, -50%)',
            }} />

            {/* Invasive Anamorphic Streak */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: streakWidth,
                height: streakHeight,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 50%, transparent 100%)',
                boxShadow: `0 0 ${streakHeight * 5}px rgba(255,255,255,1), 0 0 ${streakHeight * 15}px rgba(0,180,255,0.8)`,
                transform: 'translate(-50%, -50%)',
                opacity: streakOpacity,
                mixBlendMode: 'plus-lighter',
            }} />

            {/* Vertical Ray */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: streakHeight * 3,
                height: streakWidth * 0.8,
                background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                transform: 'translate(-50%, -50%) rotate(15deg)',
                opacity: streakOpacity * 0.5,
                mixBlendMode: 'plus-lighter',
            }} />
        </div>
    );
};

export const Background: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { visualization, volume, bass } = useAudio();

    // High frequency content for jitter
    const highFreq = visualization.length > 0
        ? (visualization[13] + visualization[14] + visualization[15]) / 3
        : 0;

    const noiseFilter = useMemo(() => (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="noiseFilter">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.65"
                    numOctaves="4"
                    stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
            </filter>
            <filter id="displacementFilter">
                <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="turbulence" />
                <feDisplacementMap in2="turbulence" in="SourceGraphic" scale={bass * 100} xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </svg>
    ), [bass]);

    const t = frame / fps;

    // Invasive Camera Jitter
    const jitterX = (random(frame) - 0.5) * (bass * 60 + highFreq * 40);
    const jitterY = (random(frame + 1) - 0.5) * (bass * 60 + highFreq * 40);

    const backgroundScale = 1.3 + (bass * 0.5);

    return (
        <AbsoluteFill style={{
            backgroundColor: '#000',
            overflow: 'hidden',
        }}>
            {noiseFilter}

            {/* Main Background Content with invasive jitter and scale */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `scale(${backgroundScale}) translate(${jitterX}px, ${jitterY}px)`,
                filter: volume > 0.8 ? 'url(#displacementFilter)' : 'none'
            }}>
                {/* Background Blobs - Brighter and more active */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    filter: 'blur(60px)',
                }}>
                    <div style={{
                        position: 'absolute',
                        left: `${50 + 40 * Math.sin(t * 0.8)}%`,
                        top: `${50 + 30 * Math.cos(t * 0.5)}%`,
                        width: `${70 + bass * 80}%`,
                        height: `${70 + bass * 80}%`,
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(255,20,0,1) 0%, rgba(255,0,0,0) 70%)',
                        opacity: 0.5 + bass * 0.5
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: `${20 + 50 * Math.cos(t * 0.7)}%`,
                        top: `${80 + 40 * Math.sin(t * 0.9)}%`,
                        width: `${80 + volume * 60}%`,
                        height: `${80 + volume * 60}%`,
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(255,200,0,1) 0%, rgba(255,100,0,0) 70%)',
                        opacity: 0.4 + volume * 0.6
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: `${80 + 40 * Math.sin(t * 1.1)}%`,
                        top: `${30 + 50 * Math.cos(t * 0.6)}%`,
                        width: `${90 + bass * 40}%`,
                        height: `${90 + bass * 40}%`,
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(100,0,255,0.4) 0%, rgba(0,0,0,0) 70%)',
                        opacity: bass * 0.4
                    }} />
                </div>

                {/* Blinding Lens Flares - More layers */}
                {[...Array(5)].map((_, i) => (
                    <LensFlare
                        key={i}
                        frame={frame}
                        seed={Math.floor(frame / 2) * 20 + i}
                        volume={volume}
                        bass={bass}
                    />
                ))}
            </div>

            {/* Invasive Flash Layers */}
            <AbsoluteFill style={{
                backgroundColor: 'white',
                opacity: bass > 0.75 ? (bass - 0.75) * 6 : 0,
                mixBlendMode: 'plus-lighter',
                zIndex: 100
            }} />

            <AbsoluteFill style={{
                backgroundColor: '#00ccff',
                opacity: highFreq > 0.8 ? (highFreq - 0.8) * 4 : 0,
                mixBlendMode: 'screen',
                zIndex: 101
            }} />

            {/* Heavy Moving Grain */}
            <AbsoluteFill style={{
                opacity: 0.4 + volume * 0.2,
                filter: 'url(#noiseFilter)',
                mixBlendMode: 'overlay',
                transform: `scale(${1.2 + random(frame) * 0.2}) translate(${(random(frame + 2) - 0.5) * 50}px)`,
                zIndex: 102
            }} />

            {/* Deep Red Vignette */}
            <AbsoluteFill style={{
                background: 'radial-gradient(circle, transparent 10%, rgba(0,0,0,0.8) 100%, black 130%)',
                mixBlendMode: 'multiply',
                zIndex: 103
            }} />

            {/* Invasive Screen Distortion / Glitch Bars */}
            {volume > 0.8 && [...Array(3)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: (random(frame + i) * 100) + '%',
                    width: '100%',
                    height: (random(frame + i + 1) * 100) + 'px',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    boxShadow: '0 0 60px white',
                    mixBlendMode: 'plus-lighter',
                    transform: `translateX(${(random(frame + i + 2) - 0.5) * 40}px)`,
                    zIndex: 104
                }} />
            ))}

            {/* Chromatic Aberration Simulation (Simplified) */}
            <AbsoluteFill style={{
                border: `${volume * 20}px solid rgba(255,0,0,0.3)`,
                filter: 'blur(30px)',
                pointerEvents: 'none',
                zIndex: 105
            }} />
        </AbsoluteFill>
    );
};
