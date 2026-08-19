import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { Background } from './Background';
import { Intro } from './Intro';
import { TopList } from './TopList';
import { SummaryText } from './SummaryText';
import { AudioProvider } from '../ProductUpdates/AudioProvider';
import { staticUrl } from '../assets';

export const YearInReview: React.FC = () => {
    const SOUND_FILE = staticUrl("sound.m4a");
    const SOUND_OFFSET = 800;

    return (
        <AudioProvider src={SOUND_FILE} offset={SOUND_OFFSET}>
            <AbsoluteFill style={{ backgroundColor: 'black' }}>
                <Audio
                    src={SOUND_FILE}
                    trimBefore={SOUND_OFFSET}
                />
                <Background />

                <Sequence from={0} durationInFrames={90}>
                    <Intro />
                </Sequence>

                <Sequence from={90} durationInFrames={250}>
                    <TopList />
                </Sequence>

                <Sequence from={340} durationInFrames={150}>
                    <SummaryText />
                </Sequence>

            </AbsoluteFill>
        </AudioProvider>
    );
};
