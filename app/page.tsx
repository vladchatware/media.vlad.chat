import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Engine',
  description: 'Social media content generation engine.',
}

export default function Page() {
  const endpoints = [
    { method: 'GET', path: '/api/story?prompt=...', desc: 'Generate a story video with slides, audio, and captions' },
    { method: 'GET', path: '/api/carousel?prompt=...', desc: 'Generate a carousel post' },
    { method: 'GET', path: '/api/tweet?content=...&voice=ash', desc: 'Generate a tweet video with voiceover' },
    { method: 'GET', path: '/api/thread?content=...&voice=onyx', desc: 'Generate a thread video with voiceover' },
    { method: 'GET', path: '/api/video?prompt=...', desc: 'Generate an AI video (Sora)' },
    { method: 'GET', path: '/api/status?runId=...', desc: 'Poll a workflow run and get the rendered media URL' },
  ]

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28 }}>Media Engine</h1>
      <p style={{ color: '#555' }}>
        Content generation API. Trigger a workflow via an endpoint below, then poll{' '}
        <code>/api/status?runId=...</code> to get the rendered media URL (stored in Vercel Blob).
      </p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {endpoints.map((e) => (
          <li key={e.path} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
              {e.method} {e.path}
            </code>
            <div style={{ color: '#777', marginTop: 4 }}>{e.desc}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
