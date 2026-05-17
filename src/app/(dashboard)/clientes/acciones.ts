'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function crearCliente(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('customers').insert({
    dealer_id: user.app_metadata.dealer_id,
    nombre: formData.get('nombre') as string,
    telefono: formData.get('telefono') as string,
    email: formData.get('email') as string,
    tipo: formData.get('tipo') as string,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
}
