"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Trophy,
  Info,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Box,
  Truck,
  RotateCcw,
  Sparkles,
  Sliders,
  Play
} from "lucide-react";
import { Vehicle, CargoMasterItem } from "../../lib/types";
import { getStoredVehicles, getStoredCargos, VEHICLE_PRESETS, calculateVolumeM3 } from "../../lib/storage";
import { fetchTrucksFromDb, fetchCargosFromDb } from "../../lib/db";
import { runSimulationBatch } from "../../lib/simulation/simulationRunner";
import { SimulationRunSummary, SimulationTrialResult } from "../../lib/simulation/types";

export default function SimulationPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cargoMaster, setCargoMaster] = useState<CargoMasterItem[]>([]);

  // Simulation Configuration State
  const [seed, setSeed] = useState<number>(20260811);
  const [totalTrialsConfig, setTotalTrialsConfig] = useState<number>(100);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 100 });

  // Simulation Summary Results State
  const [summary, setSummary] = useState<SimulationRunSummary | null>(null);

  // Table Filters & Search
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "PARTIAL" | "FAILED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"RANK" | "SCORE" | "UTILIZATION" | "ITEMS">("RANK");

  // Selected Trial Detail Modal
  const [selectedTrialModal, setSelectedTrialModal] = useState<SimulationTrialResult | null>(null);

  // Load master data on mount
  useEffect(() => {
    async function loadMasterData() {
      const [dbTrucks, dbCargos] = await Promise.all([
        fetchTrucksFromDb(),
        fetchCargosFromDb()
      ]);

      let loadedVehicles = getStoredVehicles();
      if (dbTrucks && dbTrucks.length > 0) {
        const mappedTrucks: Vehicle[] = dbTrucks.map((t) => ({
          id: t.id,
          name: t.truck_name || t.id,
          type: "Box Truck 3D",
          lengthCm: t.length_cm || 450,
          widthCm: t.width_cm || 200,
          heightCm: t.height_cm || 200,
          volumeM3: Number(t.max_volume_m3 || 18.0),
          status: t.status === "Maintenance" ? "Nonaktif" : "Aktif"
        }));
        loadedVehicles = mappedTrucks;
      }
      if (loadedVehicles.length === 0) {
        loadedVehicles = VEHICLE_PRESETS.map((p, idx) => ({
          id: `PRESET-${idx + 1}`,
          name: p.name,
          type: p.type,
          lengthCm: p.lengthCm,
          widthCm: p.widthCm,
          heightCm: p.heightCm,
          volumeM3: calculateVolumeM3(p.lengthCm, p.widthCm, p.heightCm),
          status: "Aktif"
        }));
      }
      setVehicles(loadedVehicles);

      let loadedCargos = getStoredCargos();
      if (dbCargos && dbCargos.length > 0) {
        const mappedCargos: CargoMasterItem[] = dbCargos.map((item, idx) => {
          const dimsStr = (item.dimension || "40x30x30").replace(/\s*cm/gi, "").replace(/[\*×]/g, "x");
          const parts = dimsStr.split("x").map((n) => Number(n.trim()) || 30);
          const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];
          return {
            id: item.id,
            name: item.name || item.id,
            code: item.category || item.id,
            lengthCm: parts[0] || 40,
            widthCm: parts[1] || 30,
            heightCm: parts[2] || 30,
            volumeM3: Number(item.volume_m3 || calculateVolumeM3(parts[0] || 40, parts[1] || 30, parts[2] || 30)),
            color: colors[idx % colors.length]
          };
        });
        loadedCargos = mappedCargos;
      }
      setCargoMaster(loadedCargos);
    }

    loadMasterData();
  }, []);

  // Run 100 Simulations Batch Engine
  const handleStartSimulation = async () => {
    if (cargoMaster.length === 0 || vehicles.length === 0) {
      alert("Data barang atau kendaraan belum tersedia.");
      return;
    }

    setIsRunning(true);
    setProgress({ completed: 0, total: totalTrialsConfig });

    try {
      const summaryResult = await runSimulationBatch({
        seed,
        totalTrials: totalTrialsConfig,
        vehicles,
        cargoMasterList: cargoMaster,
        onProgress: (completed, total) => {
          setProgress({ completed, total });
        }
      });

      setSummary(summaryResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan pada simulasi: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Pre-load full precomputed optimization result and navigate to 3D Optimization page
  const handleOpenIn3DVisualizer = (trial: SimulationTrialResult) => {
    if (!trial.optimizationResult) {
      alert("Data visualisasi untuk percobaan ini tidak tersedia.");
      return;
    }

    try {
      const payload = JSON.stringify({
        simulationNumber: trial.simulationNumber,
        combination: trial.combination,
        optimizationResult: trial.optimizationResult
      });
      sessionStorage.setItem("SIMULATION_PRELOAD_RESULT", payload);
      localStorage.setItem("SIMULATION_PRELOAD_RESULT", payload);
    } catch (e) {
      console.error("Storage error", e);
    }
    router.push(`/optimasi?simId=${trial.simulationNumber}`);
  };

  // Helper map to lookup cargo name by ID
  const cargoNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    cargoMaster.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [cargoMaster]);

  // Table Data Processing (Filter, Search, Sort)
  const filteredAndSortedTrials = useMemo(() => {
    if (!summary) return [];

    let list = [...summary.trials];

    // Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const matchNum = `#${t.simulationNumber}`.includes(q);
        const matchVehicle = t.vehicleName.toLowerCase().includes(q);
        const matchCargo = Object.entries(t.combination).some(([id, qty]) => {
          const name = cargoNameMap[id] || id;
          return name.toLowerCase().includes(q) && qty > 0;
        });
        return matchNum || matchVehicle || matchCargo;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "RANK") {
        const rankA = summary.rankedTrials.findIndex((rt) => rt.simulationNumber === a.simulationNumber);
        const rankB = summary.rankedTrials.findIndex((rt) => rt.simulationNumber === b.simulationNumber);
        return rankA - rankB;
      }
      if (sortBy === "SCORE") return b.score - a.score;
      if (sortBy === "UTILIZATION") return b.utilizationPercent - a.utilizationPercent;
      if (sortBy === "ITEMS") return b.totalPlacedItems - a.totalPlacedItems;
      return a.simulationNumber - b.simulationNumber;
    });

    return list;
  }, [summary, statusFilter, searchQuery, sortBy, cargoNameMap]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">

      {/* Main Page Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 sm:p-9 space-y-7">
        <div className="max-w-[1320px] mx-auto space-y-7">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7EBF0]">
            <div>
              <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
                Simulasi Kombinasi Muatan
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Evaluasi {totalTrialsConfig} kombinasi muatan menggunakan algoritma optimasi 3D.
              </p>
            </div>

            {/* Run Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-[#E7EBF0] px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="text-[#667085]">Seed:</span>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 20260811)}
                  disabled={isRunning}
                  className="w-24 font-bold text-[#172033] focus:outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-1 bg-white border border-[#E7EBF0] p-1 rounded-lg text-xs font-semibold">
                {[50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTotalTrialsConfig(count)}
                    disabled={isRunning}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${totalTrialsConfig === count
                      ? "bg-[#087F5B] text-white"
                      : "text-[#667085] hover:bg-[#F8FAFC]"
                      }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartSimulation}
                disabled={isRunning}
                className={`px-5 py-2.5 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-xs ${isRunning
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-[#087F5B] hover:bg-[#066B4D]"
                  }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing ({progress.completed}/{progress.total})</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Jalankan {totalTrialsConfig} Simulasi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar when running */}
          {isRunning && (
            <div className="bg-white border border-[#087F5B]/30 rounded-xl p-5 space-y-2 shadow-sm animate-pulse">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#087F5B] flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
                  Simulasi sedang berjalan... ({progress.completed} / {progress.total} Percobaan)
                </span>
                <span className="text-[#172033] font-mono font-bold">
                  {Math.round((progress.completed / (progress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#E7EBF0] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#087F5B] h-full transition-all duration-200"
                  style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Method Context Card for Thesis Defense / Presentation */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-[#E8F7F1] flex items-center justify-center text-[#087F5B] shrink-0 mt-0.5">
              <Info size={18} />
            </div>
            <div className="space-y-1 text-xs leading-relaxed">
              <h3 className="font-bold text-[#172033]">Metode Evaluasi Kombinasi</h3>
              <p className="text-[#667085]">
                Sistem menghasilkan {totalTrialsConfig} kombinasi muatan yang berbeda berdasarkan seed teruji. Setiap kombinasi diproses secara otomatis menggunakan algoritma optimasi 3D. Hasil kemudian dibandingkan berdasarkan keberhasilan penempatan muatan, tingkat utilisasi ruang kendaraan, jumlah muatan yang tidak terpasang, dan skor evaluasi.
              </p>
            </div>
          </div>

          {summary && (
            <>
              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">TOTAL PERCOBAAN</span>
                  <span className="text-2xl sm:text-3xl font-bold text-[#172033] block">{summary.totalTrials}</span>
                  <span className="text-[12px] text-[#667085]">Run ID: {summary.runId}</span>
                </div>

                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">PERCOBAAN BERHASIL</span>
                  <span className="text-2xl sm:text-3xl font-bold text-[#087F5B] block">{summary.successfulTrials} / {summary.totalTrials}</span>
                  <span className="text-[12px] text-[#667085]">100% muatan dimuat</span>
                </div>

                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">RATA-RATA UTILISASI</span>
                  <span className="text-2xl sm:text-3xl font-bold text-[#172033] block">{summary.averageUtilizationPercent}%</span>
                  <span className="text-[12px] text-[#667085]">Seluruh {summary.totalTrials} percobaan</span>
                </div>

                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">HASIL TERBAIK</span>
                  <span className="text-2xl sm:text-3xl font-bold text-[#087F5B] block">Score {summary.bestScore}</span>
                  <span className="text-[12px] text-[#667085]">Utilisasi {summary.bestUtilizationPercent}%</span>
                </div>
              </div>

              {/* Best Result Highlight Card */}
              {summary.bestTrial && (
                <div className="bg-[#E8F7F1] border border-[#087F5B]/30 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#087F5B] text-white text-xs font-bold rounded">
                        HASIL TERBAIK (RANK #1)
                      </span>
                      <span className="text-xs font-mono text-[#087F5B] font-semibold">
                        Percobaan #{summary.bestTrial.simulationNumber}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-[#172033]">
                      Kendaraan {summary.bestTrial.vehicleName} • Score {summary.bestTrial.score}
                    </h2>

                    <div className="flex flex-wrap items-center gap-6 text-xs text-[#172033]">
                      <div>
                        <span className="text-[#667085] block text-[11px]">Tingkat Utilisasi</span>
                        <span className="font-bold text-[#087F5B] text-sm">{summary.bestTrial.utilizationPercent}%</span>
                      </div>
                      <div>
                        <span className="text-[#667085] block text-[11px]">Penempatan Muatan</span>
                        <span className="font-bold text-[#172033] text-sm">
                          {summary.bestTrial.totalPlacedItems} / {summary.bestTrial.totalRequestedItems} unit (100%)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667085] block text-[11px]">Volume Terisi</span>
                        <span className="font-bold text-[#087F5B] text-sm">{summary.bestTrial.cargoVolumeM3} m³</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setSelectedTrialModal(summary.bestTrial)}
                      className="px-4 py-2 bg-white border border-[#E7EBF0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Lihat Detail
                    </button>
                    <button
                      onClick={() => handleOpenIn3DVisualizer(summary.bestTrial!)}
                      className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Lihat Visualisasi 3D</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* 2D Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">

                {/* Chart 1: Utilisasi Kendaraan per Percobaan */}
                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E7EBF0]">
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#087F5B]" />
                      Utilisasi Kendaraan per Percobaan (1–{summary.totalTrials})
                    </h3>
                  </div>

                  {/* SVG Line/Bar Chart */}
                  <div className="w-full h-[220px] flex items-end gap-[2px] pt-4 px-2 border-b border-l border-[#E7EBF0] relative">
                    {summary.trials.map((t, idx) => {
                      const heightPct = Math.max(5, Math.min(100, t.utilizationPercent));
                      const isTopRank = summary.rankedTrials.slice(0, 3).some((rt) => rt.simulationNumber === t.simulationNumber);
                      return (
                        <div
                          key={t.simulationNumber}
                          onClick={() => setSelectedTrialModal(t)}
                          className="flex-1 group relative cursor-pointer h-full flex items-end"
                        >
                          <div
                            className={`w-full transition-all rounded-t-xs ${isTopRank
                              ? "bg-[#087F5B]"
                              : t.status === "SUCCESS"
                                ? "bg-[#3B82F6] group-hover:bg-[#2563EB]"
                                : t.status === "PARTIAL"
                                  ? "bg-amber-400 group-hover:bg-amber-500"
                                  : "bg-rose-400 group-hover:bg-rose-500"
                              }`}
                            style={{ height: `${heightPct}%` }}
                          />
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap z-30 shadow-lg">
                            #{t.simulationNumber}: {t.utilizationPercent}% ({t.vehicleName})
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#667085]">
                    <span>Percobaan #1</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#087F5B] rounded-xs" /> Top 3</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-xs" /> Success</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-xs" /> Partial</span>
                    </div>
                    <span>Percobaan #{summary.totalTrials}</span>
                  </div>
                </div>

                {/* Chart 2: Skor Ranking 100 Kombinasi */}
                <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E7EBF0]">
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                      <Trophy size={16} className="text-[#087F5B]" />
                      Distribusi Skor Ranking ({summary.totalTrials} Percobaan)
                    </h3>
                  </div>

                  {/* SVG Line Chart for Ranked Scores */}
                  <div className="w-full h-[220px] flex items-end gap-[2px] pt-4 px-2 border-b border-l border-[#E7EBF0] relative">
                    {summary.rankedTrials.map((t, idx) => {
                      const heightPct = Math.max(5, Math.min(100, t.score));
                      return (
                        <div
                          key={t.simulationNumber}
                          onClick={() => setSelectedTrialModal(t)}
                          className="flex-1 group relative cursor-pointer h-full flex items-end"
                        >
                          <div
                            className={`w-full transition-all rounded-t-xs ${idx < 10
                              ? "bg-[#087F5B]"
                              : idx < 30
                                ? "bg-slate-700"
                                : "bg-slate-400"
                              }`}
                            style={{ height: `${heightPct}%` }}
                          />
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap z-30 shadow-lg">
                            Rank #{idx + 1} (Trial #{t.simulationNumber}): Score {t.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#667085]">
                    <span>Rank #1 (Score {summary.bestScore})</span>
                    <span>Rank #{summary.totalTrials} (Score {summary.rankedTrials[summary.rankedTrials.length - 1]?.score || 0})</span>
                  </div>
                </div>

              </div>

              {/* Top 10 Kombinasi Terbaik Section */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#E7EBF0]">
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <Trophy size={16} className="text-[#087F5B]" />
                    Top 10 Kombinasi Terbaik
                  </h3>
                  <span className="text-xs text-[#667085]">Diurutkan berdasarkan Skor Evaluasi & Utilisasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {summary.rankedTrials.slice(0, 10).map((t, idx) => (
                    <div
                      key={t.simulationNumber}
                      onClick={() => setSelectedTrialModal(t)}
                      className="p-3 bg-[#F8FAFC] border border-[#E7EBF0] hover:border-[#087F5B]/50 rounded-lg space-y-1.5 cursor-pointer transition-all hover:bg-white"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${idx === 0 ? "bg-[#087F5B]" : idx < 3 ? "bg-emerald-600" : "bg-slate-700"
                          }`}>
                          Rank #{idx + 1}
                        </span>
                        <span className="text-[11px] font-mono text-[#667085]">#{t.simulationNumber}</span>
                      </div>

                      <div className="font-bold text-xs text-[#172033] truncate">{t.vehicleName}</div>
                      <div className="text-[11px] text-[#087F5B] font-semibold">
                        Utilisasi {t.utilizationPercent}% • Score {t.score}
                      </div>
                      <div className="text-[10px] text-[#667085]">
                        Muatan: {t.totalPlacedItems}/{t.totalRequestedItems} unit
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filterable & Searchable 100 Results Table */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">

                {/* Table Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E7EBF0]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#172033]">
                      Tabel Hasil {summary.totalTrials} Percobaan
                    </h3>
                    <span className="text-xs font-mono text-[#667085]">
                      ({filteredAndSortedTrials.length} data)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E7EBF0] p-1 rounded-lg text-xs font-semibold">
                      <button
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-2.5 py-1 rounded cursor-pointer ${statusFilter === "ALL" ? "bg-[#087F5B] text-white" : "text-[#667085] hover:bg-white"
                          }`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setStatusFilter("SUCCESS")}
                        className={`px-2.5 py-1 rounded cursor-pointer ${statusFilter === "SUCCESS" ? "bg-[#087F5B] text-white" : "text-[#667085] hover:bg-white"
                          }`}
                      >
                        Success
                      </button>
                      <button
                        onClick={() => setStatusFilter("PARTIAL")}
                        className={`px-2.5 py-1 rounded cursor-pointer ${statusFilter === "PARTIAL" ? "bg-[#087F5B] text-white" : "text-[#667085] hover:bg-white"
                          }`}
                      >
                        Partial
                      </button>
                    </div>

                    {/* Sort Selector */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E7EBF0] text-xs font-semibold rounded-lg text-[#172033] focus:outline-none"
                    >
                      <option value="RANK">Urutkan: Rank</option>
                      <option value="SCORE">Urutkan: Score</option>
                      <option value="UTILIZATION">Urutkan: Utilisasi</option>
                      <option value="ITEMS">Urutkan: Total Barang</option>
                    </select>

                    {/* Search Field */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
                      <input
                        type="text"
                        placeholder="Cari percobaan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E7EBF0] text-xs rounded-lg text-[#172033] focus:outline-none w-40 sm:w-48"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7EBF0] text-[11px] font-bold text-[#667085] uppercase tracking-wider bg-[#F8FAFC]">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Percobaan</th>
                        <th className="py-3 px-4">Kombinasi Barang</th>
                        <th className="py-3 px-4">Kendaraan</th>
                        <th className="py-3 px-4 text-center">Total Item</th>
                        <th className="py-3 px-4 text-center">Berhasil</th>
                        <th className="py-3 px-4 text-center">Gagal</th>
                        <th className="py-3 px-4 text-right">Utilisasi</th>
                        <th className="py-3 px-4 text-right">Score</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EBF0] text-xs">
                      {filteredAndSortedTrials.map((trial) => {
                        const rankIdx = summary.rankedTrials.findIndex((rt) => rt.simulationNumber === trial.simulationNumber) + 1;
                        return (
                          <tr key={trial.simulationNumber} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                              #{rankIdx}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#667085]">
                              #{trial.simulationNumber}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#172033] max-w-[200px] truncate">
                              {Object.entries(trial.combination)
                                .map(([id, qty]) => `${cargoNameMap[id] || id}: ${qty}`)
                                .join(" • ")}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#172033]">
                              {trial.vehicleName}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#172033]">
                              {trial.totalRequestedItems}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-[#087F5B]">
                              {trial.totalPlacedItems}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-rose-600">
                              {trial.totalUnplacedItems}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#087F5B]">
                              {trial.utilizationPercent}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#172033]">
                              {trial.score}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {trial.status === "SUCCESS" ? (
                                <span className="px-2 py-0.5 bg-[#E8F7F1] text-[#087F5B] rounded text-[11px] font-semibold">
                                  Success
                                </span>
                              ) : trial.status === "PARTIAL" ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px] font-semibold">
                                  Partial
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-semibold">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedTrialModal(trial)}
                                className="px-2.5 py-1 bg-white border border-[#E7EBF0] hover:bg-[#F8FAFC] text-[#172033] rounded text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}

        </div>
      </div>

      {/* Trial Detail Modal */}
      {selectedTrialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7EBF0] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-[#E7EBF0] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#087F5B] uppercase tracking-wider block">
                  DETAIL PERCOBAAN #{selectedTrialModal.simulationNumber}
                </span>
                <h3 className="text-lg font-bold text-[#172033]">
                  Kendaraan: {selectedTrialModal.vehicleName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrialModal(null)}
                className="p-1 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E7EBF0]">
              <div>
                <span className="text-[10px] text-[#667085] uppercase block">SCORE</span>
                <span className="text-lg font-bold text-[#172033]">{selectedTrialModal.score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase block">UTILISASI</span>
                <span className="text-lg font-bold text-[#087F5B]">{selectedTrialModal.utilizationPercent}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase block">ITEM</span>
                <span className="text-lg font-bold text-[#172033]">{selectedTrialModal.totalPlacedItems}/{selectedTrialModal.totalRequestedItems}</span>
              </div>
            </div>

            {/* Combination Items Rincian */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#172033]">Rincian Kombinasi Muatan:</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {Object.entries(selectedTrialModal.combination).map(([cargoId, qty]) => (
                  <div key={cargoId} className="flex justify-between items-center text-xs p-2 bg-[#F8FAFC] rounded border border-[#E7EBF0]">
                    <span className="font-semibold text-[#172033]">{cargoNameMap[cargoId] || cargoId}</span>
                    <span className="font-mono font-bold text-[#087F5B]">{qty} unit</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E7EBF0] flex justify-end gap-3">
              <button
                onClick={() => setSelectedTrialModal(null)}
                className="px-4 py-2 border border-[#E7EBF0] text-[#172033] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC]"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const t = selectedTrialModal;
                  setSelectedTrialModal(null);
                  handleOpenIn3DVisualizer(t);
                }}
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <span>Lihat Visualisasi 3D</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
