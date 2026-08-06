import { supabase, isSupabaseConfigured } from "./supabase";
import { CargoMasterItem, Vehicle } from "./types";

export interface CargoDbRecord {
  id: string;
  name: string;
  shape?: string;
  category?: string;
  priority?: string;
  quantity?: number;
  dimension: string;
  volume_m3: number;
  weight_kg?: number;
  handling_method?: string;
  status?: string;
}

export interface TruckDbRecord {
  id: string;
  truck_name: string;
  plate_number: string;
  truck_type: string;
  driver_name: string;
  max_volume_m3: number;
  status: string;
  current_dock: string;
}

// Fetch all cargo items from Supabase
export async function fetchCargosFromDb(): Promise<CargoDbRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] URL & Anon Key belum diisi di file .env.local! Menggunakan dataset default.");
    return [];
  }

  try {
    const { data, error } = await supabase.from("cargos").select("*").order("created_at", { ascending: false });
    if (error) {
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

// Upsert (Insert or Update) a Cargo item into Supabase
export async function upsertCargoToDb(cargo: CargoMasterItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data kargo tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  try {
    const record: CargoDbRecord = {
      id: cargo.id,
      name: cargo.name,
      shape: "Balok",
      category: cargo.code,
      priority: "Standard",
      quantity: 1,
      dimension: `${cargo.lengthCm}x${cargo.widthCm}x${cargo.heightCm} cm`,
      volume_m3: cargo.volumeM3,
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

// Delete a cargo item from Supabase
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

// Fetch trucks from Supabase
export async function fetchTrucksFromDb(): Promise<TruckDbRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] URL & Anon Key belum diisi di file .env.local! Menggunakan dataset truk default.");
    return [];
  }

  try {
    const { data, error } = await supabase.from("trucks").select("*").order("created_at", { ascending: false });
    if (error) {
      if (error.code === "PGRST205" || error.code === "PGRST301") {
        console.warn("⚠️ [Supabase DB] Tabel 'trucks' belum dibuat di Supabase. Jalankan script SQL pada Supabase SQL Editor.");
      } else {
        console.error("❌ [Supabase DB Error] Gagal mengambil data armada:", error.message);
      }
      return [];
    }
    console.log(`✅ [Supabase DB] Berhasil mengambil ${data?.length || 0} armada dari PostgreSQL.`);
    return data as TruckDbRecord[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ [Supabase DB Exception]:", msg);
    return [];
  }
}

// Upsert (Insert or Update) a Truck/Vehicle into Supabase
export async function upsertTruckToDb(vehicle: Vehicle): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data armada tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  try {
    const record: TruckDbRecord = {
      id: vehicle.id,
      truck_name: vehicle.name,
      plate_number: `B ${vehicle.id.replace("TRK-", "9")} UXR`,
      truck_type: vehicle.type,
      driver_name: "Driver Logistics",
      max_volume_m3: vehicle.volumeM3,
      status: vehicle.status === "Aktif" ? "Available" : "Maintenance",
      current_dock: "Dock #1"
    };

    const { error } = await supabase.from("trucks").upsert(record);
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

// Delete a truck from Supabase
export async function deleteTruckFromDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { error } = await supabase.from("trucks").delete().eq("id", id);
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
