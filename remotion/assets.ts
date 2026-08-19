// Static composition assets hosted on Vercel Blob (public).
// Uploaded once via `vercel blob put`. Compositions resolve these via
// staticUrl() instead of staticFile() so they render from Blob URLs.
const BLOB_BASE = 'https://7u68xtms1ss7pxli.public.blob.vercel-storage.com'

export const assets: Record<string, string> = {
  'pic.jpeg': `${BLOB_BASE}/pic.jpeg`,
  '181.jpeg': `${BLOB_BASE}/181.jpeg`,
  '1939477514.mp4': `${BLOB_BASE}/1939477514.mp4`,
  'IMG_4959.JPG': `${BLOB_BASE}/IMG_4959.JPG`,
  'Outro.mp4': `${BLOB_BASE}/Outro.mp4`,
  'shadow.png': `${BLOB_BASE}/shadow.png`,
  'sound-prev.m4a': `${BLOB_BASE}/sound-prev.m4a`,
  'sound.m4a': `${BLOB_BASE}/sound.m4a`,
  'sound03.m4a': `${BLOB_BASE}/sound03.m4a`,
  'the-need-to-be-right.jpeg': `${BLOB_BASE}/the-need-to-be-right.jpeg`,
  'speech-0.mp3': `${BLOB_BASE}/speech-0.mp3`,
  'speech-1.mp3': `${BLOB_BASE}/speech-1.mp3`,
  'speech-2.mp3': `${BLOB_BASE}/speech-2.mp3`,
  'speech-3.mp3': `${BLOB_BASE}/speech-3.mp3`,
  'speech-4.mp3': `${BLOB_BASE}/speech-4.mp3`,
  'speech-5.mp3': `${BLOB_BASE}/speech-5.mp3`,
}

// Resolve a static asset name (or an already-absolute URL) to its public URL.
export const staticUrl = (name: string): string => {
  if (/^https?:\/\//.test(name)) {
    return name
  }
  return assets[name] ?? name
}
