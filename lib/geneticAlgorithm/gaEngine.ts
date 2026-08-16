import { evaluateAllVehicles } from "../binPacking";
import { evaluateSimulationTrial } from "../simulation/simulationEvaluator";
import { SeededPRNG } from "../simulation/seedPRNG";
import { generateInitialPopulation } from "./population";
import { tournamentSelection } from "./selection";
import { onePointCrossover } from "./crossover";
import { mutateChromosome } from "./mutation";
import {
  GAConfig,
  GAChromosome,
  GAIndividual,
  GAGenerationSummary,
  GARunResult
} from "./types";

/**
 * Executes full Genetic Algorithm Optimization Loop.
 * Generates Initial Population -> Evaluates 3D Bin Packing -> Selection -> Crossover -> Mutation -> Evolves G1 to G5.
 */
export async function runGeneticAlgorithm(config: GAConfig): Promise<GARunResult> {
  const prng = new SeededPRNG(config.seed);
  const activeVehicles = config.vehicles.filter((v) => v.status !== "Nonaktif");
  const popSize = config.populationSize || 20;
  const genCount = config.generationsCount || 5;

  const rawChromosomes = generateInitialPopulation(
    popSize,
    config.cargoMasterList,
    config.vehicles,
    prng
  );

  let currentPopulation: GAIndividual[] = [];
  const allEvaluatedIndividuals: GAIndividual[] = [];
  const generationSummaries: GAGenerationSummary[] = [];

  let globalTrialCounter = 1;

  // Helper to evaluate a single chromosome using 3D Bin Packing & Fitness Evaluator
  const evaluateChromosome = (
    chromosome: GAChromosome,
    generationNum: number
  ): GAIndividual => {
    const trialNum = globalTrialCounter++;
    try {
      const { recommendedResult } = evaluateAllVehicles(
        activeVehicles,
        config.cargoMasterList,
        chromosome
      );
      const trialEval = evaluateSimulationTrial(trialNum, chromosome, recommendedResult);
      const fitness = trialEval.score;

      const individual: GAIndividual = {
        id: `GA-G${generationNum}-I${trialNum}`,
        chromosome,
        trialResult: trialEval,
        fitness,
        score: trialEval.score,
        utilizationPercent: trialEval.utilizationPercent,
        generation: generationNum
      };

      allEvaluatedIndividuals.push(individual);
      return individual;
    } catch {
      const failedTrial = evaluateSimulationTrial(trialNum, chromosome, null);
      const individual: GAIndividual = {
        id: `GA-G${generationNum}-I${trialNum}`,
        chromosome,
        trialResult: failedTrial,
        fitness: 0,
        score: 0,
        utilizationPercent: 0,
        generation: generationNum
      };
      allEvaluatedIndividuals.push(individual);
      return individual;
    }
  };

  // 1. Evaluate Initial Population (Generation 1)
  for (let i = 0; i < rawChromosomes.length; i++) {
    const ind = evaluateChromosome(rawChromosomes[i], 1);
    currentPopulation.push(ind);

    if (config.onProgress) {
      config.onProgress(allEvaluatedIndividuals.length, popSize * genCount);
    }
  }

  let globalBestIndividual = [...currentPopulation].sort((a, b) => b.fitness - a.fitness)[0];

  // 2. Main Evolution Loop (Generations 1 to G)
  for (let gen = 1; gen <= genCount; gen++) {
    // Sort current population by fitness DESC
    currentPopulation.sort((a, b) => b.fitness - a.fitness);

    const genBest = currentPopulation[0];
    if (genBest.fitness > globalBestIndividual.fitness) {
      globalBestIndividual = genBest;
    }

    const totalFit = currentPopulation.reduce((sum, ind) => sum + ind.fitness, 0);
    const avgFit = Number((totalFit / (currentPopulation.length || 1)).toFixed(1));

    generationSummaries.push({
      generation: gen,
      bestFitness: genBest.fitness,
      bestScore: genBest.score,
      bestUtilization: genBest.utilizationPercent,
      averageFitness: avgFit,
      bestIndividual: genBest
    });

    // If reached max generation, break loop
    if (gen === genCount) break;

    // Build Next Generation Population (Elitism + Selection + Crossover + Mutation)
    const nextPopulation: GAIndividual[] = [];

    // A. Elitism: Retain 2 best individuals directly
    const elitismCount = Math.min(config.elitismCount || 2, currentPopulation.length);
    for (let e = 0; e < elitismCount; e++) {
      nextPopulation.push(currentPopulation[e]);
    }

    // B. Produce remaining offspring
    while (nextPopulation.length < popSize) {
      const parent1 = tournamentSelection(currentPopulation, config.tournamentSize || 3, prng);
      const parent2 = tournamentSelection(currentPopulation, config.tournamentSize || 3, prng);

      const { child1, child2 } = onePointCrossover(
        parent1.chromosome,
        parent2.chromosome,
        config.crossoverRate || 0.85,
        prng
      );

      const mutatedChild1 = mutateChromosome(child1, config.mutationRate || 0.15, prng);
      const mutatedChild2 = mutateChromosome(child2, config.mutationRate || 0.15, prng);

      const ind1 = evaluateChromosome(mutatedChild1, gen + 1);
      nextPopulation.push(ind1);

      if (config.onProgress) {
        config.onProgress(allEvaluatedIndividuals.length, popSize * genCount);
      }

      if (nextPopulation.length < popSize) {
        const ind2 = evaluateChromosome(mutatedChild2, gen + 1);
        nextPopulation.push(ind2);

        if (config.onProgress) {
          config.onProgress(allEvaluatedIndividuals.length, popSize * genCount);
        }
      }

      // Yield briefly to main thread for smooth progress rendering
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    currentPopulation = nextPopulation;
  }

  return {
    generations: generationSummaries,
    allEvaluatedIndividuals,
    bestIndividual: globalBestIndividual
  };
}
