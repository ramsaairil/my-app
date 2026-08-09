"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ZoomIn,
  ZoomOut,
  Printer,
  X,
  Zap,
  Compass,
  BarChart3,
  Plus,
  Minus
} from "lucide-react";
import {
  Vehicle,
  CargoMasterItem,
  CargoInputSelection,
  OptimizationResult,
  PlacedBox3D
} from "../../lib/types";
import { getStoredVehicles, getStoredCargos, VEHICLE_PRESETS, calculateVolumeM3 } from "../../lib/storage";
import {
  evaluateAllVehicles,
  packVehicle,
  MAX_OPTIMIZATION_ITEM_TYPES,
  MAX_OPTIMIZATION_TOTAL_ITEMS,
  canFitInAnyVehicle
} from "../../lib/binPacking";
import { fetchTrucksFromDb, fetchCargosFromDb } from "../../lib/db";

// --- 3D RENDERING COMPONENT (CANVAS) ---
interface Canvas3DProps {
  vehicle?: Vehicle;
  packedBoxes: PlacedBox3D[];
  animCurrentStep: number;
  rotation: { x: number; y: number };
  zoomScale: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

const TruckVehicleCanvas3D: React.FC<Canvas3DProps> = ({
  vehicle,
  packedBoxes,
  animCurrentStep,
  rotation,
  zoomScale,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width = canvas.parentElement?.clientWidth || 700;
    const height = canvas.height = 460;

    ctx.clearRect(0, 0, width, height);

    const vW = vehicle?.widthCm || 200;
    const vH = vehicle?.heightCm || 200;
    const vL = vehicle?.lengthCm || 450;

    const maxDim = Math.max(vW, vH, vL);
    const scale = (Math.min(width, height) / maxDim) * 0.42 * zoomScale;

    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    const cx = width / 2;
    const cy = height / 2 + 30;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);

      return {
        px: cx + x1 * scale,
        py: cy - y2 * scale
      };
    };

    const drawPoly = (
      points: { px: number; py: number }[],
      fill?: string,
      stroke?: string,
      lineWidth = 1
    ) => {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0].px, points[0].py);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].px, points[i].py);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // 1. Render Container Floor & Grid Lines
    const p1 = project(-vW / 2, -vH / 2, -vL / 2);
    const p2 = project(vW / 2, -vH / 2, -vL / 2);
    const p3 = project(vW / 2, -vH / 2, vL / 2);
    const p4 = project(-vW / 2, -vH / 2, vL / 2);

    drawPoly([p1, p2, p3, p4], "rgba(15, 23, 42, 0.95)", "#087F5B", 2);

    // Floor Grid lines
    for (let g = 1; g < 6; g++) {
      const gz = -vL / 2 + (vL / 6) * g;
      const gpA = project(-vW / 2, -vH / 2, gz);
      const gpB = project(vW / 2, -vH / 2, gz);
      ctx.beginPath();
      ctx.moveTo(gpA.px, gpA.py);
      ctx.lineTo(gpB.px, gpB.py);
      ctx.strokeStyle = "rgba(8, 127, 91, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 2. Render Placed 3D Boxes
    const visibleBoxes = packedBoxes.slice(0, animCurrentStep);

    const sortedBoxes = [...visibleBoxes].sort((a, b) => {
      const az = a.zCm + a.lCm / 2;
      const bz = b.zCm + b.lCm / 2;
      return bz - az;
    });

    sortedBoxes.forEach((b) => {
      const bx1 = -vW / 2 + b.xCm;
      const by1 = -vH / 2 + b.yCm;
      const bz1 = -vL / 2 + b.zCm;
      const bx2 = bx1 + b.wCm;
      const by2 = by1 + b.hCm;
      const bz2 = bz1 + b.lCm;

      const f1 = project(bx1, by1, bz1);
      const f2 = project(bx2, by1, bz1);
      const f3 = project(bx2, by2, bz1);
      const f4 = project(bx1, by2, bz1);

      const b1 = project(bx1, by1, bz2);
      const b2 = project(bx2, by1, bz2);
      const b3 = project(bx2, by2, bz2);
      const b4 = project(bx1, by2, bz2);

      drawPoly([b1, b2, b3, b4], b.color + "DD", "#0f172a", 1);
      drawPoly([f1, f2, f3, f4], b.color + "EE", "#0f172a", 1);
      drawPoly([f4, f3, b3, b4], b.color + "FF", "#0f172a", 1);
      drawPoly([f1, f4, b4, b1], b.color + "CC", "#0f172a", 1);
      drawPoly([f2, f3, b3, b2], b.color + "BB", "#0f172a", 1);
    });

    // 3. Container Wireframe Glass Walls
    const cp1 = project(-vW / 2, -vH / 2, -vL / 2);
    const cp2 = project(vW / 2, -vH / 2, -vL / 2);
    const cp3 = project(vW / 2, -vH / 2, vL / 2);
    const cp4 = project(-vW / 2, -vH / 2, vL / 2);

    const cp5 = project(-vW / 2, vH / 2, -vL / 2);
    const cp6 = project(vW / 2, vH / 2, -vL / 2);
    const cp7 = project(vW / 2, vH / 2, vL / 2);
    const cp8 = project(-vW / 2, vH / 2, vL / 2);

    drawPoly([cp1, cp2, cp6, cp5], "rgba(8, 127, 91, 0.15)", "#087F5B", 1.5);
    drawPoly([cp1, cp4, cp8, cp5], "rgba(8, 127, 91, 0.10)", "#087F5B", 1.5);
    drawPoly([cp2, cp3, cp7, cp6], "rgba(8, 127, 91, 0.10)", "#087F5B", 1.5);
    drawPoly([cp5, cp6, cp7, cp8], "rgba(8, 127, 91, 0.08)", "#087F5B", 1.5);

    // Front Entrance Frame
    drawPoly([cp4, cp3, cp7, cp8], undefined, "#087F5B", 3);

  }, [vehicle, packedBoxes, animCurrentStep, rotation, zoomScale]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="w-full h-[460px] rounded-xl cursor-grab active:cursor-grabbing select-none"
    />
  );
};

