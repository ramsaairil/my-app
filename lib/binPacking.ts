import {
  Vehicle,
  CargoMasterItem,
  CargoInputSelection,
  PlacedBox3D,
  UnpackedBoxInfo,
  OptimizationResult,
  VehicleComparisonStatus
} from "./types";
import { calculateVolumeM3 } from "./storage";

// Centralized Optimization Session Constraints (Configurable)
export const MAX_OPTIMIZATION_ITEM_TYPES = 5;
export const MAX_OPTIMIZATION_TOTAL_ITEMS = 100;

export interface BoxToPack {
  cargoId: string;
  cargoName: string;
  cargoCode: string;
  color: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number;
  instanceIndex: number;
}

export interface CandidatePoint3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Check 3D AABB Bounding Box collision/overlap between candidateBox and existingBox.
 * Returns true if candidateBox overlaps with existingBox in X, Y, and Z axes.
 */
export function checkOverlap(
  boxA: { xCm: number; yCm: number; zCm: number; wCm: number; hCm: number; lCm: number },
  boxB: { xCm: number; yCm: number; zCm: number; wCm: number; hCm: number; lCm: number },
  eps = 0.01
): boolean {
  return (
    boxA.xCm < boxB.xCm + boxB.wCm - eps &&
    boxA.xCm + boxA.wCm > boxB.xCm + eps &&
    boxA.yCm < boxB.yCm + boxB.hCm - eps &&
    boxA.yCm + boxA.hCm > boxB.yCm + eps &&
    boxA.zCm < boxB.zCm + boxB.lCm - eps &&
    boxA.zCm + boxA.lCm > boxB.zCm + eps
  );
}

/**
 * Support Constraint Check (Gravity-like placement):
 * Ensures candidate box at height Y is either resting directly on vehicle floor (Y <= 0.1 cm)
 * OR is supported underneath by top faces of placed boxes whose top height (y + h) matches Y
 * with at least minSupportRatio (70%) of candidate box's bottom footprint area.
 */
export function hasValidSupport(
  candidateBox: { xCm: number; yCm: number; zCm: number; wCm: number; hCm: number; lCm: number },
  packedBoxes: PlacedBox3D[],
  minSupportRatio = 0.70
): boolean {
  // 1. If resting directly on vehicle floor (y <= 0.1 cm), 100% valid
  if (candidateBox.yCm <= 0.1) {
    return true;
  }

  const boxBottomY = candidateBox.yCm;
  const boxFootprint = candidateBox.wCm * candidateBox.lCm;
  if (boxFootprint <= 0) return false;

  let totalSupportedArea = 0;

  for (const pb of packedBoxes) {
    const pbTopY = pb.yCm + pb.hCm;

    // Check if underlying box's top face matches candidate box's bottom face (epsilon 0.2 cm)
    if (Math.abs(pbTopY - boxBottomY) <= 0.2) {
      const overlapX = Math.max(
        0,
        Math.min(candidateBox.xCm + candidateBox.wCm, pb.xCm + pb.wCm) -
          Math.max(candidateBox.xCm, pb.xCm)
      );
      const overlapZ = Math.max(
        0,
        Math.min(candidateBox.zCm + candidateBox.lCm, pb.zCm + pb.lCm) -
          Math.max(candidateBox.zCm, pb.zCm)
      );

      totalSupportedArea += overlapX * overlapZ;
    }
  }

  return totalSupportedArea / boxFootprint >= minSupportRatio;
}

/**
 * Validate 3D Placement against all 5 core rules:
 * 1. Inside Vehicle Boundary
 * 2. No Overlap/Collision
 * 3. Valid Gravity Support (Floor or >= 70% bottom area supported)
 * 4. Correct Dimensions
 * 5. Orthogonal Upright Orientations
 */
