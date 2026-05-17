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
        <button className="bg-[#9C5F43] text-white px-4 py-2 rounded-lg text-sm">
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
