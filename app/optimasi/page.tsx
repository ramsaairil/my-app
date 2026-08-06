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
  Compass,
  Table as TableIcon,
  LayoutGrid,
  BarChart3,
  Search,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import {
  Vehicle,
  CargoMasterItem,
  CargoInputSelection,
  OptimizationResult,
  PlacedBox3D
} from "../../lib/types";
import { getStoredVehicles, getStoredCargos, VEHICLE_PRESETS, calculateVolumeM3 } from "../../lib/storage";
import { evaluateAllVehicles, packVehicle } from "../../lib/binPacking";
import { fetchTrucksFromDb, fetchCargosFromDb } from "../../lib/db";

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
  const pxW = Math.max(12, box.wCm * scale);
  const pxH = Math.max(12, box.hCm * scale);
  const pxL = Math.max(12, box.lCm * scale);

  const tx = box.xCm * scale;
  // CSS origin: invert Y coordinate so Y=0 is bottom floor
  const ty = (containerH - box.yCm - box.hCm) * scale;
  const tz = -box.zCm * scale;

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
        className="absolute inset-0 border border-slate-950/60 flex items-center justify-center text-[9px] font-black text-white shadow-md overflow-hidden select-none"
        style={{
          backgroundColor: box.color,
          transform: `translate3d(0, 0, 0)`
        }}
      >
        <span className="truncate px-0.5 drop-shadow">{box.cargoCode}</span>
      </div>

      {/* Back Face */}
      <div
        className="absolute inset-0 border border-slate-950/60"
        style={{
          backgroundColor: box.color,
          transform: `translate3d(0, 0, ${-pxL}px) rotateY(180deg)`,
          filter: "brightness(0.6)"
        }}
      />

      {/* Left Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/60"
        style={{
          width: `${pxL}px`,
          height: `${pxH}px`,
          backgroundColor: box.color,
          transformOrigin: "left center",
          transform: `rotateY(-90deg)`,
          filter: "brightness(0.75)"
        }}
      />

      {/* Right Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/60"
        style={{
          width: `${pxL}px`,
          height: `${pxH}px`,
          backgroundColor: box.color,
          transformOrigin: "left center",
          transform: `translate3d(${pxW}px, 0, 0) rotateY(-90deg)`,
          filter: "brightness(0.85)"
        }}
      />

      {/* Top Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/60"
        style={{
          width: `${pxW}px`,
          height: `${pxL}px`,
          backgroundColor: box.color,
          transformOrigin: "center top",
          transform: `rotateX(-90deg)`,
          filter: "brightness(1.15)"
        }}
      />

      {/* Bottom Face */}
      <div
        className="absolute top-0 left-0 border border-slate-950/60"
        style={{
          width: `${pxW}px`,
          height: `${pxL}px`,
          backgroundColor: box.color,
          transformOrigin: "center top",
          transform: `translate3d(0, ${pxH}px, 0) rotateX(-90deg)`,
          filter: "brightness(0.5)"
        }}
      />
    </div>
  );
};

// --- HIGH-PERFORMANCE CANVAS 3D VEHICLE & CARGO RENDERER ---
interface Canvas3DProps {
  vehicle: Vehicle;
  packedBoxes: PlacedBox3D[];
  animCurrentStep: number;
  rotation: { x: number; y: number };
  zoomScale: number;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas size
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 450;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Vehicle dimensions in cm
    const vW = vehicle?.widthCm || 200;
    const vH = vehicle?.heightCm || 200;
    const vL = vehicle?.lengthCm || 450;

    const cx = width / 2;
    const cy = height / 2 + 35;

    // Dynamic scale to fit canvas
    const autoScale = (220 / Math.max(120, vL)) * zoomScale;

    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    // 3D Projection math: X=[-vW/2, vW/2], Y=[-vH/2, vH/2], Z=[-vL/2, vL/2]
    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = 700;
      const pScale = fov / (fov + z2);

