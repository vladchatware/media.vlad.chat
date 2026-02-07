
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, random } from 'remotion';
import { useAudio } from '../ProductUpdates/AudioProvider';

export const ShopSummary: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const scale = interpolate(frame, [0, 100], [1, 1.2]) * (1 + bass * 0.3);
    const opacity = interpolate(frame, [0, 20], [0, 1]);

    // Summary Data
    const totalSales = 27;
    const totalVisits = 139;
    const totalCR = "19.4%";
    const accent = '#FF90E8';

    const jitterX = (random(frame + 10) - 0.5) * (bass * 80);
    const jitterY = (random(frame + 11) - 0.5) * (bass * 80);

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
            <div style={{
                position: 'absolute',
                top: '150px',
                fontSize: '200px',
                opacity: 0.1,
                textTransform: 'uppercase',
                transform: `scale(${1 + volume * 0.5}) rotate(${(volume - 0.5) * 5}deg)`
            }}>TOTALS</div>

            <div
                style={{
                    opacity,
                    transform: `scale(${scale}) translate(${jitterX}px, ${jitterY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '40px',
                    zIndex: 10
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '180px', lineHeight: 0.8, color: accent }}>{totalSales}</span>
                    <span style={{ fontSize: '60px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>SALES</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '100px', lineHeight: 0.8, color: accent }}>{totalVisits}</span>
                    <span style={{ fontSize: '40px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VISITS</span>
                </div>

                <div style={{
                    padding: '30px 60px',
                    border: '8px solid white',
                    backgroundColor: volume > 0.8 ? 'white' : 'transparent',
                    color: volume > 0.8 ? 'black' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: `scale(${1 + bass * 0.2}) rotate(${(bass - 0.5) * 10}deg)`
                }}>
                    <span style={{ fontSize: '120px', lineHeight: 0.8 }}>{totalCR}</span>
                    <span style={{ fontSize: '30px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AVG CONVERSION</span>
                </div>
            </div>

            <AbsoluteFill style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '80px',
                pointerEvents: 'none'
            }}>
                <div style={{
                    padding: '20px 40px',
                    fontSize: '40px',
                    fontWeight: 900,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                    border: `4px solid ${accent}`,
                    transform: `scale(${1 + volume * 0.3})`
                }}>shop.vlad.chat</div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
