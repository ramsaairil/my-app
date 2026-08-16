import { CargoMasterItem, Vehicle } from "../types";
import { SeededPRNG } from "../simulation/seedPRNG";
import { GAChromosome } from "./types";

/**
 * Generates an initial population of N chromosomes using Seeded PRNG.
 * Each chromosome is a valid cargo quantity map.
 */
export function generateInitialPopulation(
  populationSize: number,
  cargoMasterList: CargoMasterItem[],
  vehicles: Vehicle[],
  prng: SeededPRNG
): GAChromosome[] {
  const activeVehicles = vehicles.filter((v) => v.status !== "Nonaktif");
  const maxVehicleVolume = activeVehicles.length > 0
    ? Math.max(...activeVehicles.map((v) => v.volumeM3))
    : 18.0;

  const population: GAChromosome[] = [];

  for (let i = 0; i < populationSize; i++) {
    const chromosome: GAChromosome = [];
    const availableCargos = [...cargoMasterList];

    if (availableCargos.length === 0) {
      population.push([]);
      continue;
    }

    const numTypes = prng.nextInt(2, Math.min(4, availableCargos.length));

    // Fisher-Yates shuffle using Seeded PRNG
    for (let idx = availableCargos.length - 1; idx > 0; idx--) {
      const j = prng.nextInt(0, idx);
      [availableCargos[idx], availableCargos[j]] = [availableCargos[j], availableCargos[idx]];
    }

    const selectedTypes = availableCargos.slice(0, numTypes);

    selectedTypes.forEach((cargo) => {
      const targetSubVol = (maxVehicleVolume * prng.nextInt(50, 95)) / 100 / numTypes;
      const maxQtyByVol = Math.max(1, Math.floor(targetSubVol / (cargo.volumeM3 || 0.036)));
      const qty = prng.nextInt(1, Math.min(25, maxQtyByVol));
      if (qty > 0) {
        chromosome.push({ cargoId: cargo.id, quantity: qty });
      }
    });

    population.push(chromosome);
  }

  return population;
}
