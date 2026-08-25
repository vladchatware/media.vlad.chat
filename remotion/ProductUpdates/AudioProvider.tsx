
import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { SOUND_FILE, SOUND_OFFSET } from './Constants';

const AudioContext = createContext<{
    volume: number;
    bass: number;
    visualization: number[]
} | null>(null);

interface AudioProviderProps {
    children: React.ReactNode;
    src?: string;
    offset?: number;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({
    children,
    src = SOUND_FILE,
    offset = SOUND_OFFSET
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const audioData = useAudioData(staticFile(src));

    const value = useMemo(() => {
        if (!audioData) {
            return { volume: 0, bass: 0, visualization: Array(16).fill(0) };
        }

        // Ensure frame is always positive and within reasonable audio bounds
        const targetFrame = Math.max(0, frame + offset);

        const visualization = visualizeAudio({
            fps,
            frame: targetFrame,
            audioData,
            numberOfSamples: 16,
        });

        const volume = visualization.length > 0
            ? visualization.reduce((acc, val) => acc + val, 0) / visualization.length
            : 0;

        const bass = visualization.length > 0
            ? (visualization[0] + visualization[1] + visualization[2]) / 3
            : 0;

        return { volume, bass, visualization };
    }, [audioData, fps, frame, offset]);

    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        return { volume: 0, bass: 0, visualization: [] as number[] };
    }
    return context;
};
