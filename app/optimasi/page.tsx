"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import { benchmarkBaselines } from "../data/datasets";
import {
  Clock, RotateCw, Printer, X, Cpu
} from "lucide-react";

// --- HELPER FUNCTIONS ---
const getVolume = (dimStr?: string): number => {
  if (!dimStr) return 0;
  const clean = dimStr.toLowerCase().replace(/[^0-9.x]/g, "");
  const parts = clean.split("x").map(parseFloat);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    return parts[0] * parts[1] * parts[2];
  }
  return 0;
};

const parseDimensions = (dimStr: string) => {
  const clean = dimStr.toLowerCase().replace(/[^0-9.x]/g, "");
  const parts = clean.split("x").map(parseFloat);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    return { w: parts[0], d: parts[1], h: parts[2] };
  }
  return { w: 1, d: 1, h: 1 };
};

// --- TYPES ---
interface CargoSlot {
  id: string; row: string; col: number; colSpan?: number;
  occupied: boolean; shipmentId?: string; badgeColor?: string; type?: string; dimensions?: string;
}
interface CargoItem {
  id: string; badge: string; badgeColor: string; type: string; qty: string; dimension: string; method: string;
}
interface PlacedBox {
  id: string; label: string; x: number; y: number; z: number; w: number; d: number; h: number; color: string;
}
interface GAFlatItem {
  id: string; w: number; d: number; h: number; badge: string; color: string;
}
interface Chromosome {
  order: number[]; orientations: number[]; fitness: number; packed: PlacedBox[]; utilization: number;
}
type SolverState = "idle" | "solving" | "solved";

