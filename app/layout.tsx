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
        <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-pattern">
          <nav className="glass-navbar">
            <div className="container mx-auto flex items-center justify-between px-2 py-3 sm:px-4 sm:py-4">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-forest-dark">Brikkhobondhon Leave Management</h1>
              <div className="space-x-3 sm:space-x-6">
                <a href="/" className="text-sm md:text-base text-forest-dark hover:text-forest font-medium transition-colors">Home</a>
                <a href="/admin" className="text-sm md:text-base text-forest-dark hover:text-forest font-medium transition-colors">Admin</a>
              </div>
            </div>
          </nav>
          <div className="w-full relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 sm:w-64 h-48 sm:h-64 bg-leaf/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-32 w-64 sm:w-96 h-64 sm:h-96 bg-forest/5 rounded-full blur-3xl"></div>
          </div>
          <main className="container mx-auto p-3 sm:p-4 md:p-6 relative z-10">
            {children}
          </main>
          <footer className="container mx-auto p-4 sm:p-6 mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Brikkhobondhon. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  )
} 