export function validatePlacement(
  candidateBox: { xCm: number; yCm: number; zCm: number; wCm: number; hCm: number; lCm: number },
  packedBoxes: PlacedBox3D[],
  containerW: number,
  containerH: number,
  containerL: number
): boolean {
  // 1. Boundary Check
  if (
    candidateBox.xCm < 0 ||
    candidateBox.xCm + candidateBox.wCm > containerW ||
    candidateBox.yCm < 0 ||
    candidateBox.yCm + candidateBox.hCm > containerH ||
    candidateBox.zCm < 0 ||
    candidateBox.zCm + candidateBox.lCm > containerL
  ) {
    return false;
  }

  // 2. Support Constraint Check
  if (!hasValidSupport(candidateBox, packedBoxes, 0.70)) {
    return false;
  }

  // 3. Collision/Overlap Check
  for (const pb of packedBoxes) {
    if (checkOverlap(candidateBox, pb)) {
      return false;
    }
  }

  return true;
}

/**
 * Physical Feasibility Check:
 * Checks if a box can physically fit inside container dimensions in upright orthogonal orientations (0° or 90°).
 */
export function canPhysicallyFitContainer(
  box: { lengthCm: number; widthCm: number; heightCm: number },
  containerW: number,
  containerH: number,
  containerL: number
): boolean {
  if (box.heightCm > containerH) return false;

  // Orient 0: w=width, l=length
  const fit0 = box.widthCm <= containerW && box.lengthCm <= containerL;
  // Orient 1: w=length, l=width (90 deg Y-rotation)
  const fit1 = box.lengthCm <= containerW && box.widthCm <= containerL;

  return fit0 || fit1;
}

/**
 * Check if a box can physically fit into at least ONE active vehicle.
 */
export function canFitInAnyVehicle(
  box: { lengthCm: number; widthCm: number; heightCm: number },
  vehicles: Vehicle[]
): boolean {
  const activeVehicles = vehicles.filter((v) => v.status !== "Nonaktif");
  if (activeVehicles.length === 0) return true;

  for (const v of activeVehicles) {
    if (canPhysicallyFitContainer(box, v.widthCm, v.heightCm, v.lengthCm)) {
      return true;
    }
  }
  return false;
}

/**
 * Perform Deterministic Bottom-Up 3D Bin Packing
 */
