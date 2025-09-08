import type { Metadata } from 'next'
import ClientProviders from './client-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Twyst Order Flow',
  description: 'Restaurant ordering system',
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
