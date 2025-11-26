'use client'

import React, { useState, useCallback } from 'react'
import { SlidersIcon, RefreshIcon, ChevronDownIcon } from './Icons'
import styles from './PropertiesPanel.module.css'

interface PropertyDefinition {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'color' | 'file'
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

interface PropertiesPanelProps {
  title?: string
  properties: PropertyDefinition[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset?: () => void
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  title = 'Properties',
  properties,
  values,
  onChange,
  onReset
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    content: true,
    styling: true
  })

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const renderInput = (prop: PropertyDefinition) => {
    const value = values[prop.key] ?? ''

    switch (prop.type) {
      case 'string':
        return (
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => onChange(prop.key, e.target.value)}
            placeholder={prop.placeholder}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            className="input"
            value={value}
            onChange={(e) => onChange(prop.key, parseFloat(e.target.value) || 0)}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            placeholder={prop.placeholder}
          />
        )

      case 'boolean':
        return (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(prop.key, e.target.checked)}
            />
            <span className={styles.toggleSlider} />
            <span className={styles.toggleLabel}>{value ? 'On' : 'Off'}</span>
          </label>
        )

      case 'select':
        return (
          <select
            className="select"
            value={value}
            onChange={(e) => onChange(prop.key, e.target.value)}
          >
            {prop.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            className={styles.textarea}
            value={value}
            onChange={(e) => onChange(prop.key, e.target.value)}
            placeholder={prop.placeholder}
            rows={4}
          />
        )

      case 'color':
        return (
          <div className={styles.colorInput}>
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(prop.key, e.target.value)}
              className={styles.colorPicker}
            />
            <input
              type="text"
              className="input"
              value={value}
              onChange={(e) => onChange(prop.key, e.target.value)}
              placeholder="#000000"
            />
          </div>
        )

      case 'file':
        return (
          <div className={styles.fileInput}>
            <input
              type="text"
              className="input"
              value={value}
              onChange={(e) => onChange(prop.key, e.target.value)}
              placeholder={prop.placeholder || 'Enter file path...'}
            />
          </div>
        )

      default:
        return null
    }
  }

  // Group properties by category (you can customize this)
  const groupedProperties = properties.reduce((acc, prop) => {
    const category = prop.key.includes('content') || prop.key.includes('text') 
      ? 'content' 
      : prop.key.includes('color') || prop.key.includes('mode') || prop.key.includes('style')
      ? 'styling'
      : 'general'
    
    if (!acc[category]) acc[category] = []
    acc[category].push(prop)
    return acc
  }, {} as Record<string, PropertyDefinition[]>)

  const categoryLabels: Record<string, string> = {
    general: 'General',
    content: 'Content',
    styling: 'Styling'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <SlidersIcon size={16} />
          <span className={styles.title}>{title}</span>
        </div>
        {onReset && (
          <button className={styles.resetBtn} onClick={onReset} title="Reset to defaults">
            <RefreshIcon size={14} />
          </button>
        )}
      </div>

      <div className={styles.content}>
        {Object.entries(groupedProperties).map(([category, props]) => (
          <div key={category} className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection(category)}
            >
              <span className={styles.sectionTitle}>{categoryLabels[category] || category}</span>
              <ChevronDownIcon 
                size={14} 
              />
            </button>
            
            {expandedSections[category] && (
              <div className={styles.sectionContent}>
                {props.map((prop) => (
                  <div key={prop.key} className={styles.field}>
                    <label className={styles.label}>{prop.label}</label>
                    {renderInput(prop)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {properties.length === 0 && (
          <div className={styles.empty}>
            <p>No editable properties</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText + ' mono'}>
          {properties.length} properties
        </span>
      </div>
    </div>
  )
}

// Helper to generate property definitions from a schema or object
export const generatePropertiesFromObject = (
  obj: Record<string, any>,
  excludeKeys: string[] = []
): PropertyDefinition[] => {
  return Object.entries(obj)
    .filter(([key]) => !excludeKeys.includes(key))
    .map(([key, value]) => {
      let type: PropertyDefinition['type'] = 'string'
      let options: { value: string; label: string }[] | undefined

      if (typeof value === 'number') {
        type = 'number'
      } else if (typeof value === 'boolean') {
        type = 'boolean'
      } else if (typeof value === 'string') {
        if (value.length > 100) {
          type = 'textarea'
        } else if (value.startsWith('#') || value.startsWith('rgb')) {
          type = 'color'
        } else if (key === 'mode') {
          type = 'select'
          options = [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' }
          ]
        } else if (key === 'voice') {
          type = 'select'
          options = [
            { value: 'ash', label: 'Ash (Teacher)' },
            { value: 'onyx', label: 'Onyx (Student)' }
          ]
        }
      }

      return {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        type,
        options
      }
    })
}

export default PropertiesPanel
