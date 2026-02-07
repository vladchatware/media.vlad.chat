
import React from 'react';
import { AbsoluteFill, Sequence, OffthreadVideo, staticFile } from 'remotion';
import { SereneBackground } from './SereneBackground';
import { Intro } from './Intro';
import { ProductSection } from './ProductSection';
import { SummaryText } from './SummaryText';
import { productUpdates } from './data';
import { SOUND_FILE, SOUND_OFFSET } from './Constants';
import { AudioProvider } from './AudioProvider';

export const Main: React.FC = () => {
    const INTRO_DURATION = 57; // 4 beats (1 bar) - Ultra fast
    const PRODUCT_DURATION = 57; // 4 beats (1 bar)
    const SUMMARY_DURATION = 57; // 4 beats (1 bar)

    return (
        <AudioProvider>
            <AbsoluteFill style={{ backgroundColor: '#dcdcdc' }}>
                <OffthreadVideo
                    src={staticFile(SOUND_FILE)}
                    trimBefore={SOUND_OFFSET}
                />
                <SereneBackground />

                <Sequence from={0} durationInFrames={INTRO_DURATION}>
                    <Intro />
                </Sequence>

                {productUpdates.map((product, index) => {
                    const startFrame = INTRO_DURATION + (index * PRODUCT_DURATION);
                    return (
                        <Sequence
                            key={index}
                            from={startFrame}
                            durationInFrames={PRODUCT_DURATION}
                        >
                            <ProductSection product={product} />
                        </Sequence>
                    );
                })}

                <Sequence
                    from={INTRO_DURATION + (productUpdates.length * PRODUCT_DURATION)}
                    durationInFrames={SUMMARY_DURATION}
                >
                    <SummaryText />
                </Sequence>
            </AbsoluteFill>
        </AudioProvider>
    );
};
