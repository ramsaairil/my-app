import { supabase, isSupabaseConfigured } from "./supabase";
import { CargoMasterItem, Vehicle } from "./types";

export interface CargoDbRecord {
  id: string;
  user_id?: string;
  name: string;
  shape?: string;
  category?: string;
  quantity?: number;
  dimension: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  volume_m3: number;
  color_code?: string;
  status?: string;
}

export interface TruckDbRecord {
  id: string;
  user_id?: string;
  truck_name: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  max_volume_m3: number;
  status: string;
}

// Helper: ambil user_id dari sesi aktif
async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

// ─── CARGO ───────────────────────────────────────────────

// Fetch cargo milik user yang sedang login
export async function fetchCargosFromDb(retryCount = 0): Promise<CargoDbRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] URL & Anon Key belum diisi di file .env.local! Menggunakan dataset default.");
    return [];
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("⚠️ [Supabase DB] Tidak ada sesi aktif. Kargo tidak dimuat.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("cargos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("JWT issued at future") && retryCount < 1) {
        console.warn("⚠️ [Supabase DB] JWT issued at future detected, retrying in 1.5s...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return fetchCargosFromDb(retryCount + 1);
      }

      if (error.code === "PGRST205" || error.code === "PGRST301") {
        console.warn("⚠️ [Supabase DB] Tabel 'cargos' belum dibuat di Supabase. Jalankan script SQL pada Supabase SQL Editor.");
      } else {
        console.error("❌ [Supabase DB Error] Gagal mengambil data kargo:", error.message);
      }
      return [];
    }
    console.log(`✅ [Supabase DB] Berhasil mengambil ${data?.length || 0} kargo dari PostgreSQL.`);
    return data as CargoDbRecord[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return [];
  }
}

// Upsert (Insert or Update) cargo — selalu sertakan user_id
export async function upsertCargoToDb(cargo: CargoMasterItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data kargo tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("⚠️ [Supabase DB] Tidak ada sesi aktif. Kargo tidak disimpan ke DB.");
    return false;
  }

  try {
    const record: CargoDbRecord = {
      id: cargo.id,
      user_id: userId,
      name: cargo.name,
      shape: "Balok",
      category: cargo.code,
      quantity: 1,
      dimension: `${cargo.lengthCm}x${cargo.widthCm}x${cargo.heightCm} cm`,
      length_cm: cargo.lengthCm,
      width_cm: cargo.widthCm,
      height_cm: cargo.heightCm,
      volume_m3: cargo.volumeM3,
      color_code: cargo.color,
      status: "Unassigned"
    };

    const { error } = await supabase.from("cargos").upsert(record);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menyimpan kargo ${cargo.id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Kargo ${cargo.id} (${cargo.name}) BERHASIL tersimpan ke PostgreSQL Supabase!`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return false;
  }
}

// Delete cargo — Supabase RLS memastikan hanya pemilik yang bisa hapus
export async function deleteCargoFromDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase.from("cargos").delete().eq("id", id);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menghapus kargo ${id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Kargo ${id} BERHASIL dihapus dari PostgreSQL Supabase.`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return false;
  }
}

// ─── VEHICLES ────────────────────────────────────────────

// Fetch vehicles milik user yang sedang login
export async function fetchTrucksFromDb(retryCount = 0): Promise<TruckDbRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] URL & Anon Key belum diisi di file .env.local! Menggunakan dataset truk default.");
    return [];
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("⚠️ [Supabase DB] Tidak ada sesi aktif. Kendaraan tidak dimuat.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("JWT issued at future") && retryCount < 1) {
        console.warn("⚠️ [Supabase DB] JWT issued at future detected, retrying in 1.5s...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return fetchTrucksFromDb(retryCount + 1);
      }

      if (error.code === "PGRST205" || error.code === "PGRST301") {
        console.warn("⚠️ [Supabase DB] Tabel 'vehicles' belum dibuat di Supabase. Jalankan script SQL pada Supabase SQL Editor.");
      } else {
        console.error("❌ [Supabase DB Error] Gagal mengambil data armada:", error.message);
      }
      return [];
    }
    console.log(`✅ [Supabase DB] Berhasil mengambil ${data?.length || 0} armada dari PostgreSQL.`);
    return (data || []).map((v) => ({
      ...v,
      truck_name: v.vehicle_name || v.truck_name || v.id
    })) as TruckDbRecord[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return [];
  }
}

// Upsert vehicle — selalu sertakan user_id
export async function upsertTruckToDb(vehicle: Vehicle): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data armada tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("⚠️ [Supabase DB] Tidak ada sesi aktif. Kendaraan tidak disimpan ke DB.");
    return false;
  }

  try {
    const record = {
      id: vehicle.id,
      user_id: userId,
      vehicle_name: vehicle.name,
      length_cm: vehicle.lengthCm,
      width_cm: vehicle.widthCm,
      height_cm: vehicle.heightCm,
      max_volume_m3: vehicle.volumeM3,
      status: vehicle.status === "Aktif" ? "Available" : "Maintenance"
    };

    const { error } = await supabase.from("vehicles").upsert(record);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menyimpan armada ${vehicle.id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Armada ${vehicle.id} (${vehicle.name}) BERHASIL tersimpan ke PostgreSQL Supabase!`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return false;
  }
}

// Delete vehicle — Supabase RLS memastikan hanya pemilik yang bisa hapus
export async function deleteTruckFromDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menghapus armada ${id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Armada ${id} BERHASIL dihapus dari PostgreSQL Supabase.`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return false;
  }
}
