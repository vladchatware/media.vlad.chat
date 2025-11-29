'use client'

import React from 'react'
import { FilmIcon, LayersIcon } from './Icons'
import styles from './CompositionSelector.module.css'

export interface CompositionConfig {
  id: string
  name: string
  description?: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  defaultProps: Record<string, any>
  schema?: Record<string, any>
}

interface CompositionSelectorProps {
  compositions: CompositionConfig[]
  selectedId: string
  onSelect: (id: string) => void
}

const formatDuration = (frames: number, fps: number) => {
  const seconds = frames / fps
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const formatResolution = (width: number, height: number) => {
  const aspectRatio = width / height
  let label = ''
  if (Math.abs(aspectRatio - 16/9) < 0.1) label = '16:9'
  else if (Math.abs(aspectRatio - 9/16) < 0.1) label = '9:16'
  else if (Math.abs(aspectRatio - 4/3) < 0.1) label = '4:3'
  else if (Math.abs(aspectRatio - 1) < 0.1) label = '1:1'
  else label = `${(aspectRatio).toFixed(2)}:1`
  return label
}

export const CompositionSelector: React.FC<CompositionSelectorProps> = ({
  compositions,
  selectedId,
  onSelect
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <LayersIcon size={16} />
        <span className={styles.title}>Compositions</span>
        <span className={styles.count}>{compositions.length}</span>
      </div>
      
      <div className={styles.list}>
        {compositions.map((comp) => {
          const isSelected = comp.id === selectedId
          return (
            <button
              key={comp.id}
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(comp.id)}
            >
              <div className={styles.itemIcon}>
                <FilmIcon size={18} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{comp.name}</span>
                  <span className={styles.itemDuration + ' mono'}>
                    {formatDuration(comp.durationInFrames, comp.fps)}
                  </span>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.itemRes + ' mono'}>{comp.width}×{comp.height}</span>
                  <span className={styles.itemDot}>•</span>
                  <span className={styles.itemRatio}>{formatResolution(comp.width, comp.height)}</span>
                  <span className={styles.itemDot}>•</span>
                  <span className={styles.itemFps + ' mono'}>{comp.fps} fps</span>
                </div>
                {comp.description && (
                  <p className={styles.itemDescription}>{comp.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {compositions.length === 0 && (
        <div className={styles.empty}>
          <FilmIcon size={24} />
          <p>No compositions found</p>
        </div>
      )}
    </div>
  )
}

export default CompositionSelector
