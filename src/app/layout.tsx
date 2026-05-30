import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoachBase Admin',
  description: 'CoachBase business control panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
