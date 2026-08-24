/**
 * predictionData.ts
 * 
 * Modul penyimpanan dan pengambilan data simulasi sebagai acuan prediksi sistem.
 * Data disimpan ke Supabase tabel `simulation_results` (primer) atau localStorage (fallback).
 * 
 * PENTING: Modul ini TIDAK mengubah alur simulasi, optimasi, atau tabel database existing.
 *          Hanya menambahkan mekanisme penyimpanan data baru secara terpisah.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import { SimulationRunSummary, SimulationTrialResult } from "./simulation/types";

// ─── TYPES ──────────────────────────────────────────────────

export interface PredictionDataRecord {
  id: string;                     // runId
  user_id?: string;
  seed: number;
  total_trials: number;
  successful_trials: number;
  partial_trials: number;
  failed_trials: number;
  average_utilization_pct: number;
  best_utilization_pct: number;
  best_score: number;
  best_trial_data: object | null;   // JSONB — best trial full data
  ga_config: object | null;         // JSONB — GA parameter config
  all_trials_summary: object | null; // JSONB — ringkasan semua trials
  created_at: string;
}

// GA Configuration default values (matching simulationRunner.ts)
const DEFAULT_GA_CONFIG = {
  populationSize: 20,
  generationsCount: 5,
  crossoverRate: 0.85,
  mutationRate: 0.15,
  elitismCount: 2,
  tournamentSize: 3,
};

// ─── HELPER ─────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

/**
 * Membuat ringkasan trial tanpa data packedBoxes besar
 * (untuk efisiensi penyimpanan — packedBoxes bisa ribuan record)
 */
function createTrialSummary(trial: SimulationTrialResult): object {
  return {
    simulationNumber: trial.simulationNumber,
    combination: trial.combination,
    totalRequestedItems: trial.totalRequestedItems,
    totalPlacedItems: trial.totalPlacedItems,
    totalUnplacedItems: trial.totalUnplacedItems,
    cargoVolumeM3: trial.cargoVolumeM3,
    vehicleCapacityM3: trial.vehicleCapacityM3,
    vehicleName: trial.vehicleName,
    vehicleId: trial.vehicleId,
    utilizationPercent: trial.utilizationPercent,
    placementRatePercent: trial.placementRatePercent,
    score: trial.score,
    status: trial.status,
  };
}

/**
 * Membuat full best trial data termasuk combination dan vehicle info
 */
function createBestTrialData(trial: SimulationTrialResult | null): object | null {
  if (!trial) return null;
  return {
    simulationNumber: trial.simulationNumber,
    combination: trial.combination,
    totalRequestedItems: trial.totalRequestedItems,
    totalPlacedItems: trial.totalPlacedItems,
    totalUnplacedItems: trial.totalUnplacedItems,
    cargoVolumeM3: trial.cargoVolumeM3,
    vehicleCapacityM3: trial.vehicleCapacityM3,
    vehicleName: trial.vehicleName,
    vehicleId: trial.vehicleId,
    utilizationPercent: trial.utilizationPercent,
    placementRatePercent: trial.placementRatePercent,
    score: trial.score,
    status: trial.status,
    // Simpan packedBoxes dari best trial saja (acuan prediksi paling penting)
    packedBoxesCount: trial.optimizationResult?.packedBoxes?.length ?? 0,
  };
}

// ─── SAVE ───────────────────────────────────────────────────

/**
 * Simpan data hasil simulasi ke database sebagai acuan prediksi.
 * Menggunakan Supabase (primer) atau localStorage (fallback).
 * 
 * @param summary - Hasil SimulationRunSummary dari simulationRunner
 * @returns { success: boolean, message: string }
 */
