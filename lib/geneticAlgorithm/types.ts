import { CargoMasterItem, Vehicle, OptimizationResult } from "../types";
import { SimulationTrialResult } from "../simulation/types";

export interface GAGene {
  cargoId: string;
  quantity: number;
}

export type GAChromosome = GAGene[];

export interface GAIndividual {
  id: string;
  chromosome: GAChromosome;
  trialResult: SimulationTrialResult;
  fitness: number;
  score: number;
  utilizationPercent: number;
  generation: number;
}

export interface GAGenerationSummary {
  generation: number;
  bestFitness: number;
  bestScore: number;
  bestUtilization: number;
  averageFitness: number;
  bestIndividual: GAIndividual;
}

export interface GARunResult {
  generations: GAGenerationSummary[];
  allEvaluatedIndividuals: GAIndividual[];
  bestIndividual: GAIndividual;
}

export interface GAConfig {
  seed: number;
  populationSize: number; // e.g. 20
  generationsCount: number; // e.g. 5
  crossoverRate: number; // e.g. 0.85
  mutationRate: number; // e.g. 0.15
  elitismCount: number; // e.g. 2
  tournamentSize: number; // e.g. 3
  cargoMasterList: CargoMasterItem[];
  vehicles: Vehicle[];
  onProgress?: (completed: number, total: number) => void;
}
