// Static composition assets are hosted on Vercel Blob (public) at the store
// root, so a name resolves to the same pathname as the local file name.
// Compositions resolve these via staticUrl() instead of staticFile() so they
// render from Blob URLs.
export const BLOB_BASE = 'https://7u68xtms1ss7pxli.public.blob.vercel-storage.com'

// Resolve a static asset name (or an already-absolute URL) to its public URL.
export const staticUrl = (name: string): string => {
  if (/^https?:\/\//.test(name)) {
    return name
  }
  return `${BLOB_BASE}/${name}`
}

