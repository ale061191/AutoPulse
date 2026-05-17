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
