export type VehicleType =
  | "Pick Up"
  | "Gran Max Pick Up"
  | "L300 Pick Up"
  | "Colt Diesel Engkel (CDE)"
  | "Colt Diesel Double (CDD)"
  | "Box Kecil"
  | "Box Sedang"
  | "Box Besar"
  | "Fuso"
  | "Wingbox"
  | "Trailer 20 Feet"
  | "Trailer 40 Feet"
  | "Kustom";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType | string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number; // (P * L * T) / 1,000,000
  status: "Aktif" | "Nonaktif";
  notes?: string;
}

export interface CargoMasterItem {
  id: string;
  code: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number; // (P * L * T) / 1,000,000
  color: string; // Hex color code e.g. #3b82f6
}

export interface CargoInputSelection {
  cargoId: string;
  quantity: number;
}

export interface PlacedBox3D {
  id: string;
  cargoId: string;
  cargoName: string;
  cargoCode: string;
  color: string;
  // Position in cm relative to container origin (x=width, y=height, z=length)
  xCm: number; 
  yCm: number; 
  zCm: number; 
  // Oriented dimensions in cm
  wCm: number; 
  hCm: number; 
  lCm: number; 
  stepIndex: number;
}

export interface UnpackedBoxInfo {
  cargoId: string;
  cargoName: string;
  cargoCode: string;
  count: number;
}

export type VehicleComparisonStatus =
  | "⭐ Paling Optimal"
  | "Cocok Digunakan"
  | "Kapasitas Berlebih"
  | "Tidak Memenuhi Kapasitas";

export interface OptimizationResult {
  vehicle: Vehicle;
  totalBoxesRequested: number;
  totalBoxesPacked: number;
  totalBoxesUnpacked: number;
  cargoVolumeM3: number;
  vehicleVolumeM3: number;
  usedVolumeM3: number;
  remainingVolumeM3: number;
  utilizationPercent: number;
  packedBoxes: PlacedBox3D[];
  unpackedSummary: UnpackedBoxInfo[];
  statusLabel: VehicleComparisonStatus;
  statusDetails: string;
  fitnessScore?: number;
  generationsCount?: number;
}

export interface VehiclePreset {
  type: VehicleType;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string;
}
