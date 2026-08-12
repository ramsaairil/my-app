import { evaluateAllVehicles } from "../binPacking";
import { CargoMasterItem, Vehicle } from "../types";
import { generateCargoCombinations } from "./combinationGenerator";
import { evaluateSimulationTrial } from "./simulationEvaluator";
import { SimulationRunSummary, SimulationTrialResult } from "./types";

export interface RunSimulationOptions {
  seed?: number;
  totalTrials?: number;
  vehicles: Vehicle[];
  cargoMasterList: CargoMasterItem[];
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Runs 100 3D bin packing simulations asynchronously using the existing optimization engine.
 * Runs in calculation mode (headless / zero 3D WebGL renderers) to ensure 0 browser freezing.
 */
export async function runSimulationBatch(options: RunSimulationOptions): Promise<SimulationRunSummary> {
  const seed = options.seed || Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
  const totalTrials = Math.min(100, Math.max(1, options.totalTrials || 25));
  const runId = `SIM-${seed}-${Date.now().toString().slice(-4)}`;

  const combinations = generateCargoCombinations({
    seed,
    totalTrials,
    cargoMasterList: options.cargoMasterList,
    vehicles: options.vehicles
  });

  const rawTrials: SimulationTrialResult[] = [];
  const activeVehicles = options.vehicles.filter((v) => v.status !== "Nonaktif");

  for (let i = 0; i < totalTrials; i++) {
    const trialSelections = combinations[i];

    try {
      // Call existing 3D Bin Packing optimizer directly as a pure mathematical calculation service
      const { recommendedResult } = evaluateAllVehicles(
        activeVehicles,
        options.cargoMasterList,
        trialSelections
      );

      const trialEval = evaluateSimulationTrial(i + 1, trialSelections, recommendedResult);
      rawTrials.push(trialEval);
    } catch (err) {
      // Error isolation: If one trial fails, record as FAILED and continue to remaining trials
      const failedTrial = evaluateSimulationTrial(i + 1, trialSelections, null);
      rawTrials.push(failedTrial);
    }

    if (options.onProgress && (i % 3 === 0 || i === totalTrials - 1)) {
      options.onProgress(i + 1, totalTrials);
      // Yield to main UI thread so progress bar renders smoothly
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // Ranking Algorithm for 100 trials:
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

  const bestTrial = rankedTrials[0] || null;
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
