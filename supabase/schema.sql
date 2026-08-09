-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION FOR 3D CARGO OPTIMIZATION SYSTEM
-- (CLEAN RESET & CONCISE 3D RESEARCH DATASET)
-- ====================================================================

-- 1. Enable UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. RESET EXISTING TABLES (Clean Re-initialization - Drop all standard & legacy tables)
DROP TABLE IF EXISTS public.cargo_slots CASCADE;
DROP TABLE IF EXISTS public.cargos CASCADE;
DROP TABLE IF EXISTS public.cargo CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.trucks CASCADE;
DROP TABLE IF EXISTS public.truck CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user CASCADE;

-- 3. USERS TABLE (Database Pengguna / Login)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CARGO TABLE (Database Barang & Kargo 3D)
CREATE TABLE public.cargos (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  shape VARCHAR(50) DEFAULT 'Balok',
  category VARCHAR(100) DEFAULT 'Box',
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

-- 5. VEHICLES TABLE (Database Armada Kendaraan 3D)
CREATE TABLE public.vehicles (
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

-- 6. CARGO SLOTS & 3D PLACEMENT TABLE (Penataan Koordinat 3D Kargo)
CREATE TABLE public.cargo_slots (
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

-- 7. SEED CONCISE RESEARCH DATASET (4 Vehicles, 4 Cargo Box Types)
-- Seed Demo Accounts
INSERT INTO public.users (username, email, password)
VALUES 
  ('admin', 'admin@logistic.com', 'admin123'),
  ('operator', 'operator@logistic.com', 'operator123');

-- Seed Armada Kendaraan 3D (4 Tipe Ringkas untuk Penelitian)
INSERT INTO public.vehicles (id, vehicle_name, length_cm, width_cm, height_cm, max_volume_m3, status)
VALUES 
  ('TRC-201', 'Gran Max Pick Up', 235, 155, 130, 4.74, 'Available'),
  ('TRC-202', 'CDD Box Standard', 450, 200, 200, 18.00, 'Available'),
  ('TRC-203', 'CDD Long Box', 600, 220, 220, 29.04, 'Available'),
  ('TRC-204', 'Fuso Box Heavy', 750, 240, 240, 43.20, 'Available');

-- Seed Data Barang 3D (4 Tipe Kardus Ringkas untuk Penelitian)
INSERT INTO public.cargos (id, name, shape, category, quantity, dimension, length_cm, width_cm, height_cm, volume_m3, color_code, status)
VALUES 
  ('CRG-01', 'Kardus Elektronik A', 'Balok', 'Box Small', 20, '40x30x30 cm', 40, 30, 30, 0.036, '#3B82F6', 'Unassigned'),
  ('CRG-02', 'Kardus Tekstil B', 'Balok', 'Box Medium', 15, '50x40x40 cm', 50, 40, 40, 0.080, '#10B981', 'Unassigned'),
  ('CRG-03', 'Kardus Sparepart C', 'Balok', 'Box Large', 8, '60x50x50 cm', 60, 50, 50, 0.150, '#F59E0B', 'Unassigned'),
  ('CRG-04', 'Box Custom Panjang', 'Balok', 'Box Long', 5, '120x40x40 cm', 120, 40, 40, 0.192, '#8B5CF6', 'Unassigned');

-- 8. GRANT ROLE PERMISSIONS FOR SUPABASE API
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cargos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vehicles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cargo_slots TO anon, authenticated, service_role;

-- 9. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_slots ENABLE ROW LEVEL SECURITY;

-- Create Policies for Users
CREATE POLICY "Allow anonymous read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to users" ON public.users FOR DELETE USING (true);

-- Create Policies for Cargos
CREATE POLICY "Allow anonymous read access to cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargos" ON public.cargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargos" ON public.cargos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to cargos" ON public.cargos FOR DELETE USING (true);

-- Create Policies for Vehicles
CREATE POLICY "Allow anonymous read access to vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to vehicles" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to vehicles" ON public.vehicles FOR DELETE USING (true);

-- Create Policies for Cargo Slots
CREATE POLICY "Allow anonymous read access to cargo_slots" ON public.cargo_slots FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargo_slots" ON public.cargo_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargo_slots" ON public.cargo_slots FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to cargo_slots" ON public.cargo_slots FOR DELETE USING (true);