export default function CustomOptimizationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cargoMaster, setCargoMaster] = useState<CargoMasterItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
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
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  const availableVehicles = useMemo(() => {
    const presets: Vehicle[] = VEHICLE_PRESETS.map((p, idx) => ({
      id: `PRESET-${idx + 1}`,
      name: p.name,
      type: p.type,
      lengthCm: p.lengthCm,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      volumeM3: calculateVolumeM3(p.lengthCm, p.widthCm, p.heightCm),
      status: "Aktif"
    }));

    if (vehicles.length === 0) return presets;
    return [
      ...vehicles.filter((v) => v.status !== "Nonaktif"),
      ...presets.filter((p) => !vehicles.some((v) => v.type === p.type))
    ];
  }, [vehicles]);

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
      setVehicles(loadedVehicles);

      let loadedCargos = getStoredCargos();
      if (dbCargos && dbCargos.length > 0) {
        const mappedCargos: CargoMasterItem[] = dbCargos.map((item, idx) => {
          const dimsStr = (item.dimension || "40x30x30").replace(/\s*cm/gi, "").replace(/[\*×]/g, "x");
          const parts = dimsStr.split("x").map((n) => Number(n.trim()) || 30);
          const colors = ["#087F5B", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];
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

      const initialQty: Record<string, number> = {};
      loadedCargos.forEach((c, idx) => {
        if (idx === 0) initialQty[c.id] = 20;
        else if (idx === 1) initialQty[c.id] = 15;
        else if (idx === 2) initialQty[c.id] = 8;
        else initialQty[c.id] = 0;
      });
      setItemQuantities(initialQty);
    }

    loadMasterData();
  }, []);

  const currentSelections: CargoInputSelection[] = useMemo(() => {
    return Object.entries(itemQuantities)
      .map(([cargoId, quantity]) => ({ cargoId, quantity }))
      .filter((s) => s.quantity > 0);
  }, [itemQuantities]);

  const maxVehicleVolM3 = useMemo(() => {
    const activeVehicles = availableVehicles.filter((v) => v.status !== "Nonaktif");
    if (activeVehicles.length === 0) return 0;
    return Math.max(...activeVehicles.map((v) => v.volumeM3));
  }, [availableVehicles]);

  const requestedStats = useMemo(() => {
    let totalBoxes = 0;
    let totalVolM3 = 0;
    let distinctTypes = 0;
    let oversizedCargoError: string | null = null;
    let invalidCustomError: string | null = null;

    currentSelections.forEach((sel) => {
      const cargo = cargoMaster.find((c) => c.id === sel.cargoId);
      if (cargo && sel.quantity > 0) {
        distinctTypes += 1;
        totalBoxes += sel.quantity;
        totalVolM3 += cargo.volumeM3 * sel.quantity;

        if (cargo.lengthCm <= 0 || cargo.widthCm <= 0 || cargo.heightCm <= 0) {
          invalidCustomError = `Barang ${cargo.name} memiliki dimensi tidak valid (${cargo.lengthCm}×${cargo.widthCm}×${cargo.heightCm} cm).`;
        }

        if (!oversizedCargoError && !canFitInAnyVehicle(cargo, availableVehicles)) {
          oversizedCargoError = `Barang "${cargo.name}" (${cargo.lengthCm}×${cargo.widthCm}×${cargo.heightCm} cm) melebihi seluruh dimensi kendaraan yang tersedia.`;
        }
      }
    });

    let isValid = true;
    let errorMessage: string | null = null;

    if (totalBoxes === 0) {
      isValid = false;
      errorMessage = "Harap masukkan setidaknya 1 jumlah barang muatan.";
    } else if (invalidCustomError) {
      isValid = false;
      errorMessage = invalidCustomError;
    } else if (distinctTypes > MAX_OPTIMIZATION_ITEM_TYPES) {
      isValid = false;
      errorMessage = `Maksimal ${MAX_OPTIMIZATION_ITEM_TYPES} jenis barang per proses optimasi. (Saat ini: ${distinctTypes})`;
    } else if (totalBoxes > MAX_OPTIMIZATION_TOTAL_ITEMS) {
      isValid = false;
      errorMessage = `Total muatan melebihi batas maksimum ${MAX_OPTIMIZATION_TOTAL_ITEMS} unit per proses optimasi. (Saat ini: ${totalBoxes} unit)`;
    } else if (totalVolM3 > maxVehicleVolM3 && maxVehicleVolM3 > 0) {
      isValid = false;
      errorMessage = `Total volume muatan (${totalVolM3.toFixed(2)} m³) melebihi kapasitas kendaraan terbesar (${maxVehicleVolM3.toFixed(2)} m³).`;
    } else if (oversizedCargoError) {
      isValid = false;
      errorMessage = oversizedCargoError;
    }

    return {
      totalBoxes,
      totalVolM3: Number(totalVolM3.toFixed(3)),
      distinctTypes,
      maxVehicleVolM3: Number(maxVehicleVolM3.toFixed(2)),
      isValid,
      errorMessage
    };
  }, [currentSelections, cargoMaster, availableVehicles, maxVehicleVolM3]);

  const handleQuantityChange = (cargoId: string, value: number) => {
    const qty = Math.max(0, Math.floor(value || 0));
    setItemQuantities((prev) => ({
      ...prev,
      [cargoId]: qty
    }));
  };

  const handleRunOptimization = () => {
    if (!requestedStats.isValid) {
      alert(requestedStats.errorMessage || "Input muatan tidak valid untuk dioptimalkan.");
      return;
    }

    setIsSolving(true);

    setTimeout(() => {
      const activeVehicles = availableVehicles.filter((v) => v.status !== "Nonaktif");
      const { results, recommendedResult } = evaluateAllVehicles(
        activeVehicles,
        cargoMaster,
        currentSelections
      );
      setAllComparisonResults(results);
      if (recommendedResult) {
        setActiveResult(recommendedResult);
        setAnimCurrentStep(recommendedResult.packedBoxes.length);
      }

      setIsSolving(false);
    }, 400);
  };

  // Mouse Orbit Drag Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      x: Math.max(-80, Math.min(80, prev.x + dy * 0.4)),
      y: prev.y + dx * 0.4
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const activeVehicle = useMemo(() => {
    if (activeResult) return activeResult.vehicle;
    return availableVehicles[0];
  }, [activeResult, availableVehicles]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">

      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 sm:p-9 space-y-7">
        <div className="max-w-[1320px] mx-auto space-y-7">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7EBF0]">
            <div>
              <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
                Optimasi Muatan 3D
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Optimalkan penempatan muatan berdasarkan kapasitas ruang kendaraan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeResult && (
                <button
                  onClick={() => setIsManifestOpen(true)}
                  className="px-4 py-2 bg-white border border-[#E7EBF0] hover:bg-[#F8FAFC] text-[#172033] text-[13px] font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} className="text-[#667085]" />
                  <span>Cetak Manifes</span>
                </button>
              )}

              <button
                onClick={handleRunOptimization}
                disabled={isSolving || !requestedStats.isValid}
                className={`px-5 py-2 text-white text-[13px] font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isSolving || !requestedStats.isValid
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#087F5B] hover:bg-[#066B4D]"
                }`}
              >
                {isSolving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing 3D...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Optimalkan Muatan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-[#E7EBF0]">
            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Total Muatan</span>
              <span className="text-xl sm:text-2xl font-bold text-[#172033] mt-0.5 block">{requestedStats.totalBoxes} Unit</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Total Volume</span>
              <span className="text-xl sm:text-2xl font-bold text-[#087F5B] mt-0.5 block">{requestedStats.totalVolM3} m³</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Kapasitas Maksimal</span>
              <span className="text-xl sm:text-2xl font-bold text-[#172033] mt-0.5 block">{requestedStats.maxVehicleVolM3} m³</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Estimasi Utilisasi</span>
              <span className="text-xl sm:text-2xl font-bold text-[#087F5B] mt-0.5 block">
                {activeResult ? `${activeResult.utilizationPercent.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>

          {/* Result Summary Horizontal Banner (Appears after Optimization) */}
          {activeResult && (
            <div className="bg-[#E8F7F1] border border-[#087F5B]/30 rounded-xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 font-sans">
                <div>
                  <span className="text-[11px] text-[#087F5B] font-medium uppercase tracking-wider block">Kendaraan Terpilih</span>
                  <span className="text-base font-bold text-[#172033]">{activeResult.vehicle.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#087F5B] font-medium uppercase tracking-wider block">Volume Terpakai</span>
                  <span className="text-base font-bold text-[#087F5B]">{activeResult.usedVolumeM3} m³</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#087F5B] font-medium uppercase tracking-wider block">Utilisasi</span>
                  <span className="text-base font-bold text-[#087F5B]">{activeResult.utilizationPercent.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#087F5B] font-medium uppercase tracking-wider block">Jumlah Muatan</span>
                  <span className="text-base font-bold text-[#172033]">{activeResult.totalBoxesPacked} / {activeResult.totalBoxesRequested} item</span>
                </div>
              </div>

              <span className="px-3 py-1 bg-[#087F5B] text-white text-xs font-semibold rounded-lg">
                Optimasi berhasil
              </span>
            </div>
          )}

          {/* Main Grid: Left Output & Input (4 cols) | Right 3D Visualizer (8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

            {/* Left Column: Vehicle Output & Cargo Input List (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Card 1: Kendaraan Terpilih Otomatis */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E7EBF0]">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Kendaraan Terpilih Otomatis
                  </h3>
                  <span className="text-[11px] font-semibold text-[#087F5B] bg-[#E8F7F1] px-2 py-0.5 rounded">
                    Rekomendasi sistem
                  </span>
                </div>

                {!activeResult ? (
                  <div className="bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg p-4 text-center space-y-1.5 py-6">
                    <Truck size={28} className="mx-auto text-[#667085]" />
                    <p className="text-xs font-bold text-[#172033]">Kendaraan Belum Terpilih</p>
                    <p className="text-[12px] text-[#667085] leading-relaxed">
                      Sistem akan merekomendasikan kendaraan terbaik secara otomatis setelah Anda menekan tombol <span className="font-semibold text-[#087F5B]">"Optimalkan Muatan"</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg p-3.5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-[#667085] font-semibold uppercase tracking-wider block">KENDARAAN TERPILIH</span>
                          <h4 className="font-bold text-sm text-[#172033]">{activeResult.vehicle.name}</h4>
                          <p className="text-[11px] text-[#667085]">{activeResult.vehicle.type}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#087F5B] text-white">
                          1 Unit
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#E7EBF0] grid grid-cols-2 gap-2 text-[12px]">
                        <div>
                          <span className="text-[10px] text-[#667085] block">Dimensi Ruang</span>
                          <span className="font-semibold text-[#172033]">{activeResult.vehicle.lengthCm}×{activeResult.vehicle.widthCm}×{activeResult.vehicle.heightCm} cm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#667085] block">Kapasitas Volume</span>
                          <span className="font-bold text-[#087F5B]">{activeResult.vehicle.volumeM3.toFixed(2)} m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Daftar Muatan (Input) */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E7EBF0]">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Daftar Muatan
                  </h3>
                  <span className="text-[12px] font-mono text-[#667085]">
                    {requestedStats.distinctTypes} / {MAX_OPTIMIZATION_ITEM_TYPES} Jenis
                  </span>
                </div>

                {/* Cargo Items List with [-] [qty] [+] */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                  {cargoMaster.map((cargo) => {
                    const qty = itemQuantities[cargo.id] || 0;
                    return (
                      <div
                        key={cargo.id}
                        className="p-3 bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg flex items-center justify-between gap-3 hover:border-[#087F5B]/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cargo.color }} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-[#172033] truncate">{cargo.name}</h4>
                            <p className="text-[11px] text-[#667085] font-mono">
                              {cargo.lengthCm}×{cargo.widthCm}×{cargo.heightCm} cm • {cargo.volumeM3.toFixed(3)} m³
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(cargo.id, qty - 1)}
                            className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-[#172033] border border-[#E7EBF0] flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleQuantityChange(cargo.id, parseInt(e.target.value) || 0)}
                            className="w-10 text-center py-1 text-xs border border-[#E7EBF0] rounded font-mono font-bold bg-white focus:outline-none focus:border-[#087F5B]"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(cargo.id, qty + 1)}
                            className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-[#172033] border border-[#E7EBF0] flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {requestedStats.errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>{requestedStats.errorMessage}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: 3D Spatial Visualization Canvas (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#E7EBF0]">
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">
                    Visualisasi Penempatan Muatan 3D
                  </h2>
                  <p className="text-[12px] text-[#667085]">
                    Tampilan ruang kontainer 3D kendaraan terpilih.
                  </p>
                </div>

                {/* Minimalist 3D Toolbar */}
                <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E7EBF0] p-1 rounded-lg">
                  <button
                    onClick={() => setZoomScale((z) => Math.min(1.5, z + 0.1))}
                    className="p-1.5 text-[#667085] hover:text-[#172033] rounded hover:bg-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
                    className="p-1.5 text-[#667085] hover:text-[#172033] rounded hover:bg-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={() => setRotation({ x: -22, y: -45 })}
                    className="p-1.5 text-[#667085] hover:text-[#172033] rounded hover:bg-white cursor-pointer"
                    title="Reset Angle"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* 3D Viewport Dark Stage */}
              <div className="w-full relative flex items-center justify-center overflow-hidden bg-[#0F172A] rounded-xl border border-slate-800">
                <TruckVehicleCanvas3D
                  vehicle={activeVehicle}
                  packedBoxes={activeResult ? activeResult.packedBoxes : []}
                  animCurrentStep={activeResult ? animCurrentStep : 0}
                  rotation={rotation}
                  zoomScale={zoomScale}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />

                {/* Vehicle Overlay Specs Badge */}
                <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3.5 py-2 rounded-lg text-slate-300 font-mono text-[11px] space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Truck size={13} className="text-[#087F5B]" />
                    <span>{activeVehicle?.name} ({activeVehicle?.type})</span>
                  </div>
                  <div>Ruang: {activeVehicle?.lengthCm}×{activeVehicle?.widthCm}×{activeVehicle?.heightCm} cm • {activeVehicle?.volumeM3.toFixed(2)} m³</div>
                </div>

                {/* Step Animation Controls */}
                {activeResult && (
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-2 rounded-lg flex items-center gap-3">
                    <button
                      onClick={handlePlayPauseAnim}
                      className="px-3 py-1 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={12} />
                      <span>{isPlayingAnim ? "Pause" : "Play Step"}</span>
                    </button>

                    <span className="text-xs font-mono text-slate-300">
                      Step {animCurrentStep} / {activeResult.packedBoxes.length}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}