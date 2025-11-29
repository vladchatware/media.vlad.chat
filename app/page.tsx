'use client'

import React, { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { CompositionSelector, CompositionConfig } from './components/CompositionSelector'
import { PropertiesPanel, generatePropertiesFromObject } from './components/PropertiesPanel'
import { RenderControls } from './components/RenderControls'
import { Timeline } from './components/Timeline'
import styles from './page.module.css'

// Dynamically import the video player to avoid SSR issues
const VideoPlayer = dynamic(() => import('./components/VideoPlayer'), { 
  ssr: false,
  loading: () => (
    <div className={styles.playerLoading}>
      <div className={styles.loadingSpinner} />
      <span>Loading player...</span>
    </div>
  )
})

// Import composition components
import { Thread } from '../remotion/Thread'
import { Tweet } from '../remotion/Tweet'
import { Story } from '../remotion/Story'
import { Carousel } from '../remotion/Carousel'
import { Outro } from '../remotion/Outro'
import { storyData } from '../remotion/data'

// Define available compositions
const compositions: CompositionConfig[] = [
  {
    id: 'Thread',
    name: 'Thread',
    description: 'Create a Threads-style video post with animated text',
    width: 1284,
    height: 2282,
    fps: 30,
    durationInFrames: 150,
    defaultProps: {
      image: 'pic.jpeg',
      username: 'vlad.chat',
      content: "Most people aren't afraid to fail. They're afraid to succeed because that would require them to change.",
      sound: 'speech-0.mp3',
      mode: 'light'
    }
  },
  {
    id: 'Tweet',
    name: 'Tweet',
    description: 'Create a Tweet/X-style video with voiceover',
    width: 1284,
    height: 2282,
    fps: 30,
    durationInFrames: 150,
    defaultProps: {
      image: 'pic.jpeg',
      username: 'vlad.chat',
      handle: '@vladchatware',
      content: "i'm pissed man. i might go full innawoods and disconnect. fuck corporations",
      sound: 'speech-0.mp3',
      mode: 'dark'
    }
  },
  {
    id: 'Story',
    name: 'Story',
    description: 'Full narrative story with dialogue and captions',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 300,
    defaultProps: {
      story: storyData as any
    }
  },
  {
    id: 'Carousel',
    name: 'Carousel',
    description: 'Instagram-style carousel with multiple slides',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: storyData.dialog.length,
    defaultProps: {
      story: storyData as any,
      image: 'the-need-to-be-right.jpeg'
    }
  },
  {
    id: 'Outro',
    name: 'Outro',
    description: 'Video outro sequence',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 150,
    defaultProps: {
      video: 'Outro.mp4'
    }
  }
]

// Map composition IDs to components
const compositionComponents: Record<string, React.FC<any>> = {
  Thread,
  Tweet,
  Story,
  Carousel,
  Outro
}

export default function EditorPage() {
  const [selectedCompositionId, setSelectedCompositionId] = useState('Thread')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [customProps, setCustomProps] = useState<Record<string, Record<string, any>>>({})

  const selectedComposition = useMemo(() => 
    compositions.find(c => c.id === selectedCompositionId)!,
    [selectedCompositionId]
  )

  const currentProps = useMemo(() => ({
    ...selectedComposition.defaultProps,
    ...(customProps[selectedCompositionId] || {})
  }), [selectedComposition, customProps, selectedCompositionId])

  const Component = compositionComponents[selectedCompositionId]

  const handleCompositionSelect = useCallback((id: string) => {
    setSelectedCompositionId(id)
    setCurrentFrame(0)
  }, [])

  const handlePropChange = useCallback((key: string, value: any) => {
    setCustomProps(prev => ({
      ...prev,
      [selectedCompositionId]: {
        ...(prev[selectedCompositionId] || {}),
        [key]: value
      }
    }))
  }, [selectedCompositionId])

  const handlePropsReset = useCallback(() => {
    setCustomProps(prev => {
      const next = { ...prev }
      delete next[selectedCompositionId]
      return next
    })
  }, [selectedCompositionId])

  const handleFrameChange = useCallback((frame: number) => {
    setCurrentFrame(frame)
  }, [])

  const handleSeek = useCallback((frame: number) => {
    setCurrentFrame(frame)
    // The player will handle seeking via ref
  }, [])

  // Generate editable properties from the current props
  const properties = useMemo(() => {
    // Exclude complex nested objects from direct editing
    const excludeKeys = ['story', 'captions', 'dialog']
    return generatePropertiesFromObject(selectedComposition.defaultProps, excludeKeys)
  }, [selectedComposition])

  // Generate timeline sequences from story dialog if applicable
  const sequences = useMemo(() => {
    if (selectedCompositionId === 'Story' && currentProps.story?.dialog) {
      let startFrame = 0
      return currentProps.story.dialog.map((line: any, i: number) => {
        const duration = line.durationInFrames || 30
        const seq = {
          name: `Scene ${i + 1}`,
          startFrame,
          endFrame: startFrame + duration,
          color: line.side === 'left' ? '#6366f1' : '#b366ff'
        }
        startFrame += duration
        return seq
      })
    }
    return []
  }, [selectedCompositionId, currentProps])

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="6" fill="url(#gradient)" />
              <path d="M7 8.5L12 5L17 8.5V15.5L12 19L7 15.5V8.5Z" stroke="white" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#b366ff" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Media Studio</span>
          </div>
        </div>
        <div className={styles.headerCenter}>
          <span className={styles.compositionName}>{selectedComposition.name}</span>
          <span className={styles.compositionMeta + ' mono'}>
            {selectedComposition.width}×{selectedComposition.height} @ {selectedComposition.fps}fps
          </span>
        </div>
        <div className={styles.headerRight}>
          <a 
            href="https://media.vlad.chat" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.docsLink}
          >
            API Docs
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Left sidebar - Compositions */}
        <aside className={styles.sidebarLeft}>
          <CompositionSelector
            compositions={compositions}
            selectedId={selectedCompositionId}
            onSelect={handleCompositionSelect}
          />
        </aside>

        {/* Center - Video player and timeline */}
        <div className={styles.center}>
          <div className={styles.playerArea}>
            <VideoPlayer
              component={Component}
              inputProps={currentProps}
              durationInFrames={selectedComposition.durationInFrames}
              fps={selectedComposition.fps}
              width={selectedComposition.width}
              height={selectedComposition.height}
              onFrameChange={handleFrameChange}
            />
          </div>
          <div className={styles.timelineArea}>
            <Timeline
              currentFrame={currentFrame}
              durationInFrames={selectedComposition.durationInFrames}
              fps={selectedComposition.fps}
              onSeek={handleSeek}
              sequences={sequences}
            />
          </div>
        </div>

        {/* Right sidebar - Properties and Export */}
        <aside className={styles.sidebarRight}>
          <div className={styles.propertiesArea}>
            <PropertiesPanel
              title="Properties"
              properties={properties}
              values={currentProps}
              onChange={handlePropChange}
              onReset={handlePropsReset}
            />
          </div>
          <div className={styles.renderArea}>
            <RenderControls
              compositionId={selectedCompositionId}
              inputProps={currentProps}
              width={selectedComposition.width}
              height={selectedComposition.height}
              fps={selectedComposition.fps}
              durationInFrames={selectedComposition.durationInFrames}
            />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerText}>
            Keyboard: <kbd>Space</kbd> Play/Pause • <kbd>←</kbd><kbd>→</kbd> Seek • <kbd>M</kbd> Mute • <kbd>F</kbd> Fullscreen
          </span>
        </div>
        <div className={styles.footerRight}>
          <span className={styles.footerText + ' mono'}>v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
