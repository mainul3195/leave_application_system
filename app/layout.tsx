import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Brikkhobondhon - Leave Application System',
  description: 'A leave application management system for Brikkhobondhon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-pattern">
          <nav className="glass-navbar">
            <div className="container mx-auto flex items-center justify-between">
              <h1 className="text-xl font-bold text-forest-dark">Brikkhobondhon Leave Management System</h1>
              <div className="space-x-6">
                <a href="/" className="text-forest-dark hover:text-forest font-medium transition-colors">Home</a>
                <a href="/admin" className="text-forest-dark hover:text-forest font-medium transition-colors">Admin</a>
              </div>
            </div>
          </nav>
          <div className="w-full relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-leaf/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-32 w-96 h-96 bg-forest/5 rounded-full blur-3xl"></div>
          </div>
          <main className="container mx-auto p-6 relative z-10">
            {children}
          </main>
          <footer className="container mx-auto p-6 mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Brikkhobondhon. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  )
} 