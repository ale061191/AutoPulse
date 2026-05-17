import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoPulse',
  description: 'Dashboard de análisis de ventas para concesionarios',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-[#050505] text-white antialiased">{children}</body>
    </html>
  )
}
