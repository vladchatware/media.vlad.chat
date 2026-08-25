
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ShopBackground } from './ShopBackground';
import { ShopIntro } from './ShopIntro';
import { ProductSection } from '../ProductUpdates/ProductSection';
import { ShopSummary } from './ShopSummary';
import { shopWrappedData } from './shopData';
import { AudioProvider } from '../ProductUpdates/AudioProvider';

export const ShopMain: React.FC = () => {
    const INTRO_DURATION = 90;
    const PRODUCT_DURATION = 180;
    const SUMMARY_DURATION = 210; // Slightly longer for the summary stats
    const SOUND_FILE = "sound-prev.m4a";
    const SOUND_OFFSET = 800;

    return (
        <AudioProvider src={SOUND_FILE} offset={SOUND_OFFSET}>
            <AbsoluteFill style={{ backgroundColor: 'black' }}>
                <Audio
                    src={staticFile(SOUND_FILE)}
                    trimBefore={SOUND_OFFSET}
                />
                <ShopBackground />

                <Sequence from={0} durationInFrames={INTRO_DURATION}>
                    <ShopIntro />
                </Sequence>

                {shopWrappedData.map((product, index) => (
                    <Sequence
                        key={index}
                        from={INTRO_DURATION + (index * PRODUCT_DURATION)}
                        durationInFrames={PRODUCT_DURATION}
                    >
                        <ProductSection product={product} theme="dark" accentColor="#FF90E8" />
                    </Sequence>
                ))}

                <Sequence
                    from={INTRO_DURATION + (shopWrappedData.length * PRODUCT_DURATION)}
                    durationInFrames={SUMMARY_DURATION}
                >
                    <ShopSummary />
                </Sequence>
            </AbsoluteFill>
        </AudioProvider>
    );
};
