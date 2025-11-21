import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Komunitas Donasi',
  description: 'Aplikasi donasi untuk komunitas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* ADD THIS EMPTY HEAD TAG */}
      <head>
        {/* Next.js automatically puts things like meta tags here */}
      </head>
      {/* Make sure body starts right after head */}
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}