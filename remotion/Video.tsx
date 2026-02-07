import React from 'react'
import { Story, StoryMetadata } from './Story'

export const Video = ({ story, sound }: { story: StoryMetadata; sound?: string }) => {
  return <Story story={story} sound={sound} />
}
