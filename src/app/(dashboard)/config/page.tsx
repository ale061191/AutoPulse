import { createClient } from '@/lib/supabase/server-client'
import { updateDealerConfig } from './acciones'

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
