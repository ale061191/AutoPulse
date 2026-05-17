'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/ventas', label: 'Ventas', icon: '💰' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/vendedores', label: 'Vendedores', icon: '👤' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-[#111] border-r border-[#222] flex flex-col h-screen">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#222]">
        <div className="w-7 h-7 bg-[#9C5F43] rounded-lg" />
        <span className="font-bold text-white">AutoPulse</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-[10px] uppercase text-gray-500 tracking-wider px-2 mb-2">Principal</p>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === l.href
                ? 'bg-[#9C5F43] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            )}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-[#222]">
        <Link href="/config"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <span>⚙️</span><span>Configuración</span>
        </Link>
      </div>
    </aside>
  )
}
