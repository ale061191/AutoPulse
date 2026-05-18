export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          cliente_id: string
          created_at: string | null
          dealer_id: string
          estado: string
          fecha_hora: string
          id: string
          notas: string | null
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          dealer_id: string
          estado?: string
          fecha_hora: string
          id?: string
          notas?: string | null
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          dealer_id?: string
          estado?: string
          fecha_hora?: string
          id?: string
          notas?: string | null
          updated_at?: string | null
          vendedor_id?: string
        }
      }
      customers: {
        Row: {
          created_at: string | null
          dealer_id: string
          email: string | null
          id: string
          nombre: string
          telefono: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
      }
      dealer_users: {
        Row: {
          created_at: string | null
          dealer_id: string
          email: string
          id: string
          nombre: string
          rol: string
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          email: string
          id: string
          nombre: string
          rol?: string
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          email?: string
          id?: string
          nombre?: string
          rol?: string
        }
      }
      dealers: {
        Row: {
          created_at: string | null
          id: string
          moneda: string | null
          nombre: string
          pais: string | null
          tasa_bs: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moneda?: string | null
          nombre: string
          pais?: string | null
          tasa_bs?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moneda?: string | null
          nombre?: string
          pais?: string | null
          tasa_bs?: number | null
        }
      }
      sales: {
        Row: {
          cliente_id: string
          dealer_id: string
          fecha: string | null
          ganancia: number
          id: string
          precio_venta: number
          vehicle_id: string
          vendedor_id: string
        }
        Insert: {
          cliente_id: string
          dealer_id: string
          fecha?: string | null
          ganancia?: number
          id?: string
          precio_venta: number
          vehicle_id: string
          vendedor_id: string
        }
        Update: {
          cliente_id?: string
          dealer_id?: string
          fecha?: string | null
          ganancia?: number
          id?: string
          precio_venta?: number
          vehicle_id?: string
          vendedor_id?: string
        }
      }
      vehicles: {
        Row: {
          ano: number
          costo: number | null
          created_at: string | null
          dealer_id: string
          estado: string
          fotos: string[] | null
          id: string
          marca: string
          modelo: string
          precio_venta: number
          tipo: string
          updated_at: string | null
          vin: string | null
        }
        Insert: {
          ano: number
          costo?: number | null
          created_at?: string | null
          dealer_id: string
          estado?: string
          fotos?: string[] | null
          id?: string
          marca: string
          modelo: string
          precio_venta: number
          tipo: string
          updated_at?: string | null
          vin?: string | null
        }
        Update: {
          ano?: number
          costo?: number | null
          created_at?: string | null
          dealer_id?: string
          estado?: string
          fotos?: string[] | null
          id?: string
          marca?: string
          modelo?: string
          precio_venta?: number
          tipo?: string
          updated_at?: string | null
          vin?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Dealer = Database['public']['Tables']['dealers']['Row']
export type DealerUser = Database['public']['Tables']['dealer_users']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
