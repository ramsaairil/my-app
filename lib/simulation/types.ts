import { CargoInputSelection, OptimizationResult, Vehicle } from "../types";

export interface CargoQuantityMap {
  [cargoId: string]: number;
}

export interface SimulationTrialResult {
  simulationNumber: number; // 1 to 100
  combination: CargoQuantityMap;
  totalRequestedItems: number;
  totalPlacedItems: number;
  totalUnplacedItems: number;
  cargoVolumeM3: number;
  vehicleCapacityM3: number;
  vehicleName: string;
  vehicleId: string;
  utilizationPercent: number;
  placementRatePercent: number;
  score: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  optimizationResult: OptimizationResult | null;
}

export interface SimulationRunSummary {
  runId: string;
  seed: number;
  createdAt: string;
  totalTrials: number;
  successfulTrials: number;
  partialTrials: number;
  failedTrials: number;
  averageUtilizationPercent: number;
  bestUtilizationPercent: number;
  bestScore: number;
  bestTrial: SimulationTrialResult | null;
  trials: SimulationTrialResult[];
  rankedTrials: SimulationTrialResult[];
}
