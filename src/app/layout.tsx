import type { Metadata, Viewport } from 'next'
import ClientProviders from './client-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Twyst Order Flow',
  description: 'Restaurant ordering system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
