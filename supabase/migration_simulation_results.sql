-- ====================================================================
-- MIGRATION: Tambah tabel simulation_results untuk Acuan Prediksi Sistem
-- Tanggal: 2026-08-24
-- Catatan: Tabel ini TERPISAH dari tabel existing (users, cargos, vehicles, cargo_slots).
--          Tidak ada perubahan pada tabel atau data yang sudah ada.
-- ====================================================================

-- 1. Buat tabel simulation_results (hanya jika belum ada)
CREATE TABLE IF NOT EXISTS public.simulation_results (
  id VARCHAR(100) PRIMARY KEY,                      -- runId (e.g. "GA-SIM-20260811-1234")
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  seed INTEGER NOT NULL,
  total_trials INTEGER NOT NULL,
  successful_trials INTEGER NOT NULL DEFAULT 0,
  partial_trials INTEGER NOT NULL DEFAULT 0,
  failed_trials INTEGER NOT NULL DEFAULT 0,
  average_utilization_pct NUMERIC(5,1) DEFAULT 0,
  best_utilization_pct NUMERIC(5,1) DEFAULT 0,
  best_score NUMERIC(10,2) DEFAULT 0,
  best_trial_data JSONB,                            -- Full best trial result (combination, vehicle, metrics)
  ga_config JSONB,                                  -- GA parameters yang digunakan
  all_trials_summary JSONB,                         -- Ringkasan per trial (tanpa detail packedBoxes)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grants untuk Supabase API roles
GRANT ALL ON TABLE public.simulation_results TO anon, authenticated, service_role;

-- 3. Enable Row Level Security
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Allow read access to simulation_results"
  ON public.simulation_results FOR SELECT USING (true);

CREATE POLICY "Allow insert access to simulation_results"
  ON public.simulation_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to simulation_results"
  ON public.simulation_results FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to simulation_results"
  ON public.simulation_results FOR DELETE USING (true);
