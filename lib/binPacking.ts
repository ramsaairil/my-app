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

interface Chromosome {
  order: number[];        // Order of box indices [0, 1, 2, ..., N-1]
  orientations: number[]; // Orientation index preference (0 to 5) for each box
  fitness: number;
}

// 6 standard 3D orientations (Permutations of Width, Height, Length)
const ORIENTATION_PERMUTATIONS = [
  (b: { w: number; h: number; l: number }) => ({ w: b.w, h: b.h, l: b.l }),
  (b: { w: number; h: number; l: number }) => ({ w: b.l, h: b.h, l: b.w }),
  (b: { w: number; h: number; l: number }) => ({ w: b.w, h: b.l, l: b.h }),
  (b: { w: number; h: number; l: number }) => ({ w: b.l, h: b.w, l: b.h }),
  (b: { w: number; h: number; l: number }) => ({ w: b.h, h: b.w, l: b.l }),
  (b: { w: number; h: number; l: number }) => ({ w: b.h, h: b.l, l: b.w }),
];

// Check 3D bounding box collision/overlap between boxA and boxB
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
 * Physical Dimension Check (Test B):
 * Checks if a box can physically fit inside container dimensions in ANY of the 6 orientations.
 */
function canPhysicallyFitContainer(
  box: { lengthCm: number; widthCm: number; heightCm: number },
  containerW: number,
  containerH: number,
  containerL: number
): boolean {
  for (const perm of ORIENTATION_PERMUTATIONS) {
    const dim = perm({ w: box.widthCm, h: box.heightCm, l: box.lengthCm });
    if (dim.w <= containerW && dim.h <= containerH && dim.l <= containerL) {
      return true;
    }
  }
  return false;
}

/**
 * Physical Feasibility Check across all candidate active vehicles.
 * Returns true if the box can physically fit into at least ONE active vehicle.
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
 * Support Constraint Check (Gravity-like placement):
 * Ensures box candidate B at vertical height Y is either resting directly on vehicle floor (Y <= 0.1cm)
 * OR is geometrically supported underneath by placed boxes A whose top height (yA + hA) matches Y
 * with at least minSupportRatio (70%) of horizontal area in the X-Z plane.
 * Prevents boxes from floating in the air.
 */
function hasValidSupport(
  candidateBox: { x: number; y: number; z: number; w: number; h: number; l: number },
  packedBoxes: PlacedBox3D[],
  minSupportRatio = 0.70
): boolean {
  // 1. If resting directly on vehicle floor (y <= 0.1 cm), it's valid
  if (candidateBox.y <= 0.1) {
    return true;
  }

  const boxBottomY = candidateBox.y;
  const boxArea = candidateBox.w * candidateBox.l;
  if (boxArea <= 0) return false;

  let totalSupportedArea = 0;

  for (const pb of packedBoxes) {
    const pbTopY = pb.yCm + pb.hCm;

    // Check if underlying box A's top height matches candidate B's bottom height (epsilon 0.1 cm)
    if (Math.abs(pbTopY - boxBottomY) <= 0.1) {
      // Calculate 2D horizontal overlap area in X-Z plane
      const overlapX = Math.max(
        0,
        Math.min(candidateBox.x + candidateBox.w, pb.xCm + pb.wCm) -
          Math.max(candidateBox.x, pb.xCm)
      );
      const overlapZ = Math.max(
        0,
        Math.min(candidateBox.z + candidateBox.l, pb.zCm + pb.lCm) -
          Math.max(candidateBox.z, pb.zCm)
      );

      totalSupportedArea += overlapX * overlapZ;
    }
  }

  // Check if supported area ratio meets minimum required threshold
  return totalSupportedArea / boxArea >= minSupportRatio;
}

/**
 * Decode a Genetic Algorithm Chromosome into 3D Placed Boxes using Extreme Point Heuristic
 * with Support Constraint (Gravity-like placement).
 */
