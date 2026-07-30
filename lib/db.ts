import { supabase, isSupabaseConfigured } from "./supabase";

export interface CargoDbRecord {
  id: string;
  name?: string;
  shape?: string;
  category?: string;
  priority?: string;
  quantity?: number;
  dimension: string;
  volume_m3?: number;
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
      console.error("❌ [Supabase DB Error] Gagal mengambil data kargo:", error.message);
      return [];
    }
    console.log(`✅ [Supabase DB] Berhasil mengambil ${data?.length || 0} kargo dari PostgreSQL.`);
    return data as CargoDbRecord[];
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
    return [];
  }
}

// Add a new cargo item to Supabase
export async function insertCargoToDb(cargo: CargoDbRecord): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data kargo baru tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  try {
    const { error } = await supabase.from("cargos").insert([cargo]);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menyimpan kargo ${cargo.id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Kargo ${cargo.id} BERHASIL tersimpan ke PostgreSQL!`);
    return true;
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
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
    console.log(`✅ [Supabase DB] Kargo ${id} BERHASIL dihapus dari PostgreSQL.`);
    return true;
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
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
      console.error("❌ [Supabase DB Error] Gagal mengambil data armada:", error.message);
      return [];
    }
    console.log(`✅ [Supabase DB] Berhasil mengambil ${data?.length || 0} armada dari PostgreSQL.`);
    return data as TruckDbRecord[];
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
    return [];
  }
}

// Add a new truck to Supabase
export async function insertTruckToDb(truck: TruckDbRecord): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("⚠️ [Supabase DB] Data armada baru tersimpan di memori lokal karena .env.local belum diisi.");
    return false;
  }

  try {
    const { error } = await supabase.from("trucks").insert([truck]);
    if (error) {
      console.error(`❌ [Supabase DB Error] Gagal menyimpan armada ${truck.id}:`, error.message);
      return false;
    }
    console.log(`✅ [Supabase DB] Armada ${truck.id} BERHASIL tersimpan ke PostgreSQL!`);
    return true;
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
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
    console.log(`✅ [Supabase DB] Armada ${id} BERHASIL dihapus dari PostgreSQL.`);
    return true;
  } catch (err: any) {
    console.error("❌ [Supabase DB Exception]:", err?.message);
    return false;
  }
}
