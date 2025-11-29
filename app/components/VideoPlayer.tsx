'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { 
  PlayIcon, 
  PauseIcon, 
  SkipBackIcon, 
  SkipForwardIcon,
  VolumeIcon,
  VolumeMuteIcon,
  FullscreenIcon
} from './Icons'
import styles from './VideoPlayer.module.css'

interface VideoPlayerProps {
  component: React.FC<any>
  inputProps: Record<string, any>
  durationInFrames: number
  fps: number
  width: number
  height: number
  onFrameChange?: (frame: number) => void
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  component,
  inputProps,
  durationInFrames,
  fps,
  width,
  height,
  onFrameChange
}) => {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  
  const formatTime = useCallback((frame: number) => {
    const seconds = frame / fps
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const frames = Math.floor(frame % fps)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }, [fps])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleFrame = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame)
      onFrameChange?.(e.detail.frame)
    }

    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('frameupdate', handleFrame as any)

    return () => {
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('frameupdate', handleFrame as any)
    }
  }, [onFrameChange])

  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
    }
  }, [isPlaying])

  const seekToStart = useCallback(() => {
    playerRef.current?.seekTo(0)
  }, [])

  const seekToEnd = useCallback(() => {
    playerRef.current?.seekTo(durationInFrames - 1)
  }, [durationInFrames])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
    if (playerRef.current) {
      playerRef.current.setVolume(isMuted ? volume : 0)
    }
  }, [isMuted, volume])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    playerRef.current?.setVolume(newVolume)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const seekToFrame = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekToFrame(Math.max(0, currentFrame - (e.shiftKey ? fps : 1)))
          break
        case 'ArrowRight':
          e.preventDefault()
          seekToFrame(Math.min(durationInFrames - 1, currentFrame + (e.shiftKey ? fps : 1)))
          break
        case 'Home':
          e.preventDefault()
          seekToStart()
          break
        case 'End':
          e.preventDefault()
          seekToEnd()
          break
        case 'm':
          toggleMute()
          break
        case 'f':
          toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, currentFrame, fps, durationInFrames, seekToFrame, seekToStart, seekToEnd, toggleMute, toggleFullscreen])

  const progress = (currentFrame / (durationInFrames - 1)) * 100

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.playerWrapper}>
        <Player
          ref={playerRef}
          component={component}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={width}
          compositionHeight={height}
          fps={fps}
          style={{
            width: '100%',
            height: '100%',
          }}
          controls={false}
        />
        
        {/* Aspect ratio indicator */}
        <div className={styles.aspectBadge}>
          {width} × {height}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <input
          type="range"
          min={0}
          max={durationInFrames - 1}
          value={currentFrame}
          onChange={(e) => seekToFrame(parseInt(e.target.value))}
          className={styles.progressSlider}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <button className={styles.controlBtn} onClick={seekToStart} title="Go to start (Home)">
            <SkipBackIcon size={18} />
          </button>
          <button className={styles.controlBtn + ' ' + styles.playBtn} onClick={togglePlay} title="Play/Pause (Space)">
            {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </button>
          <button className={styles.controlBtn} onClick={seekToEnd} title="Go to end (End)">
            <SkipForwardIcon size={18} />
          </button>
        </div>

        <div className={styles.controlsCenter}>
          <span className={styles.timecode + ' mono'}>
            {formatTime(currentFrame)}
          </span>
          <span className={styles.timeDivider}>/</span>
          <span className={styles.timecode + ' ' + styles.totalTime + ' mono'}>
            {formatTime(durationInFrames)}
          </span>
          <span className={styles.frameCount + ' mono'}>
            Frame {currentFrame + 1} of {durationInFrames}
          </span>
        </div>

        <div className={styles.controlsRight}>
          <div className={styles.volumeControl}>
            <button className={styles.controlBtn} onClick={toggleMute} title="Mute (M)">
              {isMuted || volume === 0 ? <VolumeMuteIcon size={18} /> : <VolumeIcon size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
            />
          </div>
          <button className={styles.controlBtn} onClick={toggleFullscreen} title="Fullscreen (F)">
            <FullscreenIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
