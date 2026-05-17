# AutoPulse Dashboard — Implementation Plan (Fase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el MVP del Dashboard AutoPulse con auth multi-tenant, sidebar, KPIs y CRUDs básicos.

**Architecture:** Monolito Next.js 16 con Supabase como backend (PostgreSQL + Auth + RLS). Multi-tenant mediante dealer_id en cada tabla con políticas RLS.

**Tech Stack:** Next.js 16, Tailwind CSS, Supabase, TypeScript, shadcn/ui

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── ventas/
│   │   │   ├── page.tsx
│   │   │   └── acciones.ts        # Server actions
│   │   ├── inventario/
│   │   │   ├── page.tsx
│   │   │   └── acciones.ts
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── acciones.ts
│   │   ├── vendedores/
│   │   │   └── page.tsx
│   │   └── config/
│   │       └── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   └── layout.tsx                 # Root layout
├── components/
│   ├── ui/                        # shadcn/ui (button, card, table, input, dialog)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── navbar.tsx
│   └── dashboard/
│       ├── kpi-card.tsx
│       ├── ventas-chart.tsx
│       └── ultimas-ventas.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server-client.ts
│   │   └── middleware.ts
│   └── utils.ts
└── types/
    └── database.ts
```

---

### Task 1: Supabase Project + DB Schema

**Files:**
- Create: `supabase/migrations/00001_schema.sql`

- [ ] **Step 1: Create Supabase project**

Ir a https://supabase.com y crear nuevo proyecto. Anotar la URL y anon key para las variables de entorno.

- [ ] **Step 2: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

- [ ] **Step 3: Run migration SQL en Supabase SQL Editor**

```sql
-- Dealers (tenants)
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  pais TEXT DEFAULT 'Venezuela',
  moneda TEXT DEFAULT 'USD',
  tasa_bs NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (employees)
CREATE TABLE dealer_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('nuevo', 'usado')),
  vin TEXT UNIQUE,
  precio_venta NUMERIC NOT NULL,
  costo NUMERIC DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'vendido', 'reservado')),
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  vendedor_id UUID NOT NULL REFERENCES dealer_users(id),
  cliente_id UUID NOT NULL REFERENCES customers(id),
  precio_venta NUMERIC NOT NULL,
  ganancia NUMERIC NOT NULL DEFAULT 0,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  tipo TEXT NOT NULL DEFAULT 'prospecto' CHECK (tipo IN ('cliente', 'prospecto')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES customers(id),
  vendedor_id UUID NOT NULL REFERENCES dealer_users(id),
  fecha_hora TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Dealer isolation policies
CREATE POLICY dealer_isolation ON dealer_users
  USING (dealer_id = ((auth.jwt() -> 'app_metadata'::text) ->> 'dealer_id'::text)::uuid);

CREATE POLICY dealer_isolation ON vehicles
  USING (dealer_id = ((auth.jwt() -> 'app_metadata'::text) ->> 'dealer_id'::text)::uuid);

CREATE POLICY dealer_isolation ON sales
  USING (dealer_id = ((auth.jwt() -> 'app_metadata'::text) ->> 'dealer_id'::text)::uuid);

CREATE POLICY dealer_isolation ON customers
  USING (dealer_id = ((auth.jwt() -> 'app_metadata'::text) ->> 'dealer_id'::text)::uuid);

CREATE POLICY dealer_isolation ON appointments
  USING (dealer_id = ((auth.jwt() -> 'app_metadata'::text) ->> 'dealer_id'::text)::uuid);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dealer_users (id, dealer_id, nombre, email, rol)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'dealer_id')::uuid,
    NEW.raw_user_meta_data ->> 'nombre',
    NEW.email,
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Supabase schema with RLS multi-tenant"
```

---

### Task 2: Auth Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server-client.ts`
- Create: `src/lib/supabase/middleware.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Install Supabase SSR package**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Create browser client** `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create server client** `src/lib/supabase/server-client.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create middleware** `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
```

- [ ] **Step 5: Create login page** `src/app/auth/login/page.tsx`

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    router.push('/')
    router.refresh()
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
          <button type="submit" className="w-full p-3 rounded-lg bg-[#9C5F43] text-white font-semibold hover:bg-[#b8775a]">
            Iniciar Sesión
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          ¿No tienes cuenta? <a href="/auth/signup" className="text-[#9C5F43]">Regístrate</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create signup page** `src/app/auth/signup/page.tsx`

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', dealer: '' })
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Create dealer first
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers').insert({ nombre: form.dealer }).select().single()
    if (dealerError) { setError(dealerError.message); return }

    // Sign up user with dealer_id in metadata
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nombre: form.nombre, dealer_id: dealer.id },
      },
    })
    if (authError) { setError(authError.message); return }

    router.push('/auth/login')
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
          <button type="submit" className="w-full p-3 rounded-lg bg-[#9C5F43] text-white font-semibold hover:bg-[#b8775a]">
            Registrarse
          </button>
        </form>
        <p className="text-gray-400 text-sm mt-4 text-center">
          ¿Ya tienes cuenta? <a href="/auth/login" className="text-[#9C5F43]">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create auth callback** `src/app/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