function decodeChromosome(
  chromosome: Chromosome,
  boxesToPack: BoxToPack[],
  containerW: number,
  containerH: number,
  containerL: number
): {
  packedBoxes: PlacedBox3D[];
  unpackedMap: Map<string, { cargoName: string; cargoCode: string; count: number }>;
  usedVolumeM3: number;
  utilizationPercent: number;
  fitness: number;
  physicallyTooLargeCount: number;
  unsupportedCount: number;
} {
  const packedBoxes: PlacedBox3D[] = [];
  const unpackedMap = new Map<string, { cargoName: string; cargoCode: string; count: number }>();
  const extremePoints: ExtremePoint[] = [{ x: 0, y: 0, z: 0 }];
  let physicallyTooLargeCount = 0;
  let unsupportedCount = 0;

  chromosome.order.forEach((boxIndex, stepIdx) => {
    const item = boxesToPack[boxIndex];
    if (!item) return;

    // Test B: Verify physical dimension bounds before attempting placement
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

    let placed = false;

    // Primary sort: Y ascending (Floor Y=0 first, then Level 2, Level 3 bottom-to-top)
    // Secondary sort: Z ascending, Tertiary sort: X ascending
    extremePoints.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.1) return a.y - b.y;
      if (a.z !== b.z) return a.z - b.z;
      return a.x - b.x;
    });

    // Determine preferred orientation order starting with chromosome's orientation gene
    const prefOrientIdx = chromosome.orientations[boxIndex] % 6;
    const orientIndices = [prefOrientIdx];
    for (let o = 0; o < 6; o++) {
      if (o !== prefOrientIdx) orientIndices.push(o);
    }

    const orientations = orientIndices.map((idx) =>
      ORIENTATION_PERMUTATIONS[idx]({
        w: item.widthCm,
        h: item.heightCm,
        l: item.lengthCm
      })
    );

    for (let epIndex = 0; epIndex < extremePoints.length; epIndex++) {
      const ep = extremePoints[epIndex];

      for (const orient of orientations) {
        // Boundary Check: Ensure box does not exceed container limits
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

          // 1. Support Constraint Check: Ensure box has underlying support (floor Y=0 or underlying boxes)
          if (!hasValidSupport(candidateBox, packedBoxes, 0.70)) {
            continue; // Skip placement if box would float in the air
          }

          // 2. Collision/Overlap Check: Ensure no intersection with existing boxes
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
            // Placement successful
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
              stepIndex: stepIdx + 1
            });

            // Generate 3 new Extreme Points along box faces
            extremePoints.push(
              { x: ep.x + orient.w, y: ep.y, z: ep.z },
              { x: ep.x, y: ep.y, z: ep.z + orient.l },
              { x: ep.x, y: ep.y + orient.h, z: ep.z }
            );

            // Remove used extreme point
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

  // Calculate volume metrics
  const usedVolCm3 = packedBoxes.reduce(
    (sum, pb) => sum + pb.wCm * pb.hCm * pb.lCm,
    0
  );
  const usedVolumeM3 = Number((usedVolCm3 / 1000000).toFixed(3));
  const containerVolM3 = calculateVolumeM3(containerL, containerW, containerH);
  const utilizationPercent = Number(
    Math.min(100, (usedVolumeM3 / (containerVolM3 || 1)) * 100).toFixed(1)
  );

  const totalBoxesRequested = boxesToPack.length;
  const totalPacked = packedBoxes.length;
  const totalUnpacked = totalBoxesRequested - totalPacked;

  // Genetic Algorithm Fitness Function with Support & Boundary Penalties:
  // Fitness = (Packed Count * 1000) + Utilization % - (Unpacked Count * 500) - (Unsupported Count * 2000) - (Physically Too Large * 10000)
  const fitness = Number(
    (
      totalPacked * 1000 +
      utilizationPercent -
      totalUnpacked * 500 -
      unsupportedCount * 2000 -
      physicallyTooLargeCount * 10000
    ).toFixed(1)
  );

  return {
    packedBoxes,
    unpackedMap,
    usedVolumeM3,
    utilizationPercent,
    fitness,
    physicallyTooLargeCount,
    unsupportedCount
  };
}

/**
 * Genetic Algorithm Engine for 3D Bin Packing Optimization
 */
