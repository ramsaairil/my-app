-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION FOR 3D CARGO OPTIMIZATION SYSTEM
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Database Pengguna / Login)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CARGO TABLE (Database Barang & Kargo 3D)
CREATE TABLE IF NOT EXISTS public.cargos (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  shape VARCHAR(50) DEFAULT 'Balok', -- 'Kubus' / 'Balok'
  category VARCHAR(100) DEFAULT 'Box', -- 'Pallet', 'Box', 'Peti'
  quantity INTEGER NOT NULL DEFAULT 1,
  dimension VARCHAR(100) NOT NULL, -- e.g. "40x30x30 cm"
  length_cm INTEGER NOT NULL DEFAULT 40,
  width_cm INTEGER NOT NULL DEFAULT 30,
  height_cm INTEGER NOT NULL DEFAULT 30,
  volume_m3 NUMERIC(10, 3) NOT NULL DEFAULT 0.036,
  color_code VARCHAR(10) DEFAULT '#3B82F6',
  status VARCHAR(50) DEFAULT 'Unassigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VEHICLES TABLE (Database Armada Kendaraan 3D)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_name VARCHAR(255) NOT NULL,
  length_cm INTEGER NOT NULL DEFAULT 450,
  width_cm INTEGER NOT NULL DEFAULT 200,
  height_cm INTEGER NOT NULL DEFAULT 200,
  max_volume_m3 NUMERIC(10, 2) NOT NULL DEFAULT 18.00,
  max_weight_kg NUMERIC(10, 2) DEFAULT 5000.00,
  status VARCHAR(50) DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CARGO SLOTS & 3D PLACEMENT TABLE (Penataan Koordinat 3D Kargo)
CREATE TABLE IF NOT EXISTS public.cargo_slots (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) REFERENCES public.vehicles(id) ON DELETE CASCADE,
  cargo_id VARCHAR(50) REFERENCES public.cargos(id) ON DELETE SET NULL,
  pos_x_cm INTEGER DEFAULT 0,
  pos_y_cm INTEGER DEFAULT 0,
  pos_z_cm INTEGER DEFAULT 0,
  oriented_length_cm INTEGER,
  oriented_width_cm INTEGER,
  oriented_height_cm INTEGER,
  rotation_state INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SEED INITIAL DEMO DATA
-- Seed User Admin & Operator
INSERT INTO public.users (username, email, password)
VALUES 
  ('admin', 'admin@logistic.com', 'admin123'),
  ('operator', 'operator@logistic.com', 'operator123')
ON CONFLICT (email) DO NOTHING;

-- Seed Armada Kendaraan (Fokus Dimensi 3D)
INSERT INTO public.vehicles (id, vehicle_name, length_cm, width_cm, height_cm, max_volume_m3, status)
VALUES 
  ('TRC-204', 'Gran Max Pick Up', 300, 180, 180, 9.72, 'Available'),
  ('TRC-205', 'CDD Box Standard', 450, 200, 200, 18.00, 'Available'),
  ('TRC-206', 'CDD Long Box', 600, 220, 220, 29.04, 'Available')
ON CONFLICT (id) DO NOTHING;

-- Seed Data Barang (Fokus Dimensi 3D)
INSERT INTO public.cargos (id, name, shape, category, quantity, dimension, length_cm, width_cm, height_cm, volume_m3, color_code, status)
VALUES 
  ('CRG-01', 'Kardus Elektronik A', 'Balok', 'Box', 20, '40x30x30 cm', 40, 30, 30, 0.036, '#3B82F6', 'Unassigned'),
  ('CRG-02', 'Kardus Tekstil B', 'Balok', 'Box', 15, '50x40x40 cm', 50, 40, 40, 0.080, '#10B981', 'Unassigned'),
  ('CRG-03', 'Kardus Sparepart C', 'Balok', 'Box', 8, '60x50x50 cm', 60, 50, 50, 0.150, '#F59E0B', 'Unassigned')
ON CONFLICT (id) DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access to cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargos" ON public.cargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargos" ON public.cargos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to cargos" ON public.cargos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access to vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to vehicles" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to vehicles" ON public.vehicles FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access to cargo_slots" ON public.cargo_slots FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargo_slots" ON public.cargo_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargo_slots" ON public.cargo_slots FOR UPDATE USING (true);
