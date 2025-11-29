'use client'

import React, { useState, useCallback } from 'react'
import { DownloadIcon, SettingsIcon, LoaderIcon, CheckIcon, XIcon } from './Icons'
import styles from './RenderControls.module.css'

interface RenderControlsProps {
  compositionId: string
  inputProps: Record<string, any>
  width: number
  height: number
  fps: number
  durationInFrames: number
  onRenderStart?: () => void
  onRenderComplete?: (result: { success: boolean; outputPath?: string; error?: string }) => void
}

type RenderStatus = 'idle' | 'rendering' | 'success' | 'error'

export const RenderControls: React.FC<RenderControlsProps> = ({
  compositionId,
  inputProps,
  width,
  height,
  fps,
  durationInFrames,
  onRenderStart,
  onRenderComplete
}) => {
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')

  const handleRender = useCallback(async () => {
    setStatus('rendering')
    setProgress(0)
    setError(null)
    onRenderStart?.()

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 500)

      const response = await fetch('/api/editor/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: compositionId,
          inputProps,
          format: outputFormat,
          quality
        })
      })

      clearInterval(progressInterval)
      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setProgress(100)
        onRenderComplete?.({ success: true, outputPath: result.outputPath })
      } else {
        throw new Error(result.error || 'Render failed')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
      onRenderComplete?.({ success: false, error: String(err) })
    }
  }, [compositionId, inputProps, outputFormat, quality, onRenderStart, onRenderComplete])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
  }, [])

  const estimatedDuration = Math.ceil((durationInFrames / fps) * 60) // Rough estimate in seconds

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <DownloadIcon size={16} />
        <span className={styles.title}>Export</span>
        <button 
          className={styles.settingsBtn}
          onClick={() => setShowSettings(!showSettings)}
          title="Render settings"
        >
          <SettingsIcon size={14} />
        </button>
      </div>

      {showSettings && (
        <div className={styles.settings}>
          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>Format</label>
            <select 
              className="select"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              disabled={status === 'rendering'}
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM (VP9)</option>
              <option value="gif">GIF</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>Quality</label>
            <select 
              className="select"
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              disabled={status === 'rendering'}
            >
              <option value="low">Low (faster)</option>
              <option value="medium">Medium</option>
              <option value="high">High (slower)</option>
            </select>
          </div>

          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Resolution</span>
              <span className={styles.infoValue + ' mono'}>{width}×{height}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Frame rate</span>
              <span className={styles.infoValue + ' mono'}>{fps} fps</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Duration</span>
              <span className={styles.infoValue + ' mono'}>{durationInFrames} frames</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Est. render time</span>
              <span className={styles.infoValue + ' mono'}>~{estimatedDuration}s</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {status === 'idle' && (
          <button 
            className="btn btn-primary" 
            onClick={handleRender}
            style={{ width: '100%' }}
          >
            <DownloadIcon size={16} />
            Export Video
          </button>
        )}

        {status === 'rendering' && (
          <div className={styles.renderProgress}>
            <div className={styles.progressHeader}>
              <LoaderIcon size={16} />
              <span>Rendering...</span>
              <span className={styles.progressPercent + ' mono'}>{Math.round(progress)}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.result + ' ' + styles.success}>
            <CheckIcon size={18} />
            <span>Export complete!</span>
            <button className="btn btn-secondary" onClick={handleReset}>
              Export Again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.result + ' ' + styles.error}>
            <XIcon size={18} />
            <div className={styles.errorContent}>
              <span>Export failed</span>
              {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
            <button className="btn btn-secondary" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RenderControls
