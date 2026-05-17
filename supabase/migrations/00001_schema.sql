-- Dealers (tenants)
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  pais TEXT DEFAULT 'Venezuela',
  moneda TEXT DEFAULT 'USD',
  tasa_bs NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (employees)
CREATE TABLE dealer_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  tipo TEXT NOT NULL DEFAULT 'prospecto' CHECK (tipo IN ('cliente', 'prospecto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('nuevo', 'usado')),
  vin TEXT UNIQUE,
  precio_venta NUMERIC NOT NULL,
  costo NUMERIC DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'vendido', 'reservado')),
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES dealer_users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  precio_venta NUMERIC NOT NULL,
  ganancia NUMERIC NOT NULL DEFAULT 0,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES dealer_users(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Dealer isolation policies
CREATE POLICY dealer_isolation ON dealers
  USING (id = (auth.jwt() ->> 'dealer_id')::uuid);

CREATE POLICY dealer_isolation ON dealer_users
  USING (dealer_id = (auth.jwt() ->> 'dealer_id')::uuid);

CREATE POLICY dealer_isolation ON vehicles
  USING (dealer_id = (auth.jwt() ->> 'dealer_id')::uuid);

CREATE POLICY dealer_isolation ON sales
  USING (dealer_id = (auth.jwt() ->> 'dealer_id')::uuid);

CREATE POLICY dealer_isolation ON customers
  USING (dealer_id = (auth.jwt() ->> 'dealer_id')::uuid);

CREATE POLICY dealer_isolation ON appointments
  USING (dealer_id = (auth.jwt() ->> 'dealer_id')::uuid);

-- Indexes for dashboard filtering
CREATE INDEX idx_dealer_users_dealer ON dealer_users(dealer_id);
CREATE INDEX idx_vehicles_dealer ON vehicles(dealer_id);
CREATE INDEX idx_sales_dealer ON sales(dealer_id);
CREATE INDEX idx_customers_dealer ON customers(dealer_id);
CREATE INDEX idx_appointments_dealer ON appointments(dealer_id);
CREATE INDEX idx_vehicles_dealer_estado ON vehicles(dealer_id, estado);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dealer_users (id, dealer_id, nombre, email, rol)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'dealer_id')::uuid,
    NEW.raw_user_meta_data ->> 'nombre',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'rol', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
