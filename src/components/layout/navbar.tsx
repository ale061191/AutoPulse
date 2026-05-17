'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { DealerUser } from '@/types/database'

export function Navbar() {
  const [user, setUser] = useState<DealerUser | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const { data } = await supabase
        .from('dealer_users').select('*').eq('id', authUser.id).single()
      setUser(data)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-[#0a0a0a] border-b border-[#222] flex items-center justify-between px-6">
      <h2 className="text-sm text-gray-400">Bienvenido, {user?.nombre ?? '...'}</h2>
      <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-white">
        Cerrar sesión
      </button>
    </header>
  )
}
