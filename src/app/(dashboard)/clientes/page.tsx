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
            {(!clientes || clientes.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No hay clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
