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
            {(!vendedores || vendedores.length === 0) && (
              <tr><td colSpan={3} className="p-6 text-center text-gray-500">No hay vendedores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
