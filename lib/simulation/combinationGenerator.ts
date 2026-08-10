import { CargoMasterItem, Vehicle } from "../types";
import { SeededPRNG } from "./seedPRNG";

export interface CombinationGenConfig {
  seed: number;
  totalTrials: number;
  cargoMasterList: CargoMasterItem[];
  vehicles: Vehicle[];
}

/**
 * Generates N realistic cargo quantity combinations based on available cargo types and vehicle capacities.
 * Uses a Seeded PRNG so that any simulation run with the same seed reproduces the exact same 100 combinations.
 */
export function generateCargoCombinations(config: CombinationGenConfig): { cargoId: string; quantity: number }[][] {
  const prng = new SeededPRNG(config.seed);
  const activeVehicles = config.vehicles.filter((v) => v.status !== "Nonaktif");
  
  // Use maximum active vehicle volume as reference
  const maxVehicleVolume = activeVehicles.length > 0
    ? Math.max(...activeVehicles.map((v) => v.volumeM3))
    : 18.0;

  const combinations: { cargoId: string; quantity: number }[][] = [];

  for (let trial = 0; trial < config.totalTrials; trial++) {
    const trialSelections: { cargoId: string; quantity: number }[] = [];
    const availableCargos = [...config.cargoMasterList];

    if (availableCargos.length === 0) {
      combinations.push([]);
      continue;
    }

    // Determine how many distinct cargo types to include (between 2 and max available types)
    const numTypes = prng.nextInt(2, Math.min(4, availableCargos.length));

    // Fisher-Yates shuffle using Seeded PRNG
    for (let i = availableCargos.length - 1; i > 0; i--) {
      const j = prng.nextInt(0, i);
      [availableCargos[i], availableCargos[j]] = [availableCargos[j], availableCargos[i]];
    }

    const selectedTypes = availableCargos.slice(0, numTypes);

    selectedTypes.forEach((cargo) => {
      // Calculate realistic max quantity so trial total volume stays within 40% - 95% of max vehicle volume
      const targetSubVol = (maxVehicleVolume * prng.nextInt(50, 95)) / 100 / numTypes;
      const maxQtyByVol = Math.max(1, Math.floor(targetSubVol / (cargo.volumeM3 || 0.036)));
      
      const qty = prng.nextInt(1, Math.min(25, maxQtyByVol));
      if (qty > 0) {
        trialSelections.push({ cargoId: cargo.id, quantity: qty });
      }
    });

    combinations.push(trialSelections);
  }

  return combinations;
}
