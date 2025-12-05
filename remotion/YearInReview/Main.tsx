import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import { Background } from './Background';
import { Intro } from './Intro';
import { TopList } from './TopList';
import { SummaryText } from './SummaryText';

export const YearInReview: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
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

            {/* Optional: Add music if available */}
            {/* <Audio src={staticFile("music.mp3")} /> */}
        </AbsoluteFill>
    );
};
