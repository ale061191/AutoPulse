# AutoPulse — Design Doc v1

## Resumen

AutoPulse es una plataforma SaaS de análisis de ventas para concesionarios de autos (usados y 0km). Inicialmente enfocada en Venezuela, con arquitectura multi-moneda y multi-tenant preparada para expansión a LATAM, Norteamérica y Europa.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (monolito) |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Lenguaje | TypeScript |

## Arquitectura

Monolito Next.js con App Router. Misma app sirve tanto el dashboard del dealer como las APIs internas. La base de datos en Supabase maneja el multi-tenant mediante Row Level Security (RLS).

### Multi-tenant

Cada tabla tiene un campo `dealer_id`. Las políticas RLS en Supabase filtran automáticamente:

```sql
CREATE POLICY tenant_isolation ON sales
  USING (dealer_id = auth.jwt() ->> 'dealer_id');
```

El dealer_id se almacena en `user_metadata` del JWT de Supabase Auth al hacer login.

### Roles

- **admin** (dueño del concesionario) — ve todo: ventas, ganancias, vendedores, clientes
- **vendedor** — ve solo sus propias ventas y citas asignadas
- **superadmin** (nosotros, como dueños de la plataforma) — puede ver todos los dealers

## Modelo de Datos

### dealers
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| nombre | text | |
| pais | text | |
| moneda | text | VES, USD, EUR, etc. |
| tasa_bs | numeric | Tasa de cambio a Bs (si aplica) |
| created_at | timestamptz | |

### users (empleados del dealer)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | vinculado a Supabase Auth |
| dealer_id | uuid FK → dealers | |
| nombre | text | |
| email | text | |
| rol | text | admin / vendedor |

### vehicles
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| dealer_id | uuid FK → dealers | |
| marca | text | |
| modelo | text | |
| año | integer | |
| tipo | text | nuevo / usado |
| vin | text unique | |
| precio_venta | numeric | |
| costo | numeric | |
| estado | text | disponible / vendido / reservado |
| fotos | text[] | URLs de imágenes |
| created_at | timestamptz | |

### sales
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| dealer_id | uuid FK → dealers | |
| vehicle_id | uuid FK → vehicles | |
| vendedor_id | uuid FK → users | |
| cliente_id | uuid FK → customers | |
| precio_venta | numeric | |
| ganancia | numeric | precio_venta - vehicle.costo |
| fecha | timestamptz | |

### customers
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| dealer_id | uuid FK → dealers | |
| nombre | text | |
| telefono | text | |
| email | text | |
| tipo | text | cliente / prospecto |
| created_at | timestamptz | |

### appointments
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| dealer_id | uuid FK → dealers | |
| cliente_id | uuid FK → customers | |
| vendedor_id | uuid FK → users | |
| fecha_hora | timestamptz | |
| estado | text | programada / confirmada / completada / cancelada |
| notas | text | |

### Reglas de negocio
- Al registrar una venta, el vehículo pasa automáticamente a estado `vendido`
- Un customer puede ser `prospecto` (lead) y convertirse a `cliente` al comprar
- Cada vendedor ve solo sus ventas y citas (vista restringida)
- El admin del dealer lo ve todo dentro de su tenant
- El superadmin (dueño de la plataforma) puede ver todos los dealers

## UI / Secciones

### Sidebar
```
Dashboard (página principal)
├── Dashboard        — KPIs, gráficos
├── Ventas           — registro y listado de ventas
├── Inventario       — catálogo de autos
├── Clientes         — clientes + prospectos
├── Vendedores       — empleados del dealer
├── Calendario       — citas agendadas
├── Analíticas       — reportes (Fase 2)
├── WhatsApp AI      — agente IA (Fase 3)
└── Configuración    — settings del dealer
```

### Dashboard Principal
- 4 tarjetas KPI: Ingresos, Ganancias, Autos Disponibles, Ventas del mes
- Gráfico de ventas (últimos 12 meses)
- Top vendedores
- Últimas ventas (feed reciente)

### Flujo de Pantallas
- CRUD Ventas: tabla con filtros + modal de registro con búsqueda de VIN
- CRUD Inventario: tabla con filtros + subida de fotos
- CRUD Clientes: lista unificada cliente/prospecto
- CRUD Vendedores: datos básicos + comisión
- Calendario: vista mensual/semanal con citas

## Estructura del Proyecto

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx        # Sidebar layout
│   │   ├── page.tsx          # Dashboard
│   │   ├── ventas/
│   │   ├── inventario/
│   │   ├── clientes/
│   │   ├── vendedores/
│   │   ├── calendario/
│   │   └── config/
│   ├── login/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       └── ... (CRUD routes)
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, Navbar
│   └── dashboard/            # KPI cards, charts
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   ├── server-client.ts  # Server client
│   │   └── middleware.ts     # Auth middleware
│   └── utils.ts
└── types/
    └── index.ts              # DB types
```

## Fases

### Fase 1 (Actual — MVP)
- Dashboard con KPIs
- CRUD Ventas, Inventario, Clientes, Vendedores
- Auth + multi-tenant
- Configuración básica del dealer

### Fase 2
- Calendario de citas
- Analíticas y reportes exportables (Excel)

### Fase 3
- Storefront público por dealer (web + app)
- Buscador IA conversacional
- Agente WhatsApp AI (vía whapi.io)

## Diseño Visual

Tema Dark Luxury:
- Fondo: negro mate (#050505)
- Superficies: gris Oxford (#2e3034)
- Acento: verde (#0a7c4f) y cobre (#9C5F43)
- Tipografía: sistema sans-serif
- Sombras marcadas, bordes redondeados
