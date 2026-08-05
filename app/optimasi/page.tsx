"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import {
  Truck,
  Package,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Printer,
  X,
  Zap,
  Box as BoxIcon,
  ShieldCheck,
  Compass
} from "lucide-react";
import {
  Vehicle,
  CargoMasterItem,
  CargoInputSelection,
  OptimizationResult,
  PlacedBox3D
} from "../../lib/types";
import { getStoredVehicles, getStoredCargos } from "../../lib/storage";
import { evaluateAllVehicles, packVehicle } from "../../lib/binPacking";

// --- 3D RENDERING COMPONENT ---
interface RenderBoxProps {
  box: PlacedBox3D;
  containerW: number;
  containerH: number;
  containerL: number;
  scale: number;
  isAnimatedVisible: boolean;
}

const Box3DItem: React.FC<RenderBoxProps> = ({
  box,
  containerW,
  containerH,
  containerL,
  scale,
  isAnimatedVisible
}) => {
  if (!isAnimatedVisible) return null;

  // Convert dimensions from cm to 3D CSS px units
  // Container X=Width, Y=Height, Z=Length
  const pxW = Math.max(14, box.wCm * scale);
  const pxH = Math.max(14, box.hCm * scale);
  const pxL = Math.max(14, box.lCm * scale);

  const tx = box.xCm * scale;
  // CSS origin: invert Y coordinate so Y=0 is bottom floor
  const ty = (containerH - box.yCm - box.hCm) * scale;
  const tz = -box.zCm * scale;

  const halfL = pxL / 2;

  return (
    <div
      className="absolute transition-all duration-300 pointer-events-none group"
      style={{
        width: `${pxW}px`,
        height: `${pxH}px`,
        transformStyle: "preserve-3d",
        transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`
      }}
    >
      {/* Front Face */}
      <div
        className="absolute inset-0 border border-slate-950/50 flex items-center justify-center text-[9px] font-black text-white shadow-lg overflow-hidden select-none"
        style={{
          backgroundColor: box.color,
          transform: `translate3d(0, 0, 0)`
        }}
      >
        <span className="truncate px-0.5 drop-shadow-md">{box.cargoCode}</span>
      </div>

      {/* Back Face */}
      <div
        className="absolute inset-0 border border-slate-950/50"
        style={{
          backgroundColor: box.color,
          transform: `translate3d(0, 0, ${-pxL}px) rotateY(180deg)`,
          filter: "brightness(0.65)"
        }}
      />

      {/* Left Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/50"
        style={{
          width: `${pxL}px`,
          height: `${pxH}px`,
          backgroundColor: box.color,
          transform: `translate3d(${-halfL}px, 0, ${-halfL}px) rotateY(-90deg)`,
          filter: "brightness(0.75)"
        }}
      />

      {/* Right Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/50"
        style={{
          width: `${pxL}px`,
          height: `${pxH}px`,
          backgroundColor: box.color,
          transform: `translate3d(${pxW - halfL}px, 0, ${-halfL}px) rotateY(90deg)`,
          filter: "brightness(0.85)"
        }}
      />

      {/* Top Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/50"
        style={{
          width: `${pxW}px`,
          height: `${pxL}px`,
          backgroundColor: box.color,
          transform: `translate3d(0, ${-halfL}px, ${-halfL}px) rotateX(90deg)`,
          filter: "brightness(1.2)"
        }}
      />

      {/* Bottom Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/50"
        style={{
          width: `${pxW}px`,
          height: `${pxL}px`,
          backgroundColor: box.color,
          transform: `translate3d(0, ${pxH - halfL}px, ${-halfL}px) rotateX(-90deg)`,
          filter: "brightness(0.5)"
        }}
      />
    </div>
  );
};

export default function CustomOptimizationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cargoMaster, setCargoMaster] = useState<CargoMasterItem[]>([]);

  // Step 1: Vehicle Selection Mode ("manual" vs "recommend")
  const [vehicleMode, setVehicleMode] = useState<"manual" | "recommend">("manual");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  // Step 2: Cargo Item Quantities Input (cargoId -> quantity)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Optimization Status & Results
  const [isSolving, setIsSolving] = useState(false);
  const [activeResult, setActiveResult] = useState<OptimizationResult | null>(null);
  const [allComparisonResults, setAllComparisonResults] = useState<OptimizationResult[]>([]);

  // 3D Viewport Controls
  const [rotation, setRotation] = useState({ x: -22, y: -45 });
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Animation State
  const [animCurrentStep, setAnimCurrentStep] = useState<number>(0);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);

  // Manifest Print Modal
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  // Load master data on mount
  useEffect(() => {
    const loadedVehicles = getStoredVehicles();
    const loadedCargos = getStoredCargos();

    setVehicles(loadedVehicles);
    setCargoMaster(loadedCargos);

    const activeV = loadedVehicles.filter((v) => v.status === "Aktif");
    if (activeV.length > 0) {
      setSelectedVehicleId(activeV[0].id);
    }

    // Default sample quantities: Box A (20), Box B (15), Box C (8)
    const initialQty: Record<string, number> = {};
    loadedCargos.forEach((c, idx) => {
      if (idx === 0) initialQty[c.id] = 20;
      else if (idx === 1) initialQty[c.id] = 15;
      else if (idx === 2) initialQty[c.id] = 8;
      else initialQty[c.id] = 0;
    });
    setItemQuantities(initialQty);
  }, []);

  // Compute selected selections array
  const currentSelections: CargoInputSelection[] = useMemo(() => {
    return Object.entries(itemQuantities)
      .map(([cargoId, quantity]) => ({ cargoId, quantity }))
      .filter((s) => s.quantity > 0);
  }, [itemQuantities]);

  // Compute live requested cargo statistics
  const requestedStats = useMemo(() => {
    let totalBoxes = 0;
    let totalVolM3 = 0;
    let distinctTypes = 0;

    currentSelections.forEach((sel) => {
      const cargo = cargoMaster.find((c) => c.id === sel.cargoId);
      if (cargo && sel.quantity > 0) {
        distinctTypes += 1;
        totalBoxes += sel.quantity;
        totalVolM3 += cargo.volumeM3 * sel.quantity;
      }
    });

    return {
      totalBoxes,
      totalVolM3: Number(totalVolM3.toFixed(3)),
      distinctTypes
    };
  }, [currentSelections, cargoMaster]);

  // Handle quantity change
  const handleQuantityChange = (cargoId: string, value: number) => {
    const qty = Math.max(0, Math.floor(value || 0));
    setItemQuantities((prev) => ({
      ...prev,
      [cargoId]: qty
    }));
  };

  // Run Optimization Algorithm
  const handleRunOptimization = () => {
    if (requestedStats.totalBoxes === 0) {
      alert("Harap masukkan setidaknya 1 jumlah box barang untuk dioptimalkan.");
      return;
    }

    setIsSolving(true);

    setTimeout(() => {
      const activeVehicles = vehicles.filter((v) => v.status === "Aktif");
      if (activeVehicles.length === 0) {
        alert("Tidak ada kendaraan aktif di Operasional Armada!");
        setIsSolving(false);
        return;
      }

      if (vehicleMode === "recommend") {
        const { results, recommendedResult } = evaluateAllVehicles(
          vehicles,
          cargoMaster,
          currentSelections
        );
        setAllComparisonResults(results);
        if (recommendedResult) {
          setActiveResult(recommendedResult);
          setSelectedVehicleId(recommendedResult.vehicle.id);
          setAnimCurrentStep(recommendedResult.packedBoxes.length);
        }
      } else {
        const chosenVehicle = vehicles.find((v) => v.id === selectedVehicleId) || activeVehicles[0];
        const singleResult = packVehicle(chosenVehicle, cargoMaster, currentSelections);
        const { results } = evaluateAllVehicles(vehicles, cargoMaster, currentSelections);

        const mappedResults = results.map((r) => {
          if (r.vehicle.id === chosenVehicle.id) {
            return singleResult;
          }
          return r;
        });

        setActiveResult(singleResult);
        setAllComparisonResults(mappedResults);
        setAnimCurrentStep(singleResult.packedBoxes.length);
      }

      setIsSolving(false);
    }, 400);
  };

  // Animation player loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAnim && activeResult) {
      if (animCurrentStep < activeResult.packedBoxes.length) {
        timer = setTimeout(() => {
          setAnimCurrentStep((prev) => prev + 1);
        }, 120);
      } else {
        setIsPlayingAnim(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlayingAnim, animCurrentStep, activeResult]);

  const handlePlayPauseAnim = () => {
    if (!activeResult) return;
    if (animCurrentStep >= activeResult.packedBoxes.length) {
      setAnimCurrentStep(0);
    }
    setIsPlayingAnim(!isPlayingAnim);
  };

  const handleResetAnim = () => {
    setIsPlayingAnim(false);
    if (activeResult) {
      setAnimCurrentStep(activeResult.packedBoxes.length);
    }
  };

  // Mouse Handlers for 3D Orbit View
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation((prev) => ({
      x: Math.max(-80, Math.min(80, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const activeVehicle = useMemo(() => {
    if (activeResult) return activeResult.vehicle;
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  }, [activeResult, selectedVehicleId, vehicles]);

  // Container dimensions for 3D scale calculations
  const baseScale = 0.45 * zoomScale;
  const containerWpx = (activeVehicle?.widthCm || 200) * baseScale;
  const containerHpx = (activeVehicle?.heightCm || 200) * baseScale;
  const containerLpx = (activeVehicle?.lengthCm || 450) * baseScale;

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Page Header */}
      <PageHeader title="Optimasi Muatan 3D">
        <div className="flex items-center gap-2">
          {activeResult && (
            <button
              onClick={() => setIsManifestOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
            >
              <Printer size={14} className="text-slate-500" />
              <span>Cetak Manifes</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* STEP INPUT PANEL CARD */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={16} className="text-emerald-700" />
                  Simulasi Custom Optimasi Muatan 3D
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Pilih armada dan atur kuantitas barang box untuk mendapatkan susunan 3D paling efisien.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRunOptimization}
                disabled={isSolving || requestedStats.totalBoxes === 0}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                  isSolving || requestedStats.totalBoxes === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-emerald-700/20 hover:scale-[1.02]"
                }`}
              >
                {isSolving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghitung 3D Bin Packing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="fill-white" />
                    <span>Optimalkan Muatan</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LANGKAH 1: PILIH KENDARAAN (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Pilih Kendaraan
                  </h3>
                </div>

                {/* Option Radios */}
                <div className="space-y-3">
                  {/* Radio 1: Rekomendasikan Kendaraan Terbaik */}
                  <label
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      vehicleMode === "recommend"
                        ? "bg-gradient-to-r from-emerald-50 to-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-100/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicleMode"
                      value="recommend"
                      checked={vehicleMode === "recommend"}
                      onChange={() => setVehicleMode("recommend")}
                      className="mt-1 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={15} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-slate-900">
                          Rekomendasikan Kendaraan Terbaik
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Sistem menguji seluruh armada aktif dan memilih kendaraan dengan pemanfaatan ruang paling optimal.
                      </p>
                    </div>
                  </label>

                  {/* Radio 2: Pilih Kendaraan Manual */}
                  <label
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      vehicleMode === "manual"
                        ? "bg-gradient-to-r from-emerald-50 to-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-100/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicleMode"
                      value="manual"
                      checked={vehicleMode === "manual"}
                      onChange={() => setVehicleMode("manual")}
                      className="mt-1 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                    />
                    <div className="space-y-2.5 flex-1">
                      <span className="text-xs font-black text-slate-900 block">
                        Pilih Kendaraan Secara Manual
                      </span>

                      {vehicleMode === "manual" && (
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 cursor-pointer shadow-2xs"
                        >
                          {vehicles
                            .filter((v) => v.status === "Aktif")
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} - {v.type} ({v.volumeM3} m³ | {v.lengthCm}x{v.widthCm}x{v.heightCm} cm)
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* LANGKAH 2: TAMBAH BARANG (7 cols) */}
              <div className="lg:col-span-7 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Tambah Barang Muatan
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-black">
                    <span className="text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      Total Box: {requestedStats.totalBoxes}
                    </span>
                    <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                      Total Volume: {requestedStats.totalVolM3} m³
                    </span>
                  </div>
                </div>

                {/* Cargo Item Quantities Table Input */}
                <div className="overflow-x-auto max-h-[220px] custom-scrollbar border border-slate-200/90 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-3 px-3.5">Barang Box</th>
                        <th className="py-3 px-3.5">Dimensi Unit</th>
                        <th className="py-3 px-3.5">Vol. Unit</th>
                        <th className="py-3 px-3.5 w-32 text-center">Jumlah Box</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {cargoMaster.map((cargo) => {
                        const qty = itemQuantities[cargo.id] || 0;
                        return (
                          <tr key={cargo.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-4 h-4 rounded-md border border-slate-950/20 shadow-2xs shrink-0"
                                  style={{ backgroundColor: cargo.color }}
                                />
                                <div>
                                  <span className="text-slate-900 font-black">{cargo.code}</span>
                                  <span className="text-slate-500 font-medium ml-1.5">({cargo.name})</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3.5 font-mono text-slate-700 text-[11px]">
                              {cargo.lengthCm}x{cargo.widthCm}x{cargo.heightCm} cm
                            </td>

                            <td className="py-2.5 px-3.5 text-slate-800 font-bold">
                              {cargo.volumeM3} m³
                            </td>

                            <td className="py-2.5 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(cargo.id, qty - 1)}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={qty}
                                  onChange={(e) => handleQuantityChange(cargo.id, Number(e.target.value))}
                                  className="w-14 px-1 py-1 text-center border border-slate-200 rounded-lg font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 bg-white"
                                  min={0}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(cargo.id, qty + 1)}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* VISUALISASI 3D INTERAKTIF & ANIMASI CARD */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <BoxIcon size={16} className="text-emerald-700" />
                  Visualisasi 3D Ruang & Penyusunan Box
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Visualisasi posisi koordinat 3D Bin Packing secara otomatis & teranimasi.
                </p>
              </div>

              {/* 3D Viewport Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-black text-slate-700 px-1 font-mono">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomScale((z) => Math.min(1.6, z + 0.1))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Preset View Angles */}
                <button
                  onClick={() => setRotation({ x: -22, y: -45 })}
                  className="px-3 py-1.5 text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Isometric
                </button>
                <button
                  onClick={() => setRotation({ x: -90, y: 0 })}
                  className="px-3 py-1.5 text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Atas
                </button>
                <button
                  onClick={() => setRotation({ x: 0, y: -90 })}
                  className="px-3 py-1.5 text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Samping
                </button>

                {/* Animation Controls */}
                {activeResult && (
                  <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                    <button
                      onClick={handlePlayPauseAnim}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-black shadow-xs transition-colors cursor-pointer"
                    >
                      <Play size={13} className={isPlayingAnim ? "animate-pulse" : ""} />
                      <span>{isPlayingAnim ? "Pause" : "Play Animasi"}</span>
                    </button>
                    <button
                      onClick={handleResetAnim}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                      title="Reset Tampilkan Semua"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3D Viewport Area */}
            <div className="w-full bg-slate-950 text-white rounded-3xl p-5 sm:p-6 overflow-hidden relative shadow-2xl select-none space-y-4 border border-slate-900">
              {/* Viewport Top Header Info */}
              <div className="flex justify-between items-center z-20 pb-3 border-b border-slate-900 text-[10px] font-semibold">
                <span className="text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800/80">
                  🖱️ Drag mouse untuk memutar 3D Orbit
                </span>

                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl shadow-2xs">
                    Utilisasi: {activeResult ? activeResult.utilizationPercent : 0}%
                  </span>
                  <span className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl">
                    P: {activeVehicle?.lengthCm || 0} cm
                  </span>
                  <span className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl">
                    L: {activeVehicle?.widthCm || 0} cm
                  </span>
                  <span className="px-3 py-1 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl">
                    T: {activeVehicle?.heightCm || 0} cm
                  </span>
                </div>
              </div>

              {/* 3D Scene Container */}
              <div
                className="w-full h-[430px] flex items-center justify-center cursor-grab active:cursor-grabbing relative bg-gradient-to-b from-slate-900/80 to-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden"
                style={{ perspective: "1200px" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Vehicle 3D Container Bounding Frame */}
                <div
                  className="relative transition-transform duration-100 ease-out"
                  style={{
                    width: `${containerWpx}px`,
                    height: `${containerHpx}px`,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                  }}
                >
                  {/* Container Floor (Bottom Grid) */}
                  <div
                    className="absolute top-0 left-0 border-2 border-emerald-500/50 bg-emerald-950/30"
                    style={{
                      width: `${containerWpx}px`,
                      height: `${containerLpx}px`,
                      transform: `translateY(${containerHpx}px) rotateX(-90deg)`,
                      transformOrigin: "top",
                      backgroundImage:
                        "linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}
                  />

                  {/* Back Wall */}
                  <div
                    className="absolute top-0 left-0 border border-slate-700/40 bg-slate-900/30 pointer-events-none"
                    style={{
                      width: `${containerWpx}px`,
                      height: `${containerHpx}px`,
                      transform: `translateZ(${-containerLpx}px)`
                    }}
                  />

                  {/* Left Wireframe Wall */}
                  <div
                    className="absolute top-0 left-0 border border-slate-700/40 bg-slate-900/20 pointer-events-none"
                    style={{
                      width: `${containerLpx}px`,
                      height: `${containerHpx}px`,
                      transform: `rotateY(90deg)`,
                      transformOrigin: "left"
                    }}
                  />

                  {/* Render Placed Boxes */}
                  {activeResult &&
                    activeResult.packedBoxes.map((box, i) => (
                      <Box3DItem
                        key={box.id}
                        box={box}
                        containerW={activeVehicle?.widthCm || 200}
                        containerH={activeVehicle?.heightCm || 200}
                        containerL={activeVehicle?.lengthCm || 450}
                        scale={baseScale}
                        isAnimatedVisible={i < animCurrentStep}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD HASIL OPTIMASI CARD */}
          {activeResult && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    Dashboard Hasil Optimasi
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Ringkasan performa penyusunan barang dan tingkat utilisasi ruang kendaraan.
                  </p>
                </div>

                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                    activeResult.statusLabel === "⭐ Paling Optimal"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                      : activeResult.statusLabel === "Cocok Digunakan"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : activeResult.statusLabel === "Kapasitas Berlebih"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-rose-50 text-rose-800 border-rose-300"
                  }`}
                >
                  {activeResult.statusLabel}
                </span>
              </div>

              {/* 3 Summary Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Info Kendaraan */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <Truck size={16} className="text-emerald-700" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Informasi Kendaraan
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Nama Kendaraan</span>
                      <span className="font-extrabold text-slate-900">{activeResult.vehicle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Jenis Kendaraan</span>
                      <span className="font-bold text-slate-800">{activeResult.vehicle.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Dimensi Ruang</span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeResult.vehicle.lengthCm}x{activeResult.vehicle.widthCm}x
                        {activeResult.vehicle.heightCm} cm
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-slate-500 font-medium">Volume Kendaraan</span>
                      <span className="font-black text-emerald-800">
                        {activeResult.vehicleVolumeM3} m³
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Muatan */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                    <Package size={16} className="text-indigo-700" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Informasi Muatan
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Jumlah Jenis Barang</span>
                      <span className="font-extrabold text-slate-900">
                        {requestedStats.distinctTypes} Jenis Box
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Total Box Diinput</span>
                      <span className="font-extrabold text-slate-900">
                        {activeResult.totalBoxesRequested} Box
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-slate-500 font-medium">Total Volume Barang</span>
                      <span className="font-black text-indigo-800">
                        {activeResult.cargoVolumeM3} m³
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hasil Optimasi */}
                <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 border border-emerald-200/90 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-emerald-200/90 pb-2.5">
                    <Zap size={16} className="text-emerald-700" />
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Hasil Optimasi
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Volume Terpakai</span>
                      <span className="font-extrabold text-emerald-800">
                        {activeResult.usedVolumeM3} m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Volume Tersisa</span>
                      <span className="font-extrabold text-slate-800">
                        {activeResult.remainingVolumeM3} m³
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Utilisasi Ruang</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {activeResult.utilizationPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200/90">
                      <span className="text-slate-600 font-medium">Box Termuat</span>
                      <span className="font-black text-emerald-800">
                        {activeResult.totalBoxesPacked} / {activeResult.totalBoxesRequested}
                      </span>
                    </div>
                    {activeResult.totalBoxesUnpacked > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span className="font-semibold">Belum Termuat</span>
                        <span className="font-black">{activeResult.totalBoxesUnpacked} Box</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PERBANDINGAN KENDARAAN (COMPARE VEHICLE) CARD */}
          {allComparisonResults.length > 0 && (
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3.5">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={16} className="text-emerald-700" />
                  Perbandingan Kendaraan (Compare Vehicle)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Hasil simulasi komparatif dari seluruh kendaraan aktif di armada untuk muatan saat ini.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Kendaraan</th>
                      <th className="py-3.5 px-4">Volume Kendaraan</th>
                      <th className="py-3.5 px-4">Box Termuat</th>
                      <th className="py-3.5 px-4">Utilisasi Volume</th>
                      <th className="py-3.5 px-4">Status Evaluasi</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allComparisonResults.map((res) => {
                      const isCurrent = activeResult?.vehicle.id === res.vehicle.id;
                      return (
                        <tr
                          key={res.vehicle.id}
                          className={`transition-colors ${
                            isCurrent ? "bg-emerald-50/60 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            <div>
                              <span>{res.vehicle.name}</span>
                              <span className="text-[11px] text-slate-400 font-medium ml-2">
                                ({res.vehicle.type})
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-700 font-bold">
                            {res.vehicleVolumeM3} m³
                          </td>

                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {res.totalBoxesPacked} / {res.totalBoxesRequested} Box
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="font-black text-emerald-800 min-w-[42px]">
                                {res.utilizationPercent}%
                              </span>
                              <div className="w-28 bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${res.utilizationPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                res.statusLabel === "⭐ Paling Optimal"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                                  : res.statusLabel === "Cocok Digunakan"
                                  ? "bg-blue-50 text-blue-800 border-blue-300"
                                  : res.statusLabel === "Kapasitas Berlebih"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300"
                              }`}
                            >
                              {res.statusLabel}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setActiveResult(res);
                                setSelectedVehicleId(res.vehicle.id);
                                setAnimCurrentStep(res.packedBoxes.length);
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-emerald-700 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isCurrent ? "Ditampilkan" : "Lihat 3D"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MANIFEST MODAL */}
      {isManifestOpen && activeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-7 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-sm font-black text-slate-900">Manifes Operasional Muatan 3D</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Cetak Manifes
                </button>
                <button
                  onClick={() => setIsManifestOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="space-y-5 text-slate-800">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-base font-black tracking-wider uppercase">
                  MANIFES OPERASIONAL MUATAN 3D
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Sistem AntriGravity - Optimasi Muatan Ruang Armada
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">Kendaraan</p>
                  <p className="font-black text-slate-900">{activeResult.vehicle.name} ({activeResult.vehicle.type})</p>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                    Dimensi: {activeResult.vehicle.lengthCm}x{activeResult.vehicle.widthCm}x{activeResult.vehicle.heightCm} cm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">Ringkasan Muatan</p>
                  <p className="font-black text-emerald-700">Utilisasi Volume: {activeResult.utilizationPercent}%</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Termuat: {activeResult.totalBoxesPacked} / {activeResult.totalBoxesRequested} Box ({activeResult.usedVolumeM3} m³)
                  </p>
                </div>
              </div>

              {/* Table of Placed Box Coordinates */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-[11px] font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                      <th className="py-2.5 px-3.5">Urutan</th>
                      <th className="py-2.5 px-3.5">Kode Barang</th>
                      <th className="py-2.5 px-3.5">Nama Barang</th>
                      <th className="py-2.5 px-3.5">Koordinat 3D (X, Y, Z)</th>
                      <th className="py-2.5 px-3.5">Dimensi Terpasang (P x L x T)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeResult.packedBoxes.map((box) => (
                      <tr key={box.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3.5 font-black text-slate-700">#{box.stepIndex}</td>
                        <td className="py-2.5 px-3.5 font-black text-slate-900">{box.cargoCode}</td>
                        <td className="py-2.5 px-3.5 font-sans font-bold text-slate-800">{box.cargoName}</td>
                        <td className="py-2.5 px-3.5 text-emerald-800 font-black">
                          X:{box.xCm}, Y:{box.yCm}, Z:{box.zCm} cm
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700">
                          {box.lCm}x{box.wCm}x{box.hCm} cm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}