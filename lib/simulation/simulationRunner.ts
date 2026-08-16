import { CargoMasterItem, Vehicle } from "../types";
import { runGeneticAlgorithm } from "../geneticAlgorithm/gaEngine";
import { SimulationRunSummary, SimulationTrialResult } from "./types";

export interface RunSimulationOptions {
  seed?: number;
  totalTrials?: number;
  vehicles: Vehicle[];
  cargoMasterList: CargoMasterItem[];
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Runs 100 3D bin packing simulations asynchronously using the Genetic Algorithm (GA) Optimization Engine.
 * Evaluates Population (N=20) x Generations (G=5) = 100 total candidate evaluations.
 */
export async function runSimulationBatch(options: RunSimulationOptions): Promise<SimulationRunSummary> {
  const seed = options.seed || Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const runId = `GA-SIM-${seed}-${Date.now().toString().slice(-4)}`;

  // Run Genetic Algorithm Engine
  const gaResult = await runGeneticAlgorithm({
    seed,
    populationSize: 20,
    generationsCount: 5,
    crossoverRate: 0.85,
    mutationRate: 0.15,
    elitismCount: 2,
    tournamentSize: 3,
    cargoMasterList: options.cargoMasterList,
    vehicles: options.vehicles,
    onProgress: options.onProgress
  });

  const rawTrials: SimulationTrialResult[] = gaResult.allEvaluatedIndividuals.map(
    (ind) => ind.trialResult
  );
  const totalTrials = rawTrials.length;

  // Ranking Algorithm for evaluated GA individuals:
  // 1. Status SUCCESS over PARTIAL over FAILED
  // 2. Score DESC
  // 3. Utilization DESC
  // 4. Placed items count DESC
  const rankedTrials = [...rawTrials].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "SUCCESS") return -1;
      if (b.status === "SUCCESS") return 1;
      if (a.status === "PARTIAL") return -1;
      if (b.status === "PARTIAL") return 1;
    }
    if (b.score !== a.score) return b.score - a.score;
    if (b.utilizationPercent !== a.utilizationPercent) return b.utilizationPercent - a.utilizationPercent;
    return b.totalPlacedItems - a.totalPlacedItems;
  });

  const successfulTrials = rawTrials.filter((t) => t.status === "SUCCESS").length;
  const partialTrials = rawTrials.filter((t) => t.status === "PARTIAL").length;
  const failedTrials = rawTrials.filter((t) => t.status === "FAILED").length;

  const totalVolUtil = rawTrials.reduce((sum, t) => sum + t.utilizationPercent, 0);
  const averageUtilizationPercent = Number((totalVolUtil / (totalTrials || 1)).toFixed(1));

  const bestTrial = gaResult.bestIndividual ? gaResult.bestIndividual.trialResult : rankedTrials[0] || null;
  const bestUtilizationPercent = bestTrial ? bestTrial.utilizationPercent : 0;
  const bestScore = bestTrial ? bestTrial.score : 0;

  return {
    runId,
    seed,
    createdAt: new Date().toISOString(),
    totalTrials,
    successfulTrials,
    partialTrials,
    failedTrials,
    averageUtilizationPercent,
    bestUtilizationPercent,
    bestScore,
    bestTrial,
    trials: rawTrials,
    rankedTrials
  };
}
