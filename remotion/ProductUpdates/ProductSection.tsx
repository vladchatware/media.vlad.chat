
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, random } from 'remotion';
import { useAudio } from './AudioProvider';

interface ProductData {
    title: string;
    description?: string;
    features?: string[];
    readMore?: string;
}

interface ProductSectionProps {
    product: ProductData;
    theme?: 'light' | 'dark';
    accentColor?: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
    product,
    theme = 'light',
    accentColor = '#FFaa00'
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { volume, bass } = useAudio();

    const isDark = theme === 'dark';
    const primaryColor = isDark ? 'white' : 'black';
    const secondaryColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    const shadowColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

    const titleScale = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.8 },
    }) * (1 + bass * 0.2);

    const titleOpacity = interpolate(frame, [0, 6], [0, 1]);
    const jitterTitle = (random(frame) - 0.5) * (bass * 40);

    const descOpacity = interpolate(frame, [8, 14], [0, 1], { extrapolateRight: 'clamp' });
    const descTranslateY = interpolate(frame, [8, 14], [20, 0], { extrapolateRight: 'clamp' });
    const details = product.features?.length ? product.features : product.description ? [product.description] : [];

    // Dynamic background text
    const bgMove = interpolate(frame, [0, 57], [0, 30]) + (bass * 60);

    return (
        <AbsoluteFill style={{ padding: '80px', justifyContent: 'center' }}>
            {/* Massive Invasive Background Title */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '-10%',
                fontSize: '400px',
                fontWeight: 900,
                color: secondaryColor,
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                transform: `rotate(-5deg) translateX(${bgMove}px) skewY(${bass * 5}deg)`,
                pointerEvents: 'none',
                textTransform: 'uppercase',
                zIndex: 0,
            }}>
                {product.title}
            </div>

            <div style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                opacity: titleOpacity,
            }}>
                {/* Title */}
                <div style={{
                    transform: `translateY(${jitterTitle}px) scale(${titleScale}) rotate(${(random(frame) - 0.5) * volume * 2}deg)`,
                    filter: volume > 0.8 ? 'invert(1)' : 'none',
                    opacity: volume > 0.8 ? (random(frame) > 0.5 ? 1 : 0.8) : 1,
                }}>
                    <h1 style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '130px',
                        fontWeight: 900,
                        margin: 0,
                        textAlign: 'left',
                        lineHeight: 0.85,
                        letterSpacing: '-0.07em',
                        textTransform: 'uppercase',
                        color: primaryColor,
                        textShadow: volume > 0.4
                            ? `0 0 ${volume * 100}px ${shadowColor}`
                            : `0 10px 40px ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}>
                        {product.title}
                    </h1>
                </div>

                {/* Beating Line */}
                <div style={{
                    width: interpolate(bass, [0, 1], [200, 1000], { extrapolateRight: 'clamp' }),
                    height: '24px',
                    backgroundColor: primaryColor,
                    marginTop: '30px',
                    marginBottom: '50px',
                    borderRadius: '2px',
                    boxShadow: `0 0 ${40 + bass * 150}px ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    transform: `scaleY(${1 + bass * 4}) skewX(${volume * 15}deg)`,
                }} />

                {/* Description / metrics */}
                <div style={{
                    opacity: descOpacity,
                    transform: `translateY(${descTranslateY}px) skewX(${(random(frame + 2) - 0.5) * volume * 5}deg)`,
                    maxWidth: '900px'
                }}>
                    {details.map((line, i) => {
                        const isConversion = line.toLowerCase().includes('conversion');
                        return (
                            <p key={`${line}-${i}`} style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: isConversion ? '72px' : '52px',
                                fontWeight: isConversion ? 900 : 800,
                                lineHeight: 1.05,
                                margin: 0,
                                marginBottom: i === details.length - 1 ? 0 : '14px',
                                letterSpacing: '-0.03em',
                                textTransform: 'uppercase',
                                color: isConversion ? accentColor : primaryColor,
                                backgroundColor: volume > 0.8 ? (isDark ? 'black' : 'white') : 'transparent',
                                padding: '6px 0',
                                textShadow: isConversion ? `0 0 ${20 + bass * 80}px ${accentColor}aa` : 'none',
                            }}>
                                {line}
                            </p>
                        );
                    })}
                </div>
            </div>

            {/* Invasive Footer */}
            {product.readMore && (
                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '80px',
                    fontFamily: 'Inter, sans-serif',
                    color: primaryColor,
                    fontSize: '40px',
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    transform: `scale(${1 + volume * 0.2})`,
                    opacity: 0.6
                }}>
                    {product.readMore.toUpperCase()}
                </div>
            )}
        </AbsoluteFill>
    );
};
