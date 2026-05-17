'use server'

import { createClient } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

export async function updateDealerConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('dealers').update({
    nombre: formData.get('nombre') as string,
    pais: formData.get('pais') as string,
    moneda: formData.get('moneda') as string,
    tasa_bs: Number(formData.get('tasa_bs')),
  }).eq('id', user.app_metadata.dealer_id)

  if (error) throw new Error(error.message)
  revalidatePath('/config')
}
