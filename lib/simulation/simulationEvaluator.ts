import { OptimizationResult } from "../types";
import { CargoQuantityMap, SimulationTrialResult } from "./types";

/**
 * Evaluates the output of a single simulation trial using the core optimization result.
 * 
 * Evaluation Score Formula:
 * SCORE = (Placement Rate % * 0.70) + (Volume Utilization % * 0.30) - (Unplaced Items Count * 10)
 * 
 * Priorities:
 * 1. Placement success rate (all items placed = 100%)
 * 2. High vehicle volume utilization %
 * 3. Penalty for unplaced items
 */
export function evaluateSimulationTrial(
  simulationNumber: number,
  combinationSelections: { cargoId: string; quantity: number }[],
  optResult: OptimizationResult | null
): SimulationTrialResult {
  const combinationMap: CargoQuantityMap = {};
  combinationSelections.forEach((s) => {
    combinationMap[s.cargoId] = s.quantity;
  });

  if (!optResult) {
    return {
      simulationNumber,
      combination: combinationMap,
      totalRequestedItems: combinationSelections.reduce((sum, s) => sum + s.quantity, 0),
      totalPlacedItems: 0,
      totalUnplacedItems: combinationSelections.reduce((sum, s) => sum + s.quantity, 0),
      cargoVolumeM3: 0,
      vehicleCapacityM3: 0,
      vehicleName: "-",
      vehicleId: "-",
      utilizationPercent: 0,
      placementRatePercent: 0,
      score: 0,
      status: "FAILED",
      optimizationResult: null
    };
  }

  const {
    totalBoxesRequested,
    totalBoxesPacked,
    totalBoxesUnpacked,
    usedVolumeM3,
    vehicleVolumeM3,
    utilizationPercent,
    vehicle
  } = optResult;

  const placementRatePercent = totalBoxesRequested > 0
    ? (totalBoxesPacked / totalBoxesRequested) * 100
    : 0;

  const status: "SUCCESS" | "PARTIAL" | "FAILED" =
    totalBoxesUnpacked === 0
      ? "SUCCESS"
      : totalBoxesPacked > 0
      ? "PARTIAL"
      : "FAILED";

  // Score Formula: (placementRate * 0.70) + (utilization * 0.30) - (unplaced * 10)
  const rawScore =
    (placementRatePercent * 0.70) +
    (utilizationPercent * 0.30) -
    (totalBoxesUnpacked * 10);

  const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));

  return {
    simulationNumber,
    combination: combinationMap,
    totalRequestedItems: totalBoxesRequested,
    totalPlacedItems: totalBoxesPacked,
    totalUnplacedItems: totalBoxesUnpacked,
    cargoVolumeM3: usedVolumeM3,
    vehicleCapacityM3: vehicleVolumeM3,
    vehicleName: vehicle.name,
    vehicleId: vehicle.id,
    utilizationPercent: Number(utilizationPercent.toFixed(1)),
    placementRatePercent: Number(placementRatePercent.toFixed(1)),
    score,
    status,
    optimizationResult: optResult
  };
}