export function packVehicle(
  vehicle: Vehicle,
  cargoMasterList: CargoMasterItem[],
  selections: CargoInputSelection[]
): OptimizationResult {
  const containerW = vehicle.widthCm;
  const containerH = vehicle.heightCm;
  const containerL = vehicle.lengthCm;

  // 1. Flatten selections into individual box items
  const boxesToPack: BoxToPack[] = [];
  let totalRequestedCount = 0;
  let totalCargoVolumeM3 = 0;

  const cargoMap = new Map<string, CargoMasterItem>();
  cargoMasterList.forEach((c) => cargoMap.set(c.id, c));

  selections.forEach((sel) => {
    const cargo = cargoMap.get(sel.cargoId);
    if (!cargo || sel.quantity <= 0) return;

    totalRequestedCount += sel.quantity;
    totalCargoVolumeM3 += cargo.volumeM3 * sel.quantity;

    for (let i = 0; i < sel.quantity; i++) {
      boxesToPack.push({
        cargoId: cargo.id,
        cargoName: cargo.name,
        cargoCode: cargo.code,
        color: cargo.color,
        lengthCm: cargo.lengthCm,
        widthCm: cargo.widthCm,
        heightCm: cargo.heightCm,
        volumeM3: cargo.volumeM3,
        instanceIndex: i + 1
      });
    }
  });

  // 2. Deterministic Pre-Sort: Largest footprint area first, then height, then volume
  boxesToPack.sort((a, b) => {
    const footprintA = a.lengthCm * a.widthCm;
    const footprintB = b.lengthCm * b.widthCm;
    if (footprintB !== footprintA) return footprintB - footprintA;
    if (b.heightCm !== a.heightCm) return b.heightCm - a.heightCm;
    return b.volumeM3 - a.volumeM3;
  });

  const packedBoxes: PlacedBox3D[] = [];
  const unpackedMap = new Map<string, { cargoName: string; cargoCode: string; count: number }>();
  let physicallyTooLargeCount = 0;

  // Candidate points starting with floor origin
  const candidatePoints: CandidatePoint3D[] = [{ x: 0, y: 0, z: 0 }];

  boxesToPack.forEach((item) => {
    if (!canPhysicallyFitContainer(item, containerW, containerH, containerL)) {
      physicallyTooLargeCount += 1;
      const current = unpackedMap.get(item.cargoId) || {
        cargoName: item.cargoName,
        cargoCode: item.cargoCode,
        count: 0
      };
      current.count += 1;
      unpackedMap.set(item.cargoId, current);
      return;
    }

    // Sort candidate points: Y ASCENDING (Bottom-Up), then Z ascending, then X ascending
    candidatePoints.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.1) return a.y - b.y;
      if (Math.abs(a.z - b.z) > 0.1) return a.z - b.z;
      return a.x - b.x;
    });

    let placed = false;

    // Upright Orthogonal Orientations:
    // Orient 0 (0 deg): w = widthCm, h = heightCm, l = lengthCm
    // Orient 1 (90 deg): w = lengthCm, h = heightCm, l = widthCm
    const orientationOptions = [
      { w: item.widthCm, h: item.heightCm, l: item.lengthCm },
      { w: item.lengthCm, h: item.heightCm, l: item.widthCm }
    ];

    for (let cpIndex = 0; cpIndex < candidatePoints.length; cpIndex++) {
      const cp = candidatePoints[cpIndex];

      for (const orient of orientationOptions) {
        const candidateBox = {
          xCm: cp.x,
          yCm: cp.y,
          zCm: cp.z,
          wCm: orient.w,
          hCm: orient.h,
          lCm: orient.l
        };

        // Strict 5-rule validation check before placing
        if (validatePlacement(candidateBox, packedBoxes, containerW, containerH, containerL)) {
          placed = true;
          packedBoxes.push({
            id: `${item.cargoId}-${item.instanceIndex}`,
            cargoId: item.cargoId,
            cargoName: item.cargoName,
            cargoCode: item.cargoCode,
            color: item.color,
            xCm: cp.x,
            yCm: cp.y,
            zCm: cp.z,
            wCm: orient.w,
            hCm: orient.h,
            lCm: orient.l,
            stepIndex: packedBoxes.length + 1
          });

          // Generate new candidate points on box boundaries
          candidatePoints.push(
            { x: cp.x + orient.w, y: cp.y, z: cp.z },
            { x: cp.x, y: cp.y, z: cp.z + orient.l },
            { x: cp.x, y: cp.y + orient.h, z: cp.z }
          );

          break;
        }
      }

      if (placed) break;
    }

    if (!placed) {
      const current = unpackedMap.get(item.cargoId) || {
        cargoName: item.cargoName,
        cargoCode: item.cargoCode,
        count: 0
      };
      current.count += 1;
      unpackedMap.set(item.cargoId, current);
    }
  });

  // Volume metrics
  const usedVolCm3 = packedBoxes.reduce((sum, pb) => sum + pb.wCm * pb.hCm * pb.lCm, 0);
  const usedVolumeM3 = Number((usedVolCm3 / 1000000).toFixed(3));
  const vehicleVolumeM3 = vehicle.volumeM3;
  const utilizationPercent = Number(
    Math.min(100, (usedVolumeM3 / (vehicleVolumeM3 || 1)) * 100).toFixed(1)
  );

  const totalBoxesPacked = packedBoxes.length;
  const totalBoxesUnpacked = totalRequestedCount - totalBoxesPacked;
  const remainingVolumeM3 = Number(Math.max(0, vehicleVolumeM3 - usedVolumeM3).toFixed(3));

  const unpackedSummary: UnpackedBoxInfo[] = Array.from(unpackedMap.entries()).map(
    ([cargoId, data]) => ({
      cargoId,
      cargoName: data.cargoName,
      cargoCode: data.cargoCode,
      count: data.count
    })
  );

  // Status Labeling & Details
  let statusLabel: VehicleComparisonStatus = "Cocok Digunakan";
  let statusDetails = "";

  if (physicallyTooLargeCount > 0) {
    statusLabel = "Tidak Memenuhi Kapasitas";
    statusDetails = `❌ ${physicallyTooLargeCount} box tidak dapat dimuat karena dimensi fisik melebihi ukuran kendaraan`;
  } else if (totalBoxesUnpacked > 0) {
    statusLabel = "Tidak Memenuhi Kapasitas";
    statusDetails = `⚠️ ${totalBoxesPacked} dari ${totalRequestedCount} muatan berhasil ditempatkan. ${totalBoxesUnpacked} muatan tidak memiliki ruang/penopang yang cukup.`;
  } else {
    if (utilizationPercent >= 75) {
      statusLabel = "⭐ Paling Optimal";
      statusDetails = `Utilisasi tinggi (${utilizationPercent}%) & seluruh ${totalBoxesPacked} box berhasil dimuat secara 3D (100% terstruktur & stabil)`;
    } else if (utilizationPercent >= 50) {
      statusLabel = "Cocok Digunakan";
      statusDetails = `Seluruh ${totalBoxesPacked} box termuat dengan efisiensi ruang ${utilizationPercent}%`;
    } else {
      statusLabel = "Kapasitas Berlebih";
      statusDetails = `Seluruh ${totalBoxesPacked} box termuat (Utilisasi ${utilizationPercent}%)`;
    }
  }

  return {
    vehicle,
    totalBoxesRequested: totalRequestedCount,
    totalBoxesPacked,
    totalBoxesUnpacked,
    cargoVolumeM3: Number(totalCargoVolumeM3.toFixed(3)),
    vehicleVolumeM3,
    usedVolumeM3,
    remainingVolumeM3,
    utilizationPercent,
    packedBoxes,
    unpackedSummary,
    statusLabel,
    statusDetails,
    fitnessScore: totalBoxesPacked * 1000 + utilizationPercent,
    generationsCount: 1
  };
}