function runGeneticAlgorithm(
  boxesToPack: BoxToPack[],
  containerW: number,
  containerH: number,
  containerL: number,
  generationsCount = 30,
  popSize = 25
): {
  bestResult: ReturnType<typeof decodeChromosome>;
  bestFitness: number;
  generationsCount: number;
} {
  const n = boxesToPack.length;
  if (n === 0) {
    return {
      bestResult: decodeChromosome(
        { order: [], orientations: [], fitness: 0 },
        [],
        containerW,
        containerH,
        containerL
      ),
      bestFitness: 0,
      generationsCount: 0
    };
  }

  // Helper: Create Chromosome with specific order
  const createChromosome = (order: number[]): Chromosome => {
    const orientations = Array.from({ length: n }, () => Math.floor(Math.random() * 6));
    const ch: Chromosome = { order, orientations, fitness: 0 };
    const decoded = decodeChromosome(ch, boxesToPack, containerW, containerH, containerL);
    ch.fitness = decoded.fitness;
    return ch;
  };

  // Helper: Shuffle array
  const shuffle = (arr: number[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Initialize Population
  const population: Chromosome[] = [];

  // Seed Individual 1: Sorted by volume (descending)
  const volumeSortedOrder = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => boxesToPack[b].volumeM3 - boxesToPack[a].volumeM3
  );
  population.push(createChromosome(volumeSortedOrder));

  // Seed Individual 2: Sorted by length (descending)
  const lengthSortedOrder = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => boxesToPack[b].lengthCm - boxesToPack[a].lengthCm
  );
  population.push(createChromosome(lengthSortedOrder));

  // Fill remainder with random chromosomes
  while (population.length < popSize) {
    const baseOrder = Array.from({ length: n }, (_, i) => i);
    population.push(createChromosome(shuffle(baseOrder)));
  }

  // Order Crossover (OX) for sequence permutations
  const orderCrossover = (p1: number[], p2: number[]): [number[], number[]] => {
    const len = p1.length;
    if (len <= 2) return [[...p1], [...p2]];

    const start = Math.floor(Math.random() * (len - 1));
    const end = start + Math.floor(Math.random() * (len - start));

    const c1 = new Array(len).fill(-1);
    const c2 = new Array(len).fill(-1);

    for (let i = start; i <= end; i++) {
      c1[i] = p1[i];
      c2[i] = p2[i];
    }

    const fillChild = (child: number[], parent: number[]) => {
      let currentIdx = (end + 1) % len;
      for (let i = 0; i < len; i++) {
        const item = parent[(end + 1 + i) % len];
        if (!child.includes(item)) {
          child[currentIdx] = item;
          currentIdx = (currentIdx + 1) % len;
        }
      }
    };

    fillChild(c1, p2);
    fillChild(c2, p1);

    return [c1, c2];
  };

  // Tournament Selection
  const selectParent = (pop: Chromosome[]): Chromosome => {
    const k = 3;
    let best = pop[Math.floor(Math.random() * pop.length)];
    for (let i = 1; i < k; i++) {
      const competitor = pop[Math.floor(Math.random() * pop.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    return best;
  };

  // Run Evolution Generations
  for (let gen = 0; gen < generationsCount; gen++) {
    // Sort population descending by fitness
    population.sort((a, b) => b.fitness - a.fitness);

    const nextGen: Chromosome[] = [];

    // Elitism: Preserve top 2 individuals
    nextGen.push({ ...population[0], order: [...population[0].order], orientations: [...population[0].orientations] });
    if (population.length > 1) {
      nextGen.push({ ...population[1], order: [...population[1].order], orientations: [...population[1].orientations] });
    }

    while (nextGen.length < popSize) {
      const p1 = selectParent(population);
      const p2 = selectParent(population);

      let childOrder1 = [...p1.order];
      let childOrder2 = [...p2.order];

      // Crossover (Probability 0.85)
      if (Math.random() < 0.85) {
        [childOrder1, childOrder2] = orderCrossover(p1.order, p2.order);
      }

      // Orientations uniform crossover
      const orient1 = p1.orientations.map((o, idx) => (Math.random() < 0.5 ? o : p2.orientations[idx]));
      const orient2 = p2.orientations.map((o, idx) => (Math.random() < 0.5 ? o : p1.orientations[idx]));

      // Mutation (Probability 0.2) - Swap mutation on order & random mutation on orientation
      if (Math.random() < 0.2 && childOrder1.length >= 2) {
        const i = Math.floor(Math.random() * childOrder1.length);
        const j = Math.floor(Math.random() * childOrder1.length);
        [childOrder1[i], childOrder1[j]] = [childOrder1[j], childOrder1[i]];
        orient1[i] = Math.floor(Math.random() * 6);
      }

      if (Math.random() < 0.2 && childOrder2.length >= 2) {
        const i = Math.floor(Math.random() * childOrder2.length);
        const j = Math.floor(Math.random() * childOrder2.length);
        [childOrder2[i], childOrder2[j]] = [childOrder2[j], childOrder2[i]];
        orient2[j] = Math.floor(Math.random() * 6);
      }

      const ch1: Chromosome = { order: childOrder1, orientations: orient1, fitness: 0 };
      const ch2: Chromosome = { order: childOrder2, orientations: orient2, fitness: 0 };

      const decoded1 = decodeChromosome(ch1, boxesToPack, containerW, containerH, containerL);
      const decoded2 = decodeChromosome(ch2, boxesToPack, containerW, containerH, containerL);

      ch1.fitness = decoded1.fitness;
      ch2.fitness = decoded2.fitness;

      nextGen.push(ch1);
      if (nextGen.length < popSize) {
        nextGen.push(ch2);
      }
    }

    population.splice(0, population.length, ...nextGen);
  }

  // Return the best evolved solution
  population.sort((a, b) => b.fitness - a.fitness);
  const bestChromosome = population[0];
  const bestDecoded = decodeChromosome(bestChromosome, boxesToPack, containerW, containerH, containerL);

  return {
    bestResult: bestDecoded,
    bestFitness: bestChromosome.fitness,
    generationsCount
  };
}

/**
 * Main Entry Point: Run 3D Bin Packing simulation for a specific vehicle and cargo selection
 * powered by Genetic Algorithm (GA).
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

  const containerW = vehicle.widthCm;
  const containerH = vehicle.heightCm;
  const containerL = vehicle.lengthCm;

  // 2. Run Genetic Algorithm Optimization Engine
  const gaOutput = runGeneticAlgorithm(boxesToPack, containerW, containerH, containerL, 30, 25);
  const { packedBoxes, unpackedMap, usedVolumeM3, utilizationPercent, fitness, physicallyTooLargeCount } = gaOutput.bestResult;

  const totalBoxesPacked = packedBoxes.length;
  const totalBoxesUnpacked = totalRequestedCount - totalBoxesPacked;
  const vehicleVolumeM3 = vehicle.volumeM3;
  const remainingVolumeM3 = Number(Math.max(0, vehicleVolumeM3 - usedVolumeM3).toFixed(3));

  const unpackedSummary: UnpackedBoxInfo[] = Array.from(unpackedMap.entries()).map(
    ([cargoId, data]) => ({
      cargoId,
      cargoName: data.cargoName,
      cargoCode: data.cargoCode,
      count: data.count
    })
  );

  // Status Labeling & Details (Test B Dimension Validation + Volume Evaluation)
  let statusLabel: VehicleComparisonStatus = "Cocok Digunakan";
  let statusDetails = "";

  if (physicallyTooLargeCount > 0) {
    statusLabel = "Tidak Memenuhi Kapasitas";
    statusDetails = `❌ ${physicallyTooLargeCount} box tidak dapat dimuat karena dimensi fisik (P/L/T) melebihi ukuran ruang kendaraan`;
  } else if (totalBoxesUnpacked > 0) {
    statusLabel = "Tidak Memenuhi Kapasitas";
    statusDetails = `⚠️ ${totalBoxesUnpacked} box tidak muat dalam ruang kendaraan`;
  } else {
    if (utilizationPercent >= 75) {
      statusLabel = "⭐ Paling Optimal";
      statusDetails = `Utilisasi tinggi (${utilizationPercent}%) & seluruh box berhasil dimuat secara 3D (0% melayang)`;
    } else if (utilizationPercent >= 50) {
      statusLabel = "Cocok Digunakan";
      statusDetails = `Semua box termuat dengan efisiensi ruang (${utilizationPercent}%)`;
    } else {
      statusLabel = "Kapasitas Berlebih";
      statusDetails = `Kapasitas kendaraan terlalu besar (Utilisasi hanya ${utilizationPercent}%)`;
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
    fitnessScore: fitness,
    generationsCount: gaOutput.generationsCount
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
  const activeVehicles = vehicles.filter((v) => v.status !== "Nonaktif");

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
      res.statusDetails = `Rekomendasi Terbaik! Solusi GA menemukan penataan 3D paling efisien (${res.utilizationPercent}%) tanpa kargo melayang`;
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
