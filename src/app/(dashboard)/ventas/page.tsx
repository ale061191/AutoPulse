import { createClient } from '@/lib/supabase/server-client'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dealerId = user?.app_metadata.dealer_id

  const { data: ventas } = await supabase
    .from('sales')
    .select('*, vehicles(*), customers(*), dealer_users!vendedor_id(*)')
    .eq('dealer_id', dealerId)
    .order('fecha', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Ventas</h1>
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
            {ventas?.map(v => (
              <tr key={v.id} className="border-b border-[#222] hover:bg-[#222]">
                <td className="p-3 text-white">{((v as any).vehicles?.marca ?? '') + ' ' + ((v as any).vehicles?.modelo ?? '')}</td>
                <td className="p-3 text-white">{(v as any).customers?.nombre ?? ''}</td>
                <td className="p-3 text-white">{(v as any).dealer_users?.nombre ?? ''}</td>
                <td className="p-3 text-white">${Number(v.precio_venta).toLocaleString()}</td>
                <td className="p-3 text-green-400">${Number(v.ganancia).toLocaleString()}</td>
                <td className="p-3 text-gray-400">{new Date(v.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!ventas || ventas.length === 0) && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No hay ventas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