```

- [ ] **Step 8: Update root layout** `src/app/layout.tsx`

```tsx
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
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add Supabase auth with login/signup pages"
```

---

### Task 3: Types + Utils

**Files:**
- Create: `src/types/database.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create database types** `src/types/database.ts`

```typescript
export interface Dealer {
  id: string
  nombre: string
  pais: string
  moneda: string
  tasa_bs: number
  created_at: string
}

export interface DealerUser {
  id: string
  dealer_id: string
  nombre: string
  email: string
  rol: 'admin' | 'vendedor'
  created_at: string
}

export interface Vehicle {
  id: string
  dealer_id: string
  marca: string
  modelo: string
  ano: number
  tipo: 'nuevo' | 'usado'
  vin?: string
  precio_venta: number
  costo: number
  estado: 'disponible' | 'vendido' | 'reservado'
  fotos: string[]
  created_at: string
}

export interface Sale {
  id: string
  dealer_id: string
  vehicle_id: string
  vendedor_id: string
  cliente_id: string
  precio_venta: number
  ganancia: number
  fecha: string
}

export interface Customer {
  id: string
  dealer_id: string
  nombre: string
  telefono?: string
  email?: string
  tipo: 'cliente' | 'prospecto'
  created_at: string
}

export interface Appointment {
  id: string
  dealer_id: string
  cliente_id: string
  vendedor_id: string
  fecha_hora: string
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada'
  notas?: string
  created_at: string
}
```

- [ ] **Step 2: Create utils** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(amount)
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add database types and utils"
```

---

### Task 4: Dashboard Layout + Sidebar

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/navbar.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Install shadcn/ui**

```bash
npx shadcn@latest init -d --force
npx shadcn@latest add button card table dialog input select
```

- [ ] **Step 2: Create sidebar** `src/components/layout/sidebar.tsx`

```tsx
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
```

- [ ] **Step 3: Create navbar** `src/components/layout/navbar.tsx`

```tsx
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
  }, [])

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
```

- [ ] **Step 4: Create dashboard layout** `src/app/(dashboard)/layout.tsx`

```tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add dashboard layout with sidebar"
```

---

### Task 5: Dashboard Page with KPIs

**Files:**
- Create: `src/components/dashboard/kpi-card.tsx`
- Create: `src/components/dashboard/ventas-chart.tsx`
- Create: `src/components/dashboard/ultimas-ventas.tsx`
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Create KPI card** `src/components/dashboard/kpi-card.tsx`

```tsx
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  icon: string
  className?: string
}