/**
 * Compare all available active vehicles for a given cargo selection
 * and recommend the best vehicle based on packing validity and utilization.
 */
export function evaluateAllVehicles(
  vehicles: Vehicle[],
  cargoMasterList: CargoMasterItem[],
  selections: CargoInputSelection[]
): {
  results: OptimizationResult[];
  recommendedResult: OptimizationResult | null;
} {
  const activeVehicles = vehicles.filter((v) => v.status !== "Nonaktif");

  if (activeVehicles.length === 0) {
    return { results: [], recommendedResult: null };
  }

  const results: OptimizationResult[] = activeVehicles.map((vehicle) =>
    packVehicle(vehicle, cargoMasterList, selections)
  );

  const fullyPacked = results.filter((r) => r.totalBoxesUnpacked === 0);

  let bestResult: OptimizationResult;

  if (fullyPacked.length > 0) {
    fullyPacked.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    bestResult = fullyPacked[0];
  } else {
    results.sort((a, b) => {
      if (b.totalBoxesPacked !== a.totalBoxesPacked) {
        return b.totalBoxesPacked - a.totalBoxesPacked;
      }
      return b.utilizationPercent - a.utilizationPercent;
    });
    bestResult = results[0];
  }

  results.forEach((res) => {
    if (res.vehicle.id === bestResult.vehicle.id && res.totalBoxesUnpacked === 0) {
      res.statusLabel = "⭐ Paling Optimal";
      res.statusDetails = `Rekomendasi Terbaik! Solusi 3D penataan paling efisien (${res.utilizationPercent}%) tanpa kargo melayang/overlap`;
    } else if (res.totalBoxesUnpacked > 0) {
      res.statusLabel = "Tidak Memenuhi Kapasitas";
      res.statusDetails = `${res.totalBoxesUnpacked} dari ${res.totalBoxesRequested} box tidak dapat dimuat`;
    } else if (res.utilizationPercent < 50) {
      res.statusLabel = "Kapasitas Berlebih";
      res.statusDetails = `Ruang kosong berlebihan (Utilisasi ${res.utilizationPercent}%)`;
    } else {
      res.statusLabel = "Cocok Digunakan";
      res.statusDetails = `Dapat memuat seluruh barang (${res.utilizationPercent}%)`;
    }
  });

  return {
    results,
    recommendedResult: bestResult
  };
}
