import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Media Studio | Video Editor',
  description: 'Custom video editor for Remotion compositions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
