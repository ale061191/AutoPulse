'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="bg-[#2e3034] p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl text-white font-bold mb-6">AutoPulse</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]"
            required
          />
          <input
            type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full p-3 rounded-lg bg-[#9C5F43] text-white font-semibold hover:bg-[#b8775a] disabled:opacity-50">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          ¿No tienes cuenta? <a href="/auth/signup" className="text-[#9C5F43]">Regístrate</a>
        </p>
      </div>
    </div>
  )
}
