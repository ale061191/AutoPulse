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