      return {
        x: cx + x1 * autoScale * pScale,
        y: cy - y2 * autoScale * pScale,
        z: z2
      };
    };

    const drawPoly = (pts: { x: number; y: number }[], fillColor?: string, strokeColor?: string, lineWidth = 1) => {
      if (pts.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // 1. FLOOR METALLIC BASE & GRID LINES
    const floorY = -vH / 2;
    const fp1 = project(-vW / 2, floorY, -vL / 2);
    const fp2 = project(vW / 2, floorY, -vL / 2);
    const fp3 = project(vW / 2, floorY, vL / 2);
    const fp4 = project(-vW / 2, floorY, vL / 2);

    drawPoly([fp1, fp2, fp3, fp4], "rgba(15, 23, 42, 0.95)", "#2383e2", 2);

    ctx.strokeStyle = "rgba(35, 131, 226, 0.3)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(30, Math.floor(vL / 8));
    for (let z = -vL / 2; z <= vL / 2; z += gridStep) {
      const gp1 = project(-vW / 2, floorY, z);
      const gp2 = project(vW / 2, floorY, z);
      ctx.beginPath();
      ctx.moveTo(gp1.x, gp1.y);
      ctx.lineTo(gp2.x, gp2.y);
      ctx.stroke();
    }

    // 3D Color Shading Helper for Solid Cubic Cargo Boxes
    const shadeColor = (hex: string, percent: number) => {
      let color = hex.replace("#", "");
      if (color.length === 3) color = color.split("").map((c) => c + c).join("");
      const num = parseInt(color, 16);
      if (isNaN(num)) return hex;
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, Math.max(0, (num >> 16) + amt));
      const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
      const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
      return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    };

    // 3. PLACED 3D CARGO BOXES (Per-Face Depth Sorting for 100% Solid 3D Cubes)
    const visibleBoxes = packedBoxes.slice(0, animCurrentStep);

    interface FaceToDraw {
      pts: { x: number; y: number }[];
      color: string;
      depth: number;
      label?: string;
      labelPos?: { x: number; y: number };
    }

    const allFacesToDraw: FaceToDraw[] = [];

    visibleBoxes.forEach((b) => {
      const baseColor = b.color || "#3b82f6";
      const topColor = shadeColor(baseColor, 25);
      const frontColor = shadeColor(baseColor, 5);
      const sideColor = shadeColor(baseColor, -22);
      const bottomColor = shadeColor(baseColor, -45);

      const bx1 = -vW / 2 + b.xCm;
      const bx2 = bx1 + b.wCm;
      const by1 = -vH / 2 + b.yCm;
      const by2 = by1 + b.hCm;
      const bz1 = -vL / 2 + b.zCm;
      const bz2 = bz1 + b.lCm;

      const v000 = project(bx1, by1, bz1);
      const v100 = project(bx2, by1, bz1);
      const v110 = project(bx2, by2, bz1);
      const v010 = project(bx1, by2, bz1);

      const v001 = project(bx1, by1, bz2);
      const v101 = project(bx2, by1, bz2);
      const v111 = project(bx2, by2, bz2);
      const v011 = project(bx1, by2, bz2);

      const cxBox = (bx1 + bx2) / 2;
      const cyBox = (by1 + by2) / 2;
      const czBox = (bz1 + bz2) / 2;

      // 1. Back Face (Z = bz1)
      allFacesToDraw.push({
        pts: [v000, v100, v110, v010],
        color: bottomColor,
        depth: project(cxBox, cyBox, bz1).z
      });

      // 2. Bottom Face (Y = by1)
      allFacesToDraw.push({
        pts: [v000, v100, v101, v001],
        color: bottomColor,
        depth: project(cxBox, by1, czBox).z
      });

      // 3. Left Face (X = bx1)
      allFacesToDraw.push({
        pts: [v001, v000, v010, v011],
        color: sideColor,
        depth: project(bx1, cyBox, czBox).z
      });

      // 4. Right Face (X = bx2)
      allFacesToDraw.push({
        pts: [v101, v100, v110, v111],
        color: sideColor,
        depth: project(bx2, cyBox, czBox).z
      });

      // 5. Front Face (Z = bz2)
      allFacesToDraw.push({
        pts: [v001, v101, v111, v011],
        color: frontColor,
        depth: project(cxBox, cyBox, bz2).z
      });

      // 6. Top Face (Y = by2)
      const topCenter = project(cxBox, by2, czBox);
      allFacesToDraw.push({
        pts: [v011, v111, v110, v010],
        color: topColor,
        depth: topCenter.z
      });
    });

    // Sort ALL 3D faces from farthest camera Z (largest depth) to closest camera Z (smallest depth)
    allFacesToDraw.sort((f1, f2) => f2.depth - f1.depth);

    // Render all sorted faces cleanly
    allFacesToDraw.forEach((f) => {
      drawPoly(f.pts, f.color, "rgba(0, 0, 0, 0.7)", 1.5);
    });

    // 4. CONTAINER GLASS WALLS & WIREFRAME EDGES
    const cp1 = project(-vW / 2, -vH / 2, -vL / 2);
    const cp2 = project(vW / 2, -vH / 2, -vL / 2);
    const cp3 = project(vW / 2, -vH / 2, vL / 2);
    const cp4 = project(-vW / 2, -vH / 2, vL / 2);

    const cp5 = project(-vW / 2, vH / 2, -vL / 2);
    const cp6 = project(vW / 2, vH / 2, -vL / 2);
    const cp7 = project(vW / 2, vH / 2, vL / 2);
    const cp8 = project(-vW / 2, vH / 2, vL / 2);

    // Glass Wall Panels
    drawPoly([cp1, cp2, cp6, cp5], "rgba(35, 131, 226, 0.2)", "#2383e2", 2);
    drawPoly([cp1, cp4, cp8, cp5], "rgba(35, 131, 226, 0.15)", "#2383e2", 2);
    drawPoly([cp2, cp3, cp7, cp6], "rgba(35, 131, 226, 0.15)", "#2383e2", 2);
    drawPoly([cp5, cp6, cp7, cp8], "rgba(35, 131, 226, 0.1)", "#2383e2", 1.5);

    // Front Entrance Frame (Cyan Door Frame at Z = vL/2)
    drawPoly([cp4, cp3, cp7, cp8], undefined, "#2383e2", 3.5);

  }, [vehicle, packedBoxes, animCurrentStep, rotation, zoomScale]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="w-full h-[450px] rounded-xl cursor-grab active:cursor-grabbing select-none"
    />
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

  // Notion View State Tab
  const [activeViewTab, setActiveViewTab] = useState<"simulator" | "manifest" | "report">("simulator");

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

  // Build complete list of selectable vehicles (DB / Storage + Standard Preset Armada)
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
    // Combine custom vehicles with presets
    return [
      ...vehicles.filter((v) => v.status === "Aktif"),
      ...presets.filter((p) => !vehicles.some((v) => v.type === p.type))
    ];
  }, [vehicles]);

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
          type: t.truck_type || "Gran Max Pick Up",
          lengthCm: 300,
          widthCm: 180,
          heightCm: 180,
          volumeM3: Number(t.max_volume_m3 || 9.72),
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

      if (availableVehicles.length > 0) {
        setSelectedVehicleId(availableVehicles[0].id);
      }

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
      const activeVehicles = availableVehicles.filter((v) => v.status === "Aktif");
      if (activeVehicles.length === 0) {
        alert("Tidak ada kendaraan aktif untuk disimulasikan!");
        setIsSolving(false);
        return;
      }

      if (vehicleMode === "recommend") {
        const { results, recommendedResult } = evaluateAllVehicles(
          availableVehicles,
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
        const chosenVehicle = availableVehicles.find((v) => v.id === selectedVehicleId) || activeVehicles[0];
        const singleResult = packVehicle(chosenVehicle, cargoMaster, currentSelections);
        const { results } = evaluateAllVehicles(availableVehicles, cargoMaster, currentSelections);

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
    return availableVehicles.find((v) => v.id === selectedVehicleId) || availableVehicles[0];
  }, [activeResult, selectedVehicleId, availableVehicles]);

  // Dynamic Container dimensions for 3D scale calculations per vehicle type
  const autoScale = 260 / Math.max(100, activeVehicle?.lengthCm || 450);
  const baseScale = autoScale * zoomScale;
  const containerWpx = (activeVehicle?.widthCm || 200) * baseScale;
  const containerHpx = (activeVehicle?.heightCm || 200) * baseScale;
  const containerLpx = (activeVehicle?.lengthCm || 450) * baseScale;

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#fafafa] text-slate-800 font-sans antialiased">

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
        <div className="max-w-[1300px] mx-auto space-y-6">

          {/* ---------------------------------------------------- */}
          {/* NOTION PAGE HEADER */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-3 pb-2 border-b border-slate-200/60">

            {/* Notion Large Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Optimasi Muatan 3D
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Simulasi algoritma 3D Bin Packing, kalkulasi okupansi ruang kontainer, dan urutan peletakan kargo.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeResult && (
                  <button
                    onClick={() => setIsManifestOpen(true)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} className="text-slate-500" />
                    <span>Cetak Manifes</span>
                  </button>
                )}

                <button
                  onClick={handleRunOptimization}
                  disabled={isSolving || requestedStats.totalBoxes === 0}
                  className={`px-4 py-1.5 text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${isSolving || requestedStats.totalBoxes === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#2383e2] hover:bg-[#1d70c4]"
                    }`}
                >
                  {isSolving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing 3D...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Optimalkan Muatan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* NOTION TOOLBAR & VIEW TABS BAR */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">

            {/* View Tabs Selector */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg">
              <button
                onClick={() => setActiveViewTab("simulator")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewTab === "simulator"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Zap size={14} className={activeViewTab === "simulator" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>3D Simulator & Config</span>
              </button>

              <button
                onClick={() => setActiveViewTab("manifest")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewTab === "manifest"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Package size={14} className={activeViewTab === "manifest" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Cargo Input Manifest</span>
              </button>

              <button
                onClick={() => setActiveViewTab("report")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewTab === "report"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <BarChart3 size={14} className={activeViewTab === "report" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Analytics Report</span>
              </button>
            </div>

            {/* Quick Volume Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                Requested: <span className="font-bold">{requestedStats.totalBoxes} Boxes</span> ({requestedStats.totalVolM3} m³)
              </span>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* STEP INPUT CARDS GRID (STEP 1 & STEP 2) */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* STEP 1: VEHICLE SELECTION (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">

              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-5 h-5 rounded bg-[#2383e2] text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mode Pemilihan Kendaraan
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${vehicleMode === "recommend"
                    ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/60"
                    }`}
                >
                  <input
                    type="radio"
                    name="vehicleMode"
                    value="recommend"
                    checked={vehicleMode === "recommend"}
                    onChange={() => setVehicleMode("recommend")}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-slate-900">
                        Rekomendasikan Terbaik
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sistem menguji seluruh armada aktif & memilih unit paling efisien.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${vehicleMode === "manual"
                    ? "bg-blue-50/60 border-[#2383e2] ring-1 ring-[#2383e2]"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/60"
                    }`}
                >
                  <input
                    type="radio"
                    name="vehicleMode"
                    value="manual"
                    checked={vehicleMode === "manual"}
                    onChange={() => setVehicleMode("manual")}
                    className="mt-0.5 text-[#2383e2] focus:ring-[#2383e2] cursor-pointer"
                  />
                  <div className="space-y-2 flex-1">
                    <span className="text-xs font-bold text-slate-900 block">
                      Pilih Kendaraan Manual
                    </span>

                    {vehicleMode === "manual" && (
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => {
                          setSelectedVehicleId(e.target.value);
                          setActiveResult(null);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#2383e2] cursor-pointer"
                      >
                        {availableVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} - {v.type} ({v.volumeM3} m³ | {v.lengthCm}×{v.widthCm}×{v.heightCm} cm)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              </div>

            </div>

            {/* STEP 2: CARGO ITEM QUANTITIES INPUT (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#2383e2] text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Jumlah Barang Muatan Box
                  </h3>
                </div>

                <div className="text-[11px] font-mono text-slate-500">
                  Total Vol: <span className="font-bold text-emerald-700">{requestedStats.totalVolM3} m³</span>
                </div>
              </div>

              {/* Cargo Table Input */}
              <div className="overflow-x-auto max-h-[220px] custom-scrollbar border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Kode & Nama</th>
                      <th className="py-2.5 px-3">Dimensi</th>
                      <th className="py-2.5 px-3">Vol. Unit</th>
                      <th className="py-2.5 px-3 w-32 text-center">Jumlah Box</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {cargoMaster.map((cargo) => {
                      const qty = itemQuantities[cargo.id] || 0;
                      return (
                        <tr key={cargo.id} className="hover:bg-[#f7f7f5] transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cargo.color }} />
                              <span className="font-mono text-slate-900">{cargo.code}</span>
                              <span className="text-slate-500 font-normal">({cargo.name})</span>
                            </div>
                          </td>

                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                            {cargo.lengthCm}×{cargo.widthCm}×{cargo.heightCm} cm
                          </td>

                          <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">
                            {cargo.volumeM3.toFixed(3)} m³
                          </td>

                          {/* Quantity Controls */}
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(cargo.id, qty - 1)}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => handleQuantityChange(cargo.id, parseInt(e.target.value) || 0)}
                                className="w-12 text-center py-0.5 text-xs border border-slate-200 rounded font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-[#2383e2]"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(cargo.id, qty + 1)}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus size={11} />
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

          {/* ---------------------------------------------------- */}
          {/* 3D SPATIAL VISUALIZER CANVAS CARD */}
          {/* ---------------------------------------------------- */}
          <div className="bg-[#18181b] rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4 relative overflow-hidden">

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-[#2383e2]" />
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Visualizer 3D Spatial Canvas
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Klik & drag mouse untuk memutar sudut pandang 3D.
                  </p>
                </div>
              </div>

              {/* Viewport Control Buttons */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setZoomScale((z) => Math.min(1.5, z + 0.1))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={() => setRotation({ x: -22, y: -45 })}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Reset Angle"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* HIGH-PERFORMANCE 3D CANVAS STAGE */}
            <div className="w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#090d16] via-[#141e33] to-[#090d16] rounded-xl border border-slate-800">
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

              {/* Canvas Overlay Specs Tag */}
              <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[11px] space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1">
                  <Truck size={12} className="text-[#2383e2]" />
                  <span>{activeVehicle?.name} ({activeVehicle?.type})</span>
                </div>
                <div>Ruang: {activeVehicle?.lengthCm}×{activeVehicle?.widthCm}×{activeVehicle?.heightCm} cm</div>
              </div>

              {/* Packing Sequence Step Controller */}
              {activeResult && (
                <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-2 rounded-lg flex items-center gap-3">
                  <button
                    onClick={handlePlayPauseAnim}
                    className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1d70c4] text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
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

          {/* ---------------------------------------------------- */}
          {/* RESULTS & OCCUPANCY REPORT SECTION */}
          {/* ---------------------------------------------------- */}
          {activeResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#2383e2]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Laporan Hasil Pengepakan (Occupancy Report)
                  </h3>
                </div>

                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {activeResult.utilizationPercent.toFixed(1)}% Okupansi Ruang
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] block font-sans font-bold">KAPASITAS KENDARAAN</span>
                  <span className="font-bold text-slate-900 text-sm">{activeResult.vehicle.volumeM3.toFixed(2)} m³</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] block font-sans font-bold">VOLUME TERPAKAI</span>
                  <span className="font-bold text-emerald-700 text-sm">{activeResult.usedVolumeM3.toFixed(3)} m³</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] block font-sans font-bold">BOX TERMUAT</span>
                  <span className="font-bold text-blue-700 text-sm">{activeResult.packedBoxes.length} Box</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[10px] block font-sans font-bold">BOX TERSISA</span>
                  <span className={`font-bold text-sm ${activeResult.totalBoxesUnpacked > 0 ? "text-rose-600" : "text-slate-500"}`}>
                    {activeResult.totalBoxesUnpacked} Box
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}