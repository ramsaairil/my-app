import { Vehicle, VehiclePreset, CargoMasterItem } from "./types";

export const VEHICLE_PRESETS: VehiclePreset[] = [
  {
    type: "Carry Box",
    name: "Suzuki Carry Box",
    lengthCm: 220,
    widthCm: 145,
    heightCm: 130,
    description: "Kapasitas muatan ringan tertutup (4,14 m³)"
  },
  {
    type: "Gran Max Box",
    name: "Daihatsu Gran Max Box",
    lengthCm: 235,
    widthCm: 155,
    heightCm: 130,
    description: "Mobil box ringan favorit angkutan dalam kota (4,74 m³)"
  },
  {
    type: "L300 Box",
    name: "Mitsubishi L300 Box",
    lengthCm: 242,
    widthCm: 160,
    heightCm: 135,
    description: "Mobil box tangguh angkutan medium (5,23 m³)"
  },
  {
    type: "Box Kecil",
    name: "Blind Van / Box Kecil",
    lengthCm: 240,
    widthCm: 140,
    heightCm: 140,
    description: "Kendaraan tertutup kurir perkotaan (4,70 m³)"
  },
  {
    type: "Colt Diesel Engkel (CDE)",
    name: "CDE 4 Roda (Engkel Box)",
    lengthCm: 310,
    widthCm: 170,
    heightCm: 170,
    description: "Truk engkel 4 roda antar kota (8,96 m³)"
  },
  {
    type: "Box Sedang",
    name: "Truk Box Sedang (6 Roda)",
    lengthCm: 420,
    widthCm: 190,
    heightCm: 190,
    description: "Truk medium distribusi logistik (15,16 m³)"
  },
  {
    type: "Colt Diesel Double (CDD)",
    name: "CDD 6 Roda (Double Box)",
    lengthCm: 450,
    widthCm: 200,
    heightCm: 200,
    description: "Truk double 6 roda standar industri (18,00 m³)"
  },
  {
    type: "Box Besar",
    name: "Truk Box Besar (CDD Long)",
    lengthCm: 570,
    widthCm: 210,
    heightCm: 220,
    description: "Truk box panjang volume ekstra (26,33 m³)"
  },
  {
    type: "Fuso",
    name: "Truk Fuso Engkel",
    lengthCm: 600,
    widthCm: 230,
    heightCm: 230,
    description: "Truk heavy duty angkutan berat (31,74 m³)"
  },
  {
    type: "Trailer 20 Feet",
    name: "Kontainer Trailer 20 Feet",
    lengthCm: 590,
    widthCm: 235,
    heightCm: 239,
    description: "Kontainer standar 20 Feet (33,13 m³)"
  },
  {
    type: "Wingbox",
    name: "Truk Tronton Wingbox",
    lengthCm: 940,
    widthCm: 240,
    heightCm: 240,
    description: "Truk wingbox 3 pintu kapasitas besar (54,14 m³)"
  },
  {
    type: "Trailer 40 Feet",
    name: "Kontainer Trailer 40 Feet",
    lengthCm: 1203,
    widthCm: 235,
    heightCm: 239,
    description: "Kontainer standar 40 Feet (67,54 m³)"
  }
];

export const DEFAULT_VEHICLES: Vehicle[] = [];

export const DEFAULT_CARGO_ITEMS: CargoMasterItem[] = [];

// Helper to calculate volume in cubic meters rounded to 3 decimal places
export function calculateVolumeM3(lengthCm: number, widthCm: number, heightCm: number): number {
  const vol = (lengthCm * widthCm * heightCm) / 1000000;
  return Number(vol.toFixed(3));
}

// Storage Keys
const STORAGE_KEY_VEHICLES = "antrigravity_vehicles_v3";
const STORAGE_KEY_CARGOS = "antrigravity_cargos_v3";

export function getStoredVehicles(): Vehicle[] {
  if (typeof window === "undefined") return DEFAULT_VEHICLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_VEHICLES;
  } catch {
    return DEFAULT_VEHICLES;
  }
}

export function saveStoredVehicles(vehicles: Vehicle[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
  } catch (e) {
    console.error("Failed to save vehicles to LocalStorage:", e);
  }
}

export function getStoredCargos(): CargoMasterItem[] {
  if (typeof window === "undefined") return DEFAULT_CARGO_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARGOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CARGOS, JSON.stringify(DEFAULT_CARGO_ITEMS));
      return DEFAULT_CARGO_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CARGO_ITEMS;
  } catch {
    return DEFAULT_CARGO_ITEMS;
  }
}

export function saveStoredCargos(cargos: CargoMasterItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CARGOS, JSON.stringify(cargos));
  } catch (e) {
    console.error("Failed to save cargos to LocalStorage:", e);
  }
}
