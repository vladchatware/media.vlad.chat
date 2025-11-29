'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ZoomInIcon, ZoomOutIcon } from './Icons'
import styles from './Timeline.module.css'

interface TimelineMarker {
  frame: number
  label?: string
  color?: string
}

interface TimelineProps {
  currentFrame: number
  durationInFrames: number
  fps: number
  onSeek: (frame: number) => void
  markers?: TimelineMarker[]
  sequences?: Array<{
    name: string
    startFrame: number
    endFrame: number
    color?: string
  }>
}

export const Timeline: React.FC<TimelineProps> = ({
  currentFrame,
  durationInFrames,
  fps,
  onSeek,
  markers = [],
  sequences = []
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  const formatTime = useCallback((frame: number) => {
    const seconds = frame / fps
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [fps])

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: Array<{ frame: number; label: string; isMajor: boolean }> = []
    const interval = Math.max(1, Math.floor(fps / zoom)) // Frames per marker
    const majorInterval = fps * 5 // Major marker every 5 seconds

    for (let frame = 0; frame <= durationInFrames; frame += interval) {
      const isMajor = frame % majorInterval === 0
      if (isMajor || zoom > 0.5) {
        markers.push({
          frame,
          label: formatTime(frame),
          isMajor
        })
      }
    }
    return markers
  }, [durationInFrames, fps, zoom, formatTime])

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = x / rect.width
    const frame = Math.round(progress * (durationInFrames - 1))
    onSeek(Math.max(0, Math.min(durationInFrames - 1, frame)))
  }, [durationInFrames, onSeek])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleTrackClick(e)
  }, [handleTrackClick])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    handleTrackClick(e)
  }, [isDragging, handleTrackClick])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(4, prev * 1.5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.25, prev / 1.5))
  }, [])

  const playheadPosition = (currentFrame / (durationInFrames - 1)) * 100

  return (
    <div className={styles.container}>
      {/* Timeline header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>Timeline</span>
          <span className={styles.fps + ' mono'}>{fps} fps</span>
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={handleZoomOut} title="Zoom out">
            <ZoomOutIcon size={16} />
          </button>
          <span className={styles.zoomLevel + ' mono'}>{Math.round(zoom * 100)}%</span>
          <button className={styles.zoomBtn} onClick={handleZoomIn} title="Zoom in">
            <ZoomInIcon size={16} />
          </button>
        </div>
      </div>

      {/* Time ruler */}
      <div className={styles.ruler}>
        {timeMarkers.map((marker, i) => (
          <div
            key={i}
            className={`${styles.rulerMark} ${marker.isMajor ? styles.majorMark : ''}`}
            style={{ left: `${(marker.frame / durationInFrames) * 100}%` }}
          >
            {marker.isMajor && (
              <span className={styles.rulerLabel + ' mono'}>{marker.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Timeline tracks */}
      <div className={styles.tracks}>
        {/* Sequences track */}
        {sequences.length > 0 && (
          <div className={styles.track}>
            <div className={styles.trackLabel}>Sequences</div>
            <div className={styles.trackContent}>
              {sequences.map((seq, i) => (
                <div
                  key={i}
                  className={styles.sequence}
                  style={{
                    left: `${(seq.startFrame / durationInFrames) * 100}%`,
                    width: `${((seq.endFrame - seq.startFrame) / durationInFrames) * 100}%`,
                    backgroundColor: seq.color || 'var(--accent-tertiary)',
                  }}
                  title={`${seq.name}: ${seq.startFrame} - ${seq.endFrame}`}
                >
                  <span className={styles.sequenceLabel}>{seq.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main playhead track */}
        <div 
          className={styles.track + ' ' + styles.mainTrack}
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className={styles.trackLabel}>Playhead</div>
          <div className={styles.trackContent}>
            {/* Progress fill */}
            <div 
              className={styles.progressFill}
              style={{ width: `${playheadPosition}%` }}
            />

            {/* Custom markers */}
            {markers.map((marker, i) => (
              <div
                key={i}
                className={styles.marker}
                style={{ 
                  left: `${(marker.frame / durationInFrames) * 100}%`,
                  backgroundColor: marker.color || 'var(--warning)'
                }}
                title={marker.label || `Frame ${marker.frame}`}
              />
            ))}

            {/* Playhead */}
            <div 
              className={styles.playhead}
              style={{ left: `${playheadPosition}%` }}
            >
              <div className={styles.playheadHead} />
              <div className={styles.playheadLine} />
            </div>
          </div>
        </div>

        {/* Audio waveform placeholder */}
        <div className={styles.track}>
          <div className={styles.trackLabel}>Audio</div>
          <div className={styles.trackContent + ' ' + styles.audioTrack}>
            <div className={styles.waveform}>
              {Array.from({ length: 100 }).map((_, i) => (
                <div 
                  key={i} 
                  className={styles.waveformBar}
                  style={{ 
                    height: `${Math.random() * 60 + 20}%`,
                    opacity: i / 100 <= currentFrame / durationInFrames ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline footer */}
      <div className={styles.footer}>
        <span className={styles.frameInfo + ' mono'}>
          Current: {currentFrame} / {durationInFrames} frames
        </span>
        <span className={styles.durationInfo + ' mono'}>
          Duration: {formatTime(durationInFrames)}
        </span>
      </div>
    </div>
  )
}

export default Timeline
