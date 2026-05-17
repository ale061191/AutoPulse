export interface Dealer {
  id: string
  nombre: string
  pais: string
  moneda: string
  tasa_bs: number
  created_at: string
  updated_at?: string
}

export interface DealerUser {
  id: string
  dealer_id: string
  nombre: string
  email: string
  rol: 'admin' | 'vendedor'
  created_at: string
}

export interface Vehicle {
  id: string
  dealer_id: string
  marca: string
  modelo: string
  ano: number
  tipo: 'nuevo' | 'usado'
  vin?: string
  precio_venta: number
  costo: number
  estado: 'disponible' | 'vendido' | 'reservado'
  fotos: string[]
  created_at: string
  updated_at?: string
}

export interface Sale {
  id: string
  dealer_id: string
  vehicle_id: string
  vendedor_id: string
  cliente_id: string
  precio_venta: number
  ganancia: number
  fecha: string
}

export interface Customer {
  id: string
  dealer_id: string
  nombre: string
  telefono?: string
  email?: string
  tipo: 'cliente' | 'prospecto'
  created_at: string
  updated_at?: string
}

export interface Appointment {
  id: string
  dealer_id: string
  cliente_id: string
  vendedor_id: string
  fecha_hora: string
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada'
  notas?: string
  created_at: string
  updated_at?: string
}
