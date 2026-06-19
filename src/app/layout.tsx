import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProCoach India Admin',
  description: 'ProCoach India business control panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
