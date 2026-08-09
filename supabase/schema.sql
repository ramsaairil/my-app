-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION FOR 3D CARGO OPTIMIZATION SYSTEM
-- (PUBLIC.USERS PROFILE TABLE LINKED TO AUTH.USERS VIA TRIGGER)
-- ====================================================================

-- 1. Enable UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. RESET EXISTING TABLES (Clean Re-initialization)
DROP TABLE IF EXISTS public.cargo_slots CASCADE;
DROP TABLE IF EXISTS public.cargos CASCADE;
DROP TABLE IF EXISTS public.cargo CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.trucks CASCADE;
DROP TABLE IF EXISTS public.truck CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user CASCADE;

-- 3. USERS / PROFILES TABLE (Linked 1-to-1 with Supabase Auth auth.users)
-- IMPORTANT: Passwords are managed strictly by Supabase Auth (auth.users).
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
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

-- 7. POSTGRESQL TRIGGER TO AUTOMATICALLY SYNC AUTH.USERS TO PUBLIC.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. SEED CONCISE RESEARCH DATASET (4 Vehicles, 4 Cargo Box Types)
INSERT INTO public.vehicles (id, vehicle_name, length_cm, width_cm, height_cm, max_volume_m3, status)
VALUES 
  ('TRC-201', 'Gran Max Pick Up', 235, 155, 130, 4.74, 'Available'),
  ('TRC-202', 'CDD Box Standard', 450, 200, 200, 18.00, 'Available'),
  ('TRC-203', 'CDD Long Box', 600, 220, 220, 29.04, 'Available'),
  ('TRC-204', 'Fuso Box Heavy', 750, 240, 240, 43.20, 'Available')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cargos (id, name, shape, category, quantity, dimension, length_cm, width_cm, height_cm, volume_m3, color_code, status)
VALUES 
  ('CRG-01', 'Kardus Elektronik A', 'Balok', 'Box Small', 20, '40x30x30 cm', 40, 30, 30, 0.036, '#087F5B', 'Unassigned'),
  ('CRG-02', 'Kardus Tekstil B', 'Balok', 'Box Medium', 15, '50x40x40 cm', 50, 40, 40, 0.080, '#3B82F6', 'Unassigned'),
  ('CRG-03', 'Kardus Sparepart C', 'Balok', 'Box Large', 8, '60x50x50 cm', 60, 50, 50, 0.150, '#F59E0B', 'Unassigned'),
  ('CRG-04', 'Box Custom Panjang', 'Balok', 'Box Long', 5, '120x40x40 cm', 120, 40, 40, 0.192, '#8B5CF6', 'Unassigned')
ON CONFLICT (id) DO NOTHING;

-- 9. GRANT ROLE PERMISSIONS FOR SUPABASE API
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cargos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vehicles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cargo_slots TO anon, authenticated, service_role;

-- 10. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_slots ENABLE ROW LEVEL SECURITY;

-- Create Policies for Users
CREATE POLICY "Allow read access to public.users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow system insert access to public.users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update own profile in public.users" ON public.users FOR UPDATE USING (true);

-- Create Policies for Cargos
CREATE POLICY "Allow read access to cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Allow insert access to cargos" ON public.cargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to cargos" ON public.cargos FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to cargos" ON public.cargos FOR DELETE USING (true);

-- Create Policies for Vehicles
CREATE POLICY "Allow read access to vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow insert access to vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to vehicles" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to vehicles" ON public.vehicles FOR DELETE USING (true);

-- Create Policies for Cargo Slots
CREATE POLICY "Allow read access to cargo_slots" ON public.cargo_slots FOR SELECT USING (true);
CREATE POLICY "Allow insert access to cargo_slots" ON public.cargo_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to cargo_slots" ON public.cargo_slots FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to cargo_slots" ON public.cargo_slots FOR DELETE USING (true);
