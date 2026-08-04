-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION FOR CARGO LOGISTICS SYSTEM
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CARGO TABLE (Database Barang & Kargo)
CREATE TABLE IF NOT EXISTS public.cargos (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shape VARCHAR(50) DEFAULT 'Balok', -- 'Kubus' / 'Balok'
  category VARCHAR(100) DEFAULT 'Pallet', -- 'Pallet', 'Box', 'Peti'
  priority VARCHAR(50) DEFAULT 'Standard', -- 'Standard', 'Express', 'Same day'
  quantity INTEGER NOT NULL DEFAULT 1,
  dimension VARCHAR(100) NOT NULL, -- e.g. "1.2x0.8x1.4 m"
  volume_m3 NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  weight_kg NUMERIC(10, 2) DEFAULT 0.00,
  handling_method VARCHAR(100) DEFAULT 'Forklift', -- 'Forklift', 'Manual', 'Pickup'
  status VARCHAR(50) DEFAULT 'Unassigned', -- 'Unassigned', 'Loaded', 'In Transit', 'Delivered'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRUCKS / FLEET TABLE (Database Armada Truk)
CREATE TABLE IF NOT EXISTS public.trucks (
  id VARCHAR(50) PRIMARY KEY,
  truck_name VARCHAR(255) NOT NULL,
  plate_number VARCHAR(50) NOT NULL UNIQUE,
  truck_type VARCHAR(100) DEFAULT 'Box Truck', -- 'Box Truck', 'Trailer', 'Wingbox'
  driver_name VARCHAR(255) DEFAULT 'TBA',
  driver_phone VARCHAR(50) DEFAULT '-',
  max_volume_m3 NUMERIC(10, 2) NOT NULL DEFAULT 67.70,
  max_weight_kg NUMERIC(10, 2) DEFAULT 15000.00,
  status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'Loading', 'In Transit', 'Maintenance'
  current_dock VARCHAR(50) DEFAULT 'Dock #1',
  route_origin VARCHAR(100) DEFAULT 'Jakarta',
  route_destination VARCHAR(100) DEFAULT 'Surabaya',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CARGO SLOTS & PLACEMENT TABLE (Penataan & Slot 3D Kargo)
CREATE TABLE IF NOT EXISTS public.cargo_slots (
  id VARCHAR(50) PRIMARY KEY, -- e.g. "TRC-204_A1"
  truck_id VARCHAR(50) REFERENCES public.trucks(id) ON DELETE CASCADE,
  slot_id VARCHAR(20) NOT NULL, -- e.g. "A1", "A2", "B1"
  slot_row VARCHAR(10) NOT NULL, -- "A", "B", "C"
  slot_col INTEGER NOT NULL, -- 1, 2, 3, 4, 5, 6
  occupied BOOLEAN DEFAULT FALSE,
  cargo_id VARCHAR(50) REFERENCES public.cargos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVITY LOGS TABLE (Log Aktivitas Muat)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id VARCHAR(50) REFERENCES public.trucks(id) ON DELETE CASCADE,
  log_time TIMESTAMPTZ DEFAULT NOW(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SEED INITIAL DEMO DATA
INSERT INTO public.trucks (id, truck_name, plate_number, truck_type, driver_name, max_volume_m3, status, current_dock)
VALUES 
  ('TRC-204', 'Wingbox TRC-204', 'B 9821 UXR', 'Wingbox', 'Marcus Lee', 67.70, 'Loading', 'Dock #3'),
  ('TRC-205', 'Box Truck TRC-205', 'B 9102 KLS', 'Box Truck', 'Ahmad Rizal', 45.00, 'Available', 'Dock #1'),
  ('TRC-206', 'Trailer Heavy TRC-206', 'B 8871 PZX', 'Trailer', 'Siti Rahma', 80.00, 'Available', 'Dock #2')
ON CONFLICT (id) DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY (RLS) & READ POLICIES
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargos" ON public.cargos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargos" ON public.cargos FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to cargos" ON public.cargos FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access to trucks" ON public.trucks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to trucks" ON public.trucks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to trucks" ON public.trucks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access to trucks" ON public.trucks FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access to cargo_slots" ON public.cargo_slots FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to cargo_slots" ON public.cargo_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to cargo_slots" ON public.cargo_slots FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access to activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
