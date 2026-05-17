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
