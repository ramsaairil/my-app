import { SeededPRNG } from "../simulation/seedPRNG";
import { GAChromosome, GAGene } from "./types";

/**
 * One-Point Crossover with Repair Mechanism.
 * Combines parentA and parentB genes at a random cut-point if prng.nextFloat() <= crossoverRate.
 */
export function onePointCrossover(
  parentA: GAChromosome,
  parentB: GAChromosome,
  crossoverRate: number,
  prng: SeededPRNG
): { child1: GAChromosome; child2: GAChromosome } {
  if (prng.nextFloat() > crossoverRate || parentA.length === 0 || parentB.length === 0) {
    return {
      child1: parentA.map((g) => ({ ...g })),
      child2: parentB.map((g) => ({ ...g }))
    };
  }

  const minLen = Math.min(parentA.length, parentB.length);
  const cutPoint = prng.nextInt(1, Math.max(1, minLen - 1));

  const rawChild1 = [...parentA.slice(0, cutPoint), ...parentB.slice(cutPoint)];
  const rawChild2 = [...parentB.slice(0, cutPoint), ...parentA.slice(cutPoint)];

  return {
    child1: repairChromosome(rawChild1),
    child2: repairChromosome(rawChild2)
  };
}

/**
 * Repair mechanism to ensure cargo IDs are unique per chromosome and quantities stay within [1, 25].
 */
function repairChromosome(chromosome: GAChromosome): GAChromosome {
  const seenCargoIds = new Set<string>();
  const repaired: GAChromosome = [];

  for (const gene of chromosome) {
    if (!seenCargoIds.has(gene.cargoId)) {
      seenCargoIds.add(gene.cargoId);
      repaired.push({
        cargoId: gene.cargoId,
        quantity: Math.max(1, Math.min(25, Math.round(gene.quantity)))
      });
    }
  }

  return repaired;
}
