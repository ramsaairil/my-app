import { SeededPRNG } from "../simulation/seedPRNG";
import { GAChromosome } from "./types";

/**
 * Random Quantity Mutation.
 * With probability mutationRate, alters gene quantities using Seeded PRNG.
 */
export function mutateChromosome(
  chromosome: GAChromosome,
  mutationRate: number,
  prng: SeededPRNG
): GAChromosome {
  return chromosome.map((gene) => {
    if (prng.nextFloat() <= mutationRate) {
      const delta = prng.nextInt(-3, 3);
      const newQty = Math.max(1, Math.min(25, gene.quantity + delta));
      return { cargoId: gene.cargoId, quantity: newQty };
    }
    return { ...gene };
  });
}
