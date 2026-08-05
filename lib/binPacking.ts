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

interface BoxToPack {
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

interface ExtremePoint {
  x: number;
  y: number;
  z: number;
}

// Check 3D bounding box overlap
function checkOverlap(
  boxA: { x: number; y: number; z: number; w: number; h: number; l: number },
  boxB: { x: number; y: number; z: number; w: number; h: number; l: number }
): boolean {
  return (
    boxA.x < boxB.x + boxB.w &&
    boxA.x + boxA.w > boxB.x &&
    boxA.y < boxB.y + boxB.h &&
    boxA.y + boxA.h > boxB.y &&
    boxA.z < boxB.z + boxB.l &&
    boxA.z + boxA.l > boxB.z
  );
}

/**
  * Run 3D Bin Packing simulation for a specific vehicle and cargo selection.
  */
export function packVehicle(
  vehicle: Vehicle,
  cargoMasterList: CargoMasterItem[],
  selections: CargoInputSelection[]
): OptimizationResult {
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

  // Sort boxes to pack: Largest volume first for optimal packing density
  boxesToPack.sort((a, b) => b.volumeM3 - a.volumeM3 || b.lengthCm - a.lengthCm);

  // Container dimensions in cm
  // x = Width (Lebar), y = Height (Tinggi), z = Length (Panjang)
  const containerW = vehicle.widthCm;
  const containerH = vehicle.heightCm;
  const containerL = vehicle.lengthCm;

  const packedBoxes: PlacedBox3D[] = [];
  const unpackedMap = new Map<string, { cargoName: string; cargoCode: string; count: number }>();

  const extremePoints: ExtremePoint[] = [{ x: 0, y: 0, z: 0 }];

  boxesToPack.forEach((item, index) => {
    let placed = false;

    // Sort extreme points: bottom-back-left first (Z ascending, Y ascending, X ascending)
    extremePoints.sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    // Orientations to try (width, height, length permutations)
    const orientations = [
      { w: item.widthCm, h: item.heightCm, l: item.lengthCm },
      { w: item.lengthCm, h: item.heightCm, l: item.widthCm },
      { w: item.widthCm, h: item.lengthCm, l: item.heightCm },
      { w: item.lengthCm, h: item.widthCm, l: item.heightCm },
      { w: item.heightCm, h: item.widthCm, l: item.lengthCm },
      { w: item.heightCm, h: item.lengthCm, l: item.widthCm }
    ];

    for (let epIndex = 0; epIndex < extremePoints.length; epIndex++) {
      const ep = extremePoints[epIndex];

      for (const orient of orientations) {
        // Boundary check
        if (
          ep.x + orient.w <= containerW &&
          ep.y + orient.h <= containerH &&
          ep.z + orient.l <= containerL
        ) {
          const candidateBox = {
            x: ep.x,
            y: ep.y,
            z: ep.z,
            w: orient.w,
            h: orient.h,
            l: orient.l
          };

          // Overlap check
          const overlaps = packedBoxes.some((pb) =>
            checkOverlap(candidateBox, {
              x: pb.xCm,
              y: pb.yCm,
              z: pb.zCm,
              w: pb.wCm,
              h: pb.hCm,
              l: pb.lCm
            })
          );

          if (!overlaps) {
            // Successfully placed!
            placed = true;
            packedBoxes.push({
              id: `${item.cargoId}-${item.instanceIndex}`,
              cargoId: item.cargoId,
              cargoName: item.cargoName,
              cargoCode: item.cargoCode,
              color: item.color,
              xCm: ep.x,
              yCm: ep.y,
              zCm: ep.z,
              wCm: orient.w,
              hCm: orient.h,
              lCm: orient.l,
              stepIndex: index + 1
            });

            // Generate new extreme points
            extremePoints.push(
              { x: ep.x + orient.w, y: ep.y, z: ep.z },
              { x: ep.x, y: ep.y + orient.h, z: ep.z },
              { x: ep.x, y: ep.y, z: ep.z + orient.l }
            );

            // Remove current point
            extremePoints.splice(epIndex, 1);
            break;
          }
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

  const totalBoxesPacked = packedBoxes.length;
  const totalBoxesUnpacked = totalRequestedCount - totalBoxesPacked;

  // Calculate used volume
  const usedVolCm3 = packedBoxes.reduce(
    (sum, pb) => sum + pb.wCm * pb.hCm * pb.lCm,
    0
  );
  const usedVolumeM3 = calculateVolumeM3(
    Math.round(usedVolCm3 ** (1 / 3)),
    Math.round(usedVolCm3 ** (1 / 3)),
    Math.round(usedVolCm3 ** (1 / 3))
  ) > 0 ? Number((usedVolCm3 / 1000000).toFixed(3)) : Number((usedVolCm3 / 1000000).toFixed(3));

  const vehicleVolumeM3 = vehicle.volumeM3;
  const remainingVolumeM3 = Number(Math.max(0, vehicleVolumeM3 - usedVolumeM3).toFixed(3));
  const utilizationPercent = Number(
    Math.min(100, (usedVolumeM3 / vehicleVolumeM3) * 100).toFixed(1)
  );

  const unpackedSummary: UnpackedBoxInfo[] = Array.from(unpackedMap.entries()).map(
    ([cargoId, data]) => ({
      cargoId,
      cargoName: data.cargoName,
      cargoCode: data.cargoCode,
      count: data.count
    })
  );

  // Initial Status Labeling
  let statusLabel: VehicleComparisonStatus = "Cocok Digunakan";
  let statusDetails = "";

  if (totalBoxesUnpacked > 0) {
    statusLabel = "Tidak Memenuhi Kapasitas";
    statusDetails = `${totalBoxesUnpacked} box tidak muat dalam ruang kendaraan`;
  } else {
    if (utilizationPercent >= 75) {
      statusLabel = "⭐ Paling Optimal";
      statusDetails = `Utilisasi tinggi (${utilizationPercent}%) & semua box termuat`;
    } else if (utilizationPercent >= 50) {
      statusLabel = "Cocok Digunakan";
      statusDetails = `Semua box termuat dengan utilisasi (${utilizationPercent}%)`;
    } else {
      statusLabel = "Kapasitas Berlebih";
      statusDetails = `Kapasitas ruang terlalu besar (Utilisasi hanya ${utilizationPercent}%)`;
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
    statusDetails
  };
}

/**
  * Compare all available active vehicles for a given cargo selection,
  * tag the best vehicle as "⭐ Paling Optimal", and return list of results.
  */
export function evaluateAllVehicles(
  vehicles: Vehicle[],
  cargoMasterList: CargoMasterItem[],
  selections: CargoInputSelection[]
): {
  results: OptimizationResult[];
  recommendedResult: OptimizationResult | null;
} {
  const activeVehicles = vehicles.filter((v) => v.status === "Aktif");

  if (activeVehicles.length === 0) {
    return { results: [], recommendedResult: null };
  }

  const results: OptimizationResult[] = activeVehicles.map((vehicle) =>
    packVehicle(vehicle, cargoMasterList, selections)
  );

  // Determine the best recommended vehicle:
  // 1. Vehicles that packed ALL boxes (totalBoxesUnpacked === 0)
  const fullyPacked = results.filter((r) => r.totalBoxesUnpacked === 0);

  let bestResult: OptimizationResult;

  if (fullyPacked.length > 0) {
    // Sort by highest utilization percentage (minimum empty space)
    fullyPacked.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    bestResult = fullyPacked[0];
  } else {
    // If no vehicle fits all, choose the one with most boxes packed, then highest utilization
    results.sort((a, b) => {
      if (b.totalBoxesPacked !== a.totalBoxesPacked) {
        return b.totalBoxesPacked - a.totalBoxesPacked;
      }
      return b.utilizationPercent - a.utilizationPercent;
    });
    bestResult = results[0];
  }

  // Update status labels across all evaluated results for accurate comparison display
  results.forEach((res) => {
    if (res.vehicle.id === bestResult.vehicle.id && res.totalBoxesUnpacked === 0) {
      res.statusLabel = "⭐ Paling Optimal";
      res.statusDetails = `Rekomendasi Terbaik! Semua box termuat & utilisasi (${res.utilizationPercent}%) paling efisien`;
    } else if (res.totalBoxesUnpacked > 0) {
      res.statusLabel = "Tidak Memenuhi Kapasitas";
      res.statusDetails = `${res.totalBoxesUnpacked} dari ${res.totalBoxesRequested} box tidak dapat dimuat`;
    } else if (res.utilizationPercent < 50) {
      res.statusLabel = "Kapasitas Berlebih";
      res.statusDetails = `Ruang kosong berlebihan (Utilisasi ${res.utilizationPercent}%)`;
    } else {
      res.statusLabel = "Cocok Digunakan";
      res.statusDetails = `Dapat memuat seluruh barang (Utilisasi ${res.utilizationPercent}%)`;
    }
  });

  return {
    results,
    recommendedResult: bestResult
  };
}
