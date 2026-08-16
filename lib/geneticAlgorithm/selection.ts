import { SeededPRNG } from "../simulation/seedPRNG";
import { GAIndividual } from "./types";

/**
 * Tournament Selection (k = tournamentSize).
 * Randomly samples k individuals using Seeded PRNG and selects the best fitness.
 */
export function tournamentSelection(
  population: GAIndividual[],
  tournamentSize: number,
  prng: SeededPRNG
): GAIndividual {
  if (population.length === 0) {
    throw new Error("Cannot perform selection on empty population");
  }

  const k = Math.min(tournamentSize, population.length);
  let best = population[prng.nextInt(0, population.length - 1)];

  for (let i = 1; i < k; i++) {
    const candidate = population[prng.nextInt(0, population.length - 1)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }

  return best;
}
