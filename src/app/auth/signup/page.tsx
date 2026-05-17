'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', dealer: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: dealer, error: dealerError } = await supabase
        .from('dealers').insert({ nombre: form.dealer }).select().single()
      if (dealerError) { setError(dealerError.message); setLoading(false); return }

      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nombre: form.nombre, dealer_id: dealer.id, rol: 'admin' },
        },
      })
      if (authError) { setError(authError.message); setLoading(false); return }

      router.push('/auth/login')
    } catch {
      setError('Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="bg-[#2e3034] p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl text-white font-bold mb-6">Crear Cuenta</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input placeholder="Nombre del concesionario" value={form.dealer}
            onChange={e => setForm(p => ({ ...p, dealer: e.target.value }))}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]" required />
          <input placeholder="Tu nombre" value={form.nombre}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]" required />
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]" required />
          <input type="password" placeholder="Contraseña" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="w-full p-3 rounded-lg bg-[#1a1a1a] text-white border border-[#444]" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full p-3 rounded-lg bg-[#9C5F43] text-white font-semibold hover:bg-[#b8775a] disabled:opacity-50">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          ¿Ya tienes cuenta? <a href="/auth/login" className="text-[#9C5F43]">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}