export async function saveSimulationForPrediction(
  summary: SimulationRunSummary
): Promise<{ success: boolean; message: string }> {
  const record: PredictionDataRecord = {
    id: summary.runId,
    seed: summary.seed,
    total_trials: summary.totalTrials,
    successful_trials: summary.successfulTrials,
    partial_trials: summary.partialTrials,
    failed_trials: summary.failedTrials,
    average_utilization_pct: summary.averageUtilizationPercent,
    best_utilization_pct: summary.bestUtilizationPercent,
    best_score: summary.bestScore,
    best_trial_data: createBestTrialData(summary.bestTrial),
    ga_config: { ...DEFAULT_GA_CONFIG, seed: summary.seed },
    all_trials_summary: summary.trials.map(createTrialSummary),
    created_at: summary.createdAt || new Date().toISOString(),
  };

  // Attempt Supabase save
  if (isSupabaseConfigured && supabase) {
    try {
      const userId = await getCurrentUserId();
      const dbRecord = { ...record, user_id: userId };

      // Cek duplikasi — jika runId sudah ada, skip
      const { data: existing } = await supabase
        .from("simulation_results")
        .select("id")
        .eq("id", record.id)
        .maybeSingle();

      if (existing) {
        console.log(`ℹ️ [Prediction Data] Data simulasi '${record.id}' sudah tersimpan sebelumnya. Tidak disimpan ulang.`);
        return { success: true, message: "Data simulasi sudah tersimpan sebelumnya (tidak duplikat)." };
      }

      const { error } = await supabase.from("simulation_results").insert(dbRecord);

      if (error) {
        console.error("❌ [Prediction Data] Gagal menyimpan ke Supabase:", error.message);
        // Fallback ke localStorage
        return saveToLocalStorage(record);
      }

      console.log(`✅ [Prediction Data] Data simulasi '${record.id}' BERHASIL tersimpan ke Supabase PostgreSQL sebagai acuan prediksi.`);
      return { success: true, message: "Data simulasi berhasil tersimpan ke database sebagai acuan prediksi sistem." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ [Prediction Data] Exception:", msg);
      // Fallback ke localStorage
      return saveToLocalStorage(record);
    }
  }

  // Fallback: localStorage
  return saveToLocalStorage(record);
}

/**
 * Fallback save ke localStorage jika Supabase tidak tersedia
 */
function saveToLocalStorage(record: PredictionDataRecord): { success: boolean; message: string } {
  try {
    const STORAGE_KEY = "PREDICTION_REFERENCE_DATA";
    const storedStr = localStorage.getItem(STORAGE_KEY);
    const storedData: PredictionDataRecord[] = storedStr ? JSON.parse(storedStr) : [];

    // Cek duplikasi via runId
    if (storedData.some((d) => d.id === record.id)) {
      console.log(`ℹ️ [Prediction Data] Data '${record.id}' sudah ada di localStorage. Tidak disimpan ulang.`);
      return { success: true, message: "Data simulasi sudah tersimpan sebelumnya (localStorage)." };
    }

    storedData.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

    console.log(`✅ [Prediction Data] Data '${record.id}' tersimpan ke localStorage sebagai acuan prediksi (fallback).`);
    return { success: true, message: "Data simulasi tersimpan ke penyimpanan lokal sebagai acuan prediksi sistem." };
  } catch (e) {
    console.error("❌ [Prediction Data] Gagal menyimpan ke localStorage:", e);
    return { success: false, message: "Gagal menyimpan data simulasi." };
  }
}

// ─── FETCH ──────────────────────────────────────────────────

/**
 * Ambil riwayat dataset simulasi yang tersimpan sebagai acuan prediksi.
 * Mengambil dari Supabase (primer) atau localStorage (fallback).
 */
export async function fetchPredictionDatasets(): Promise<PredictionDataRecord[]> {
  // Attempt Supabase fetch
  if (isSupabaseConfigured && supabase) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return fetchFromLocalStorage();

      const { data, error } = await supabase
        .from("simulation_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("⚠️ [Prediction Data] Gagal mengambil dari Supabase:", error.message);
        return fetchFromLocalStorage();
      }

      console.log(`✅ [Prediction Data] Berhasil mengambil ${data?.length || 0} dataset prediksi dari Supabase.`);
      return (data || []) as PredictionDataRecord[];
    } catch (err: unknown) {
      console.warn("⚠️ [Prediction Data] Exception saat fetch:", err);
      return fetchFromLocalStorage();
    }
  }

  return fetchFromLocalStorage();
}

/**
 * Fallback fetch dari localStorage
 */
function fetchFromLocalStorage(): PredictionDataRecord[] {
  try {
    const STORAGE_KEY = "PREDICTION_REFERENCE_DATA";
    const storedStr = localStorage.getItem(STORAGE_KEY);
    return storedStr ? JSON.parse(storedStr) : [];
  } catch {
    return [];
  }
}
