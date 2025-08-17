import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider, ProfileProvider } from '../lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deep-Think - Crisis Decision Training',
  description: 'Develop rapid decision-making skills under high-stakes, chaotic conditions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  )
}