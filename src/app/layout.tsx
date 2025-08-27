import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientProviders from './client-providers'
import '@/index.css'
import '@/styles/layout.css'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className} suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