// --- 3D RENDERER COMPONENT ---
const Box3D = ({ w, h, d, x, y, z, color, label }: PlacedBox) => {
  const scale = 36;
  const containerHeight = 2.4;
  const pxW = Math.max(16, w * scale);
  const pxH = Math.max(16, h * scale);
  const pxD = Math.max(16, d * scale);
  const tx = x * scale;
  const ty = (containerHeight - z - h) * scale;
  const tz = -y * scale;

  const isCube = Math.abs(w - d) < 0.05 && Math.abs(d - h) < 0.05;
  const textureStyle = !isCube ? { backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 10px)" } : {};
  const topTextureStyle = !isCube ? { backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 10px)" } : {};
  const halfD = pxD / 2;

  return (
    <div className="absolute pointer-events-none" style={{ width: `${pxW}px`, height: `${pxH}px`, transformStyle: "preserve-3d", transform: `translate3d(${tx}px, ${ty}px, ${tz}px)` }}>
      {/* Front */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 flex items-center justify-center text-[8px] font-black text-slate-900 shadow-md ${color}`} style={{ width: `${pxW}px`, height: `${pxH}px`, transform: `translate3d(0, 0, 0)`, ...textureStyle }}>
        <span className="truncate max-w-full px-0.5 z-10 select-none">{label}</span>
      </div>
      {/* Back */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 ${color}`} style={{ width: `${pxW}px`, height: `${pxH}px`, transform: `translate3d(0, 0, ${-pxD}px) rotateY(180deg)`, filter: "brightness(0.65)", ...textureStyle }} />
      {/* Left */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 ${color}`} style={{ width: `${pxD}px`, height: `${pxH}px`, transform: `translate3d(${-halfD}px, 0, ${-halfD}px) rotateY(-90deg)`, filter: "brightness(0.75)", ...textureStyle }} />
      {/* Right */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 ${color}`} style={{ width: `${pxD}px`, height: `${pxH}px`, transform: `translate3d(${pxW - halfD}px, 0, ${-halfD}px) rotateY(90deg)`, filter: "brightness(0.85)", ...textureStyle }} />
      {/* Top */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 ${color}`} style={{ width: `${pxW}px`, height: `${pxD}px`, transform: `translate3d(0, ${-halfD}px, ${-halfD}px) rotateX(90deg)`, filter: "brightness(1.2)", ...topTextureStyle }} />
      {/* Bottom */}
      <div className={`absolute top-0 left-0 border border-slate-950/40 ${color}`} style={{ width: `${pxW}px`, height: `${pxD}px`, transform: `translate3d(0, ${pxH - halfD}px, ${-halfD}px) rotateX(-90deg)`, filter: "brightness(0.5)", ...topTextureStyle }} />
    </div>
  );
};

// --- DATASETS ---
const EMPTY_SLOTS: CargoSlot[] = Array.from({ length: 15 }, (_, i) => ({
  id: `${i < 6 ? 'A' : i < 11 ? 'B' : 'C'}${(i % 5) + 1}`, row: i < 6 ? 'A' : i < 11 ? 'B' : 'C', col: (i % 5) + 1, occupied: false
}));

const baselines: Record<string, { name: string; slots: CargoSlot[]; shipments: CargoItem[] }> = {
  default: {
    name: "Default Cargo Hold", slots: [...EMPTY_SLOTS],
    shipments: [
      { id: "SHP-9821", badge: "Standard", badgeColor: "bg-slate-100", type: "Pallet", qty: "10", dimension: "0.8x0.6x1 m", method: "Pickup" },
      { id: "SHP-9822", badge: "Express", badgeColor: "bg-green-50", type: "Box", qty: "15", dimension: "0.4x0.2x1 m", method: "Pickup" },
    ]
  },
  br1: {
    name: "Bischoff BR1", slots: [...EMPTY_SLOTS],
    shipments: [{ id: "SHP-BR1-01", badge: "Standard", badgeColor: "bg-slate-100", type: "Pallet", qty: "8", dimension: "1.2x0.8x1.6 m", method: "Pickup" }]
  },
  ...Object.fromEntries(Object.entries(benchmarkBaselines).map(([k, v]) => [k, { ...v, slots: [...EMPTY_SLOTS] }]))
};

export default function CargoDetailsDashboardPage() {
  const profile = useProfile();
  
  // UI & System States
  const [activeBaseline, setActiveBaseline] = useState<string>("default");
  const [slots, setSlots] = useState<CargoSlot[]>([...baselines.default.slots]);
  const [solverState, setSolverState] = useState<SolverState>("idle");
  const [solverProgressMsg, setSolverProgressMsg] = useState("");
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // 3D Viewport States
  const [packedBoxes, setPackedBoxes] = useState<PlacedBox[]>([]);
  const [rotation, setRotation] = useState({ x: -22, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Activity Log
  const [activityLog, setActivityLog] = useState([{ id: "1", time: "09:30 PM", text: "Sistem logistik siap." }]);

  // Computed Metrics
  const maxCapacityVolume = 69.12; // 12.0 x 2.4 x 2.4
  const currentLoadVolume = useMemo(() => packedBoxes.reduce((sum, b) => sum + (b.w * b.d * b.h), 0), [packedBoxes]);
  const loadPercentage = Math.min(100, Math.round((currentLoadVolume / maxCapacityVolume) * 100));

  const containerMetrics = useMemo(() => {
    let maxX = 0, maxY = 0, maxZ = 0;
    packedBoxes.forEach((b) => {
      if (b.x + b.w > maxX) maxX = b.x + b.w;
      if (b.y + b.d > maxY) maxY = b.y + b.d;
      if (b.z + b.h > maxZ) maxZ = b.z + b.h;
    });
    return {
      maxX: Math.min(12.0, maxX), maxY: Math.min(2.4, maxY), maxZ: Math.min(2.4, maxZ),
      remainingX: Math.max(0, 12.0 - maxX), usedVol: currentLoadVolume,
      occupancyPercent: loadPercentage.toFixed(1), boxCount: packedBoxes.length
    };
  }, [packedBoxes, currentLoadVolume, loadPercentage]);

  // --- GENETIC ALGORITHM CORE ---
  const handleRunBinPackingSolver = () => {
    setSolverState("solving");
    setSolverProgressMsg("Menganalisis dan menghitung rotasi penataan 3D...");

    // 1. Persiapan Data (Flatten items)
    const flatItems: GAFlatItem[] = [];
    baselines[activeBaseline].shipments.forEach((item) => {
      const qtyVal = parseInt(item.qty) || 1;
      const { w, d, h } = parseDimensions(item.dimension);
      const color = item.badge === "Express" ? "bg-emerald-500/70 text-emerald-950 border-emerald-600" : "bg-slate-300/70 text-slate-800 border-slate-400";
      for (let i = 0; i < qtyVal; i++) {
        flatItems.push({ id: `${item.id}-${i}`, w, d, h, badge: item.badge, color });
      }
    });

    const popSize = 30;
    const totalGenerations = 35;
    let population: Chromosome[] = [];

    // Fungsi Evaluasi Fitness (Decoder)
    const evaluate = (order: number[], orientations: number[]) => {
      const packed: PlacedBox[] = [];
      let extremePoints = [{ x: 0, y: 0, z: 0 }];
      
      order.forEach((idx, i) => {
        const item = flatItems[idx];
        const w = orientations[i] === 0 ? item.w : item.d;
        const d = orientations[i] === 0 ? item.d : item.w;
        const h = item.h;

        extremePoints.sort((a, b) => (Math.abs(a.z - b.z) > 0.001 ? a.z - b.z : Math.abs(a.x - b.x) > 0.001 ? a.x - b.x : a.y - b.y));

        for (let epIdx = 0; epIdx < extremePoints.length; epIdx++) {
          const ep = extremePoints[epIdx];
          // Cek batas kontainer & tabrakan
          const isOverlap = packed.some(p => ep.x < p.x + p.w && ep.x + w > p.x && ep.y < p.y + p.d && ep.y + d > p.y && ep.z < p.z + p.h && ep.z + h > p.z);
          
          if (ep.x + w <= 12.0 && ep.y + d <= 2.4 && ep.z + h <= 2.4 && !isOverlap) {
            packed.push({ id: item.id, label: item.id.split("-")[0], x: ep.x, y: ep.y, z: ep.z, w, d, h, color: item.color });
            extremePoints.push({ x: ep.x + w, y: ep.y, z: ep.z }, { x: ep.x, y: ep.y + d, z: ep.z }, { x: ep.x, y: ep.y, z: ep.z + h });
            extremePoints.splice(epIdx, 1);
            break;
          }
        }
      });
      
      const volUsed = packed.reduce((sum, b) => sum + (b.w * b.d * b.h), 0);
      return { packed, utilization: (volUsed / 69.12) * 100, fitness: volUsed };
    };

    // Inisialisasi Populasi
    for (let i = 0; i < popSize; i++) {
      const order = Array.from({ length: flatItems.length }, (_, idx) => idx).sort(() => Math.random() - 0.5);
      const orientations = order.map(() => (Math.random() > 0.5 ? 1 : 0));
      population.push({ order, orientations, ...evaluate(order, orientations) });
    }

    let currentGen = 0;

    // Loop Generasi (menggunakan setTimeout agar UI tidak freeze)
    const runGeneration = () => {
      currentGen++;
      population.sort((a, b) => b.fitness - a.fitness);
      const nextGen = [population[0], population[1]]; // Elitism

      while (nextGen.length < popSize) {
        // Crossover (Sederhana)
        const p1 = population[Math.floor(Math.random() * 5)];
        const p2 = population[Math.floor(Math.random() * 5)];
        let childOrder = [...p1.order];
        let childOrient = [...p1.orientations];
        
        // Mutasi
        if (Math.random() < 0.2) {
          const i1 = Math.floor(Math.random() * childOrder.length);
          const i2 = Math.floor(Math.random() * childOrder.length);
          [childOrder[i1], childOrder[i2]] = [childOrder[i2], childOrder[i1]];
          childOrient[i1] = childOrient[i1] === 0 ? 1 : 0;
        }
        nextGen.push({ order: childOrder, orientations: childOrient, ...evaluate(childOrder, childOrient) });
      }

      population = nextGen;
      setSolverProgressMsg(`Iterasi Penataan ${currentGen}/${totalGenerations} | Utilisasi: ${population[0].utilization.toFixed(1)}%`);

      if (currentGen < totalGenerations) {
        setTimeout(runGeneration, 30);
      } else {
        // Selesai
        setPackedBoxes(population[0].packed);
        
        // Update Slots untuk keperluan manifes tabel
        const updatedSlots = [...EMPTY_SLOTS];
        population[0].packed.forEach((box, i) => {
          if (i < updatedSlots.length) {
            updatedSlots[i] = { ...updatedSlots[i], occupied: true, shipmentId: box.label, type: "Box", dimensions: `${box.w}x${box.d}x${box.h} m` };
          }
        });
        setSlots(updatedSlots);
        
        setSolverState("solved");
        showToast(`Optimasi selesai! (Utilisasi: ${population[0].utilization.toFixed(1)}%)`, "success");
        setActivityLog(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString(), text: `Optimasi 3D selesai. ${population[0].packed.length} item dimuat.` }, ...prev]);
      }
    };
    setTimeout(runGeneration, 50);
  };

  // --- UI HANDLERS ---
  const handleBaselineChange = (val: string) => {
    setActiveBaseline(val);
    setSlots([...baselines[val].slots]);
    setPackedBoxes([]);
    setSolverState("idle");
    showToast(`Dataset diubah ke: ${baselines[val].name}`, "success");
  };

  const handleClearContainer = () => {
    setPackedBoxes([]);
    setSlots([...EMPTY_SLOTS]);
    setSolverState("idle");
    showToast("Kontainer kargo dikosongkan!", "success");
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  // --- MOUSE HANDLERS (3D Rotation) ---
  const handleMouse = (e: React.MouseEvent, type: string) => {
    if (type === "down") { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }
    if (type === "up") setIsDragging(false);
    if (type === "move" && isDragging) {
      setRotation(p => ({ x: Math.max(-80, Math.min(80, p.x - (e.clientY - dragStart.y) * 0.5)), y: p.y + (e.clientX - dragStart.x) * 0.5 }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: "", type: "success" })}><X size={16} /></button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader title="Optimasi">
        <button onClick={() => setIsManifestOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs">
          <Printer size={13} className="text-slate-400" /> <span>Lihat manifes</span>
        </button>
      </PageHeader>

      {/* Layout Container */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 sm:p-8 bg-[#f8fafc]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 items-start">

          {/* MAIN 3D VISUALIZER CARD */}
          <div className="col-span-12 space-y-6">
            <section className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
              
              {/* SOLVER RUNNING OVERLAY */}
              {solverState === "solving" && (
                <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center text-center p-6 backdrop-blur-xs">
                  <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">3D Bin Packing Solver Running</h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium animate-pulse">{solverProgressMsg}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Optimasi</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Rotasi dan pantau simulasi peletakan kontainer 3D.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={handleRunBinPackingSolver} disabled={solverState === "solved"} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${solverState === "solved" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"}`}>
                    <Cpu size={13} className={solverState === "solving" ? "animate-spin" : ""} /> <span>Jalankan</span>
                  </button>
                  <button onClick={handleClearContainer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-200 hover:bg-rose-50 text-rose-700 bg-white">
                    <RotateCw size={13} /> <span>Kosongkan</span>
                  </button>
                  <select value={activeBaseline} onChange={(e) => handleBaselineChange(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-750 font-bold focus:outline-none text-xs px-2.5 py-1.5 rounded-lg">
                    {Object.entries(baselines).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              {/* 3D Visualizer Container */}
              <div className="w-full p-4 sm:p-5 bg-slate-950 text-white border border-slate-900 rounded-xl select-none overflow-hidden relative shadow-inner space-y-4">
                
                {/* Viewport Header */}
                <div className="w-full flex justify-between gap-2 z-20 pb-3 border-b border-slate-900">
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                    🔄 Drag mouse untuk memutar 3D
                  </span>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="px-2.5 py-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded-md">X: 12.0m</span>
                    <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-md">Y: 2.4m</span>
                    <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/60 rounded-md">Z: 2.4m</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  {/* Left Side Panel: Volumetrik */}
                  <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2.5 flex flex-col">
                    <h3 className="font-extrabold text-slate-200 uppercase tracking-wider text-[10px] border-b border-slate-800/80 pb-2">Dimensi Volumetrik</h3>
                    
                    {[{ label: "Sumbu X (Panjang)", val: containerMetrics.maxX, max: 12.0, color: "rose" },
                      { label: "Sumbu Y (Lebar)", val: containerMetrics.maxY, max: 2.4, color: "cyan" },
                      { label: "Sumbu Z (Tinggi)", val: containerMetrics.maxZ, max: 2.4, color: "amber" }
                    ].map(m => (
                      <div key={m.label} className="bg-slate-950/80 p-2.5 rounded-md border border-slate-800/80">
                        <div className="flex justify-between"><span className={`text-[10px] font-bold text-${m.color}-400 uppercase`}>{m.label}</span><span className={`text-[10px] font-black text-${m.color}-200`}>{m.val.toFixed(2)}m</span></div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5"><div className={`bg-${m.color}-500 h-full`} style={{ width: `${(m.val / m.max) * 100}%` }} /></div>
                      </div>
                    ))}
                    <div className="bg-slate-950/80 p-2.5 rounded-md border border-slate-800/80 mt-auto">
                        <div className="flex justify-between"><span className="text-[10px] font-bold text-emerald-400 uppercase">Volume Terpakai</span><span className="text-[10px] font-black text-emerald-200">{containerMetrics.usedVol.toFixed(2)} m³</span></div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5"><div className="bg-emerald-500 h-full" style={{ width: `${containerMetrics.occupancyPercent}%` }} /></div>
                    </div>
                  </div>

                  {/* 3D Scene Viewport */}
                  <div className="lg:col-span-8 h-[380px] flex items-center justify-center cursor-grab relative bg-slate-900/60 rounded-lg border border-slate-800/60 overflow-hidden" style={{ perspective: "1200px" }} onMouseDown={e => handleMouse(e, "down")} onMouseMove={e => handleMouse(e, "move")} onMouseUp={e => handleMouse(e, "up")} onMouseLeave={e => handleMouse(e, "up")}>
                    <div className="relative" style={{ width: "432px", height: "86px", transformStyle: "preserve-3d", transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transition: isDragging ? "none" : "transform 0.1s ease-out" }}>
                      
                      {/* Grid Lines (Lantai, Dinding, Atap) */}
                      <div className="absolute top-0 left-0 border border-slate-400/50 bg-[#ebf3ff]/90" style={{ width: "432px", height: "86px", transform: "translateY(86px) rotateX(-90deg)", transformOrigin: "top", backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.95) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.95) 1.5px, transparent 1.5px)", backgroundSize: "36px 36px" }} />
                      <div className="absolute top-0 left-0 border border-slate-400/50 bg-[#ebf3ff]/70" style={{ width: "432px", height: "86px", transform: "translateZ(-86px)", backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.95) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.95) 1.5px, transparent 1.5px)", backgroundSize: "36px 36px" }} />
                      <div className="absolute top-0 left-0 border border-slate-400/50 bg-[#ebf3ff]/80" style={{ width: "86px", height: "86px", transform: "rotateY(90deg)", transformOrigin: "left", backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.95) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.95) 1.5px, transparent 1.5px)", backgroundSize: "36px 36px" }} />

                      {/* Render Kotak */}
                      {[...packedBoxes].sort((a, b) => (b.y + b.d) - (a.y + a.d) || a.z - b.z || a.x - b.x).map((box, i) => (
                        <Box3D key={i} {...box} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* BOTTOM WIDGETS */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Capacity & Load</h2>
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-3.5 text-xs font-semibold">
                  <div><span className="text-[10px] text-slate-400 uppercase block">Current volume</span><span className="text-base text-slate-800">{currentLoadVolume.toFixed(1)} m³</span></div>
                  <div className="border-t border-slate-50 pt-2.5"><span className="text-[10px] text-slate-400 uppercase block">Max Capacity</span><span className="text-xs text-slate-500">{maxCapacityVolume} m³</span></div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Loading Activity</h2>
              <div className="max-h-32 overflow-y-auto space-y-4">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Clock size={12} /></div>
                    <div><span className="text-[9px] font-bold text-slate-400">{log.time}</span><p className="text-xs text-slate-600 font-semibold">{log.text}</p></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MANIFEST MODAL (Hanya ditampilkan jika isManifestOpen = true) */}
      {isManifestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
              <h3 className="text-sm font-bold">Manifes Operasional</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold">Cetak</button>
                <button onClick={() => setIsManifestOpen(false)} className="px-3.5 py-2 border text-slate-600 rounded-lg text-xs font-semibold">Tutup</button>
              </div>
            </div>
            
            <div className="space-y-6 text-slate-800 p-1">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-base font-bold tracking-wider uppercase">MANIFES OPERASIONAL MUATAN</h2>
              </div>
              <table className="w-full text-left text-[11px] font-medium border">
                <thead><tr className="bg-slate-50 border-b text-[9px] font-bold text-slate-400 uppercase"><th className="py-2 px-3">Bay Slot</th><th className="py-2 px-3">ID Kargo</th><th className="py-2 px-3">Dimensi</th></tr></thead>
                <tbody>
                  {slots.filter(s => s.occupied).map((slot) => (
                    <tr key={slot.id} className="border-b"><td className="py-2 px-3">{slot.id}</td><td className="py-2 px-3">{slot.shipmentId}</td><td className="py-2 px-3">{slot.dimensions}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-8 flex justify-end text-xs font-bold text-slate-750">
                <div className="text-center w-64">
                  <span className="block border-b pb-1.5">{profile?.name || "Petugas"}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Supervisor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}