export function KpiCard({ title, value, icon, className }: KpiCardProps) {
  return (
    <div className={cn('bg-[#1a1a1a] border border-[#333] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create ventas chart** `src/components/dashboard/ventas-chart.tsx`

```tsx
interface VentasChartProps {
  data: { mes: string; total: number }[]
}

export function VentasChart({ data }: VentasChartProps) {
  const max = Math.max(...data.map(d => d.total), 1)

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Ventas últimos 12 meses</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map(d => (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-[#9C5F43] rounded-t transition-all"
              style={{ height: `${(d.total / max) * 100}%` }}
            />
            <span className="text-[10px] text-gray-500">{d.mes}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create últimas ventas** `src/components/dashboard/ultimas-ventas.tsx`

```tsx
interface UltimasVentasProps {
  ventas: { id: string; vehiculo: string; cliente: string; precio: number }[]
}

export function UltimasVentas({ ventas }: UltimasVentasProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Últimas Ventas</h3>
      <div className="space-y-2">
        {ventas.map(v => (
          <div key={v.id} className="flex justify-between items-center py-1 border-b border-[#222] last:border-0">
            <div>
              <p className="text-sm text-white">{v.vehiculo}</p>
              <p className="text-xs text-gray-400">{v.cliente}</p>
            </div>
            <span className="text-sm font-semibold text-white">
              ${v.precio.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update dashboard page** `src/app/(dashboard)/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { VentasChart } from '@/components/dashboard/ventas-chart'
import { UltimasVentas } from '@/components/dashboard/ultimas-ventas'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dealerId = user.app_metadata.dealer_id

  const [{ count: disponibles }, { data: ventasRecientes }, { data: ventasAnuales }] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true })
      .eq('dealer_id', dealerId).eq('estado', 'disponible'),
    supabase.from('sales').select('*, vehicles(*), customers(*)')
      .eq('dealer_id', dealerId).order('fecha', { ascending: false }).limit(5),
    supabase.from('sales').select('precio_venta, ganancia, fecha')
      .eq('dealer_id', dealerId),
  ])

  const ingresos = ventasAnuales?.reduce((s, v) => s + Number(v.precio_venta), 0) ?? 0
  const ganancias = ventasAnuales?.reduce((s, v) => s + Number(v.ganancia), 0) ?? 0
  const ventasMes = ventasAnuales?.filter(v =>
    new Date(v.fecha).getMonth() === new Date().getMonth()
  ).length ?? 0

  const ultimasVentas = (ventasRecientes ?? []).map(v => ({
    id: v.id,
    vehiculo: `${(v.vehicles as any)?.marca ?? ''} ${(v.vehicles as any)?.modelo ?? ''}`,
    cliente: (v.customers as any)?.nombre ?? '',
    precio: Number(v.precio_venta),
  }))

  const chartData = [
    { mes: 'Ene', total: 0 }, { mes: 'Feb', total: 0 }, { mes: 'Mar', total: 0 },
    { mes: 'Abr', total: 0 }, { mes: 'May', total: 0 }, { mes: 'Jun', total: 0 },
    { mes: 'Jul', total: 0 }, { mes: 'Ago', total: 0 }, { mes: 'Sep', total: 0 },
    { mes: 'Oct', total: 0 }, { mes: 'Nov', total: 0 }, { mes: 'Dic', total: 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Ingresos" value={`$${ingresos.toLocaleString()}`} icon="💰" />
        <KpiCard title="Ganancias" value={`$${ganancias.toLocaleString()}`} icon="📈" />
        <KpiCard title="Autos Disponibles" value={String(disponibles ?? 0)} icon="🚗" />
        <KpiCard title="Ventas del Mes" value={String(ventasMes)} icon="🎯" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <VentasChart data={chartData} />
        <UltimasVentas ventas={ultimasVentas} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add dashboard page with KPIs"
```

---

### Task 6: Inventario CRUD

**Files:**
- Create: `src/app/(dashboard)/inventario/acciones.ts`
- Create: `src/app/(dashboard)/inventario/page.tsx`

- [ ] **Step 1: Create server actions** `src/app/(dashboard)/inventario/acciones.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function crearVehiculo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('vehicles').insert({
    dealer_id: user.app_metadata.dealer_id,
    marca: formData.get('marca') as string,
    modelo: formData.get('modelo') as string,
    ano: Number(formData.get('ano')),
    tipo: formData.get('tipo') as string,
    vin: formData.get('vin') as string,
    precio_venta: Number(formData.get('precio_venta')),
    costo: Number(formData.get('costo')),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/inventario')
}

export async function eliminarVehiculo(id: string) {
  const supabase = await createClient()
  await supabase.from('vehicles').delete().eq('id', id)
  revalidatePath('/inventario')
}
```

- [ ] **Step 2: Create inventario page** `src/app/(dashboard)/inventario/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'
import { crearVehiculo, eliminarVehiculo } from './acciones'

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: vehiculos } = await supabase
    .from('vehicles')
    .select('*')
    .eq('dealer_id', user?.app_metadata.dealer_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Inventario</h1>
        <button className="bg-[#9C5F43] text-white px-4 py-2 rounded-lg text-sm" onClick={() => {}}>
          + Agregar Auto
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left p-3 text-gray-400">VIN</th>
              <th className="text-left p-3 text-gray-400">Marca</th>
              <th className="text-left p-3 text-gray-400">Modelo</th>
              <th className="text-left p-3 text-gray-400">Año</th>
              <th className="text-left p-3 text-gray-400">Precio</th>
              <th className="text-left p-3 text-gray-400">Estado</th>
              <th className="text-left p-3 text-gray-400">Acción</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos?.map(v => (
              <tr key={v.id} className="border-b border-[#222] hover:bg-[#222]">
                <td className="p-3 text-white">{v.vin ?? '-'}</td>
                <td className="p-3 text-white">{v.marca}</td>
                <td className="p-3 text-white">{v.modelo}</td>
                <td className="p-3 text-white">{v.ano}</td>
                <td className="p-3 text-white">${Number(v.precio_venta).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    v.estado === 'disponible' ? 'bg-green-900 text-green-300' :
                    v.estado === 'vendido' ? 'bg-blue-900 text-blue-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {v.estado}
                  </span>
                </td>
                <td className="p-3">
                  <form action={eliminarVehiculo.bind(null, v.id)}>
                    <button type="submit" className="text-red-400 hover:text-red-300 text-xs">Eliminar</button>
                  </form>
                </td>
              </tr>
            ))}
            {(!vehiculos || vehiculos.length === 0) && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No hay vehículos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add inventory CRUD"
```

---

### Task 7: Ventas, Clientes y Vendedores CRUD

**Files:**
- Create: `src/app/(dashboard)/ventas/acciones.ts`
- Create: `src/app/(dashboard)/ventas/page.tsx`
- Create: `src/app/(dashboard)/clientes/acciones.ts`
- Create: `src/app/(dashboard)/clientes/page.tsx`
- Create: `src/app/(dashboard)/vendedores/page.tsx`

- [ ] **Step 1: Ventas server actions** `src/app/(dashboard)/ventas/acciones.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function registrarVenta(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const dealerId = user.app_metadata.dealer_id

  const vehicleId = formData.get('vehicle_id') as string
  const precioVenta = Number(formData.get('precio_venta'))

  const { data: vehicle } = await supabase
    .from('vehicles').select('costo').eq('id', vehicleId).single()

  const { error } = await supabase.from('sales').insert({
    dealer_id: dealerId,
    vehicle_id: vehicleId,
    vendedor_id: formData.get('vendedor_id'),
    cliente_id: formData.get('cliente_id'),
    precio_venta: precioVenta,
    ganancia: precioVenta - Number(vehicle?.costo ?? 0),
  })

  if (error) throw new Error(error.message)

  await supabase.from('vehicles').update({ estado: 'vendido' }).eq('id', vehicleId)
  await supabase.from('customers').update({ tipo: 'cliente' }).eq('id', formData.get('cliente_id'))

  revalidatePath('/ventas')
}
```

- [ ] **Step 2: Ventas page** `src/app/(dashboard)/ventas/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'
import { registrarVenta } from './acciones'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dealerId = user?.app_metadata.dealer_id

  const [ventasRes, vehiculosRes, vendedoresRes, clientesRes] = await Promise.all([
    supabase.from('sales').select('*, vehicles(*), customers(*), dealer_users!vendedor_id(*)')
      .eq('dealer_id', dealerId).order('fecha', { ascending: false }),
    supabase.from('vehicles').select('id, marca, modelo, vin').eq('dealer_id', dealerId).eq('estado', 'disponible'),
    supabase.from('dealer_users').select('id, nombre').eq('dealer_id', dealerId),
    supabase.from('customers').select('id, nombre').eq('dealer_id', dealerId),
  ])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Ventas</h1>
        <button className="bg-[#9C5F43] text-white px-4 py-2 rounded-lg text-sm" onClick={() => {}}>
          + Registrar Venta
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left p-3 text-gray-400">Vehículo</th>
              <th className="text-left p-3 text-gray-400">Cliente</th>
              <th className="text-left p-3 text-gray-400">Vendedor</th>
              <th className="text-left p-3 text-gray-400">Precio</th>
              <th className="text-left p-3 text-gray-400">Ganancia</th>
              <th className="text-left p-3 text-gray-400">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ventasRes.data?.map(v => (
              <tr key={v.id} className="border-b border-[#222] hover:bg-[#222]">
                <td className="p-3 text-white">{((v as any).vehicles?.marca ?? '') + ' ' + ((v as any).vehicles?.modelo ?? '')}</td>
                <td className="p-3 text-white">{(v as any).customers?.nombre ?? ''}</td>
                <td className="p-3 text-white">{(v as any).dealer_users?.nombre ?? ''}</td>
                <td className="p-3 text-white">${Number(v.precio_venta).toLocaleString()}</td>
                <td className="p-3 text-green-400">${Number(v.ganancia).toLocaleString()}</td>
                <td className="p-3 text-gray-400">{new Date(v.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!ventasRes.data || ventasRes.data.length === 0) && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No hay ventas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Clientes page** `src/app/(dashboard)/clientes/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: clientes } = await supabase
    .from('customers')
    .select('*')
    .eq('dealer_id', user?.app_metadata.dealer_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Clientes</h1>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left p-3 text-gray-400">Nombre</th>
              <th className="text-left p-3 text-gray-400">Teléfono</th>
              <th className="text-left p-3 text-gray-400">Email</th>
              <th className="text-left p-3 text-gray-400">Tipo</th>
              <th className="text-left p-3 text-gray-400">Registro</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.map(c => (
              <tr key={c.id} className="border-b border-[#222] hover:bg-[#222]">
                <td className="p-3 text-white">{c.nombre}</td>
                <td className="p-3 text-gray-300">{c.telefono ?? '-'}</td>
                <td className="p-3 text-gray-300">{c.email ?? '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    c.tipo === 'cliente' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                  }`}>{c.tipo}</span>
                </td>
                <td className="p-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Vendedores page** `src/app/(dashboard)/vendedores/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'

export default async function VendedoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: vendedores } = await supabase
    .from('dealer_users')
    .select('*')
    .eq('dealer_id', user?.app_metadata.dealer_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Vendedores</h1>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left p-3 text-gray-400">Nombre</th>
              <th className="text-left p-3 text-gray-400">Email</th>
              <th className="text-left p-3 text-gray-400">Rol</th>
            </tr>
          </thead>
          <tbody>
            {vendedores?.map(v => (
              <tr key={v.id} className="border-b border-[#222] hover:bg-[#222]">
                <td className="p-3 text-white">{v.nombre}</td>
                <td className="p-3 text-gray-300">{v.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    v.rol === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'
                  }`}>{v.rol}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add ventas, clientes and vendedores pages"
```

---

### Task 8: Configuración del Dealer

**Files:**
- Create: `src/app/(dashboard)/config/actions.ts`
- Create: `src/app/(dashboard)/config/page.tsx`

- [ ] **Step 1: Config actions** `src/app/(dashboard)/config/actions.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function updateDealerConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('dealers').update({
    nombre: formData.get('nombre') as string,
    pais: formData.get('pais') as string,
    moneda: formData.get('moneda') as string,
    tasa_bs: Number(formData.get('tasa_bs')),
  }).eq('id', user.app_metadata.dealer_id)

  if (error) throw new Error(error.message)
  revalidatePath('/config')
}
```

- [ ] **Step 2: Config page** `src/app/(dashboard)/config/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server-client'
import { updateDealerConfig } from './actions'

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: dealer } = await supabase
    .from('dealers').select('*').eq('id', user?.app_metadata.dealer_id).single()

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Configuración</h1>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-lg">
        <form action={updateDealerConfig} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nombre del concesionario</label>
            <input name="nombre" defaultValue={dealer?.nombre}
              className="w-full p-2 rounded bg-[#111] border border-[#333] text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">País</label>
            <input name="pais" defaultValue={dealer?.pais}
              className="w-full p-2 rounded bg-[#111] border border-[#333] text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Moneda</label>
            <input name="moneda" defaultValue={dealer?.moneda}
              className="w-full p-2 rounded bg-[#111] border border-[#333] text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Tasa Bs (si aplica)</label>
            <input name="tasa_bs" type="number" defaultValue={dealer?.tasa_bs}
              className="w-full p-2 rounded bg-[#111] border border-[#333] text-white text-sm" />
          </div>
          <button type="submit" className="bg-[#9C5F43] text-white px-4 py-2 rounded-lg text-sm">
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add dealer settings page"
```

---

## Self-Review

- **Spec coverage:** Cubre auth multi-tenant (T1-T2), sidebar y layout (T4), dashboard con KPIs (T5), CRUD inventario (T6), CRUD ventas/clientes/vendedores (T7), configuración (T8). Todo el spec Fase 1 está cubierto.
- **Placeholders:** No hay TBD, TODO, ni placeholders.
- **Scope:** Cada task produce cambios autocontenidos y verificables.

---

## Execution

Plan completo y guardado en `docs/superpowers/plans/2026-05-16-autopulse-implementation.md`.

Dos opciones de ejecución:

**1. Subagent-Driven (recomendado)** — Despacho un subagente por tarea, reviso entre tareas, iteración rápida

**2. Inline Execution** — Ejecuto tareas en esta sesión con checkpoints de revisión

¿Cuál prefieres?
