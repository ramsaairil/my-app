"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import {
  Home,
  Database,
  Package,
  Truck,
  Inbox,
  FileText,
  Activity,
  User,
  Settings,
  Clock,
  Plus,
  RotateCw,
  Printer,
  Send,
  Search,
  X,
  Scale,
  Sparkles,
  Layers,
  Cpu,
  Phone,
  Check,
  ChevronDown,
  SlidersHorizontal,
  Grid
} from "lucide-react";

// Helper to calculate volume (m³) from dimension string like "1.2x0.8x1.4 m"
const getVolume = (dimStr?: string): number => {
  if (!dimStr) return 0;
  const clean = dimStr.toLowerCase().replace(/[^0-9.x]/g, "");
  const parts = clean.split("x").map(parseFloat);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    return parts[0] * parts[1] * parts[2];
  }
  return 0;
};

const getShapeLabel = (dimStr?: string): string => {
  if (!dimStr) return "Balok";
  const clean = dimStr.toLowerCase().replace(/[^0-9.x]/g, "");
  const parts = clean.split("x").map(parseFloat);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    const isCube = Math.abs(parts[0] - parts[1]) < 0.05 && Math.abs(parts[1] - parts[2]) < 0.05;
    return isCube ? "Kubus" : "Balok";
  }
  return "Balok";
};

// Types
interface CargoSlot {
  id: string;
  row: string;
  col: number;
  colSpan?: number;
  occupied: boolean;
  shipmentId?: string;
  badgeColor?: string;
  type?: string;
  dimensions?: string;
}

interface CargoItem {
  id: string;
  badge: string;
  badgeColor: string;
  type: string;
  qty: string;
  dimension: string;
  method: string;
}

interface ActivityLog {
  id: string;
  time: string;
  text: string;
}

interface PlacedBox {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

const parseDimensions = (dimStr: string) => {
  const clean = dimStr.toLowerCase().replace(/[^0-9.x]/g, "");
  const parts = clean.split("x").map(parseFloat);
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    return { w: parts[0], d: parts[1], h: parts[2] };
  }
  return { w: 1, d: 1, h: 1 };
};

const getInitial3DBoxes = (activeSlots: CargoSlot[]): PlacedBox[] => {
  const boxes: PlacedBox[] = [];
  activeSlots.forEach((slot) => {
    if (slot.occupied && slot.dimensions) {
      const { w, d, h } = parseDimensions(slot.dimensions);
      const x = (slot.col - 1) * 1.2;
      let y = 0.0;
      if (slot.row === "B") y = 0.8;
      if (slot.row === "C") y = 1.6;
      const z = 0;
      
      let color = "bg-slate-300/70 text-slate-800 border-slate-400";
      if (slot.badgeColor === "green") {
        color = "bg-emerald-500/70 text-emerald-950 border-emerald-600";
      } else if (slot.badgeColor === "blue") {
        color = "bg-blue-500/70 text-blue-950 border-blue-600";
      }
      
      boxes.push({
        id: slot.shipmentId || "BOX",
        label: slot.shipmentId || "BOX",
        x,
        y,
        z,
        w,
        d,
        h,
        color
      });
    }
  });
  return boxes;
};

const Box3D = ({ w, h, d, x, y, z, color, label }: { w: number, h: number, d: number, x: number, y: number, z: number, color: string, label: string }) => {
  const scale = 36;
  const containerHeight = 2.4;

  const pxW = w * scale;
  const pxH = h * scale;
  const pxD = d * scale;

  const tx = x * scale;
  const ty = (containerHeight - z - h) * scale;
  const tz = -y * scale;

  // Determine if it is a Cube (Kubus) or Rectangular Prism (Balok)
  const isCube = Math.abs(w - d) < 0.05 && Math.abs(d - h) < 0.05;

  const textureStyle = !isCube ? {
    backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 10px)"
  } : {};

  const topTextureStyle = !isCube ? {
    backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 10px)"
  } : {};

  return (
    <div
      className="absolute"
      style={{
        width: `${pxW}px`,
        height: `${pxH}px`,
        transformStyle: "preserve-3d",
        transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`,
      }}
    >
      {/* Front Face (z=0) */}
      <div className={`absolute border border-black/15 flex items-center justify-center text-[7px] font-black text-slate-800 rounded shadow-xs relative ${color}`}
        style={{
          width: `${pxW}px`,
          height: `${pxH}px`,
          transform: `translateZ(0px)`,
          backfaceVisibility: "hidden",
          ...textureStyle
        }}
      >
        <span className="truncate max-w-full px-0.5 z-10">{label}</span>
        
        {/* Barcode label on cube front face */}
        {isCube && (
          <div className="absolute right-1 bottom-1 w-3.5 h-2 bg-white flex items-center justify-around px-0.5 opacity-80 border border-slate-350 pointer-events-none z-10">
            <div className="w-[0.5px] h-full bg-slate-800" />
            <div className="w-[1px] h-full bg-slate-800" />
            <div className="w-[0.5px] h-full bg-slate-800" />
            <div className="w-[1.5px] h-full bg-slate-800" />
          </div>
        )}
      </div>

      {/* Back Face (z=-D) */}
      <div className={`absolute border border-black/15 rounded ${color}`}
        style={{
          width: `${pxW}px`,
          height: `${pxH}px`,
          transform: `translateZ(${-pxD}px) rotateY(180deg)`,
          opacity: 0.9,
          backfaceVisibility: "hidden",
          ...textureStyle
        }}
      />

      {/* Left Face (x=0) */}
      <div className={`absolute border border-black/15 rounded ${color}`}
        style={{
          width: `${pxD}px`,
          height: `${pxH}px`,
          transform: `rotateY(90deg)`,
          transformOrigin: "left",
          opacity: 0.85,
          backfaceVisibility: "hidden",
          ...textureStyle
        }}
      />

      {/* Right Face (x=W) */}
      <div className={`absolute border border-black/15 rounded ${color}`}
        style={{
          width: `${pxD}px`,
          height: `${pxH}px`,
          transform: `translateX(${pxW}px) rotateY(90deg)`,
          transformOrigin: "left",
          opacity: 0.85,
          backfaceVisibility: "hidden",
          ...textureStyle
        }}
      />

      {/* Top Face (y=0) */}
      <div className={`absolute border border-black/15 rounded relative ${color}`}
        style={{
          width: `${pxW}px`,
          height: `${pxD}px`,
          transform: `rotateX(-90deg)`,
          transformOrigin: "top",
          opacity: 0.95,
          backfaceVisibility: "hidden",
          ...topTextureStyle
        }}
      >
        {/* Cardboard box sealing tape for cube top face */}
        {isCube && (
          <div className="absolute inset-y-0 w-1.5 bg-amber-800/30 left-[calc(50%-3px)] z-10 shadow-inner" />
        )}
      </div>

      {/* Bottom Face (y=H) */}
      <div className={`absolute border border-black/15 rounded ${color}`}
        style={{
          width: `${pxW}px`,
          height: `${pxD}px`,
          transform: `translateY(${pxH}px) rotateX(-90deg)`,
          transformOrigin: "top",
          opacity: 0.95,
          backfaceVisibility: "hidden",
          ...topTextureStyle
        }}
      />
    </div>
  );
};

const run3DDecoupledSolver = (
  itemsToPack: CargoItem[],
  placedSoFar: PlacedBox[]
): { packed: PlacedBox[]; unplaced: CargoItem[]; utilization: number } => {
  const containerW = 12.0;
  const containerD = 2.4;
  const containerH = 2.4;

  const flatItems: { id: string; w: number; d: number; h: number; badge: string; color: string }[] = [];
  itemsToPack.forEach((item) => {
    const qtyVal = parseInt(item.qty) || 1;
    const { w, d, h } = parseDimensions(item.dimension);
    
    let color = "bg-slate-300/70 text-slate-800 border-slate-400";
    if (item.badge === "Express" || item.badge === "Prioritas") {
      color = "bg-emerald-500/70 text-emerald-950 border-emerald-600";
    } else if (item.badge === "Volume Tinggi" || item.badge === "Same day") {
      color = "bg-blue-500/70 text-blue-950 border-blue-600";
    }

    for (let i = 0; i < qtyVal; i++) {
      flatItems.push({
        id: `${item.id.trim()}-${i + 1}`,
        w,
        d,
        h,
        badge: item.badge,
        color
      });
    }
  });

  flatItems.sort((a, b) => (b.w * b.d * b.h) - (a.w * a.d * a.h));

  const packed: PlacedBox[] = [...placedSoFar];
  const unplacedFlat: any[] = [];

  let extremePoints: { x: number; y: number; z: number }[] = [{ x: 0, y: 0, z: 0 }];

  const checkOverlap = (
    x: number, y: number, z: number,
    w: number, d: number, h: number,
    placed: PlacedBox[]
  ): boolean => {
    for (const p of placed) {
      const overlapX = x < p.x + p.w && x + w > p.x;
      const overlapY = y < p.y + p.d && y + d > p.y;
      const overlapZ = z < p.z + p.h && z + h > p.z;
      if (overlapX && overlapY && overlapZ) {
        return true;
      }
    }
    return false;
  };

  const checkStability = (
    x: number, y: number, z: number,
    w: number, d: number,
    placed: PlacedBox[]
  ): boolean => {
    if (z === 0) return true;
    let supportedArea = 0;
    for (const p of placed) {
      if (Math.abs(p.z + p.h - z) < 0.01) {
        const ix1 = Math.max(x, p.x);
        const ix2 = Math.min(x + w, p.x + p.w);
        const iy1 = Math.max(y, p.y);
        const iy2 = Math.min(y + d, p.y + p.d);
        if (ix2 > ix1 && iy2 > iy1) {
          supportedArea += (ix2 - ix1) * (iy2 - iy1);
        }
      }
    }
    const boxArea = w * d;
    return (supportedArea / boxArea) >= 0.5;
  };

  for (const item of flatItems) {
    let placedSuccess = false;

    extremePoints.sort((a, b) => {
      if (Math.abs(a.z - b.z) > 0.001) return a.z - b.z;
      if (Math.abs(a.x - b.x) > 0.001) return a.x - b.x;
      return a.y - b.y;
    });

    for (let i = 0; i < extremePoints.length; i++) {
      const ep = extremePoints[i];

      if (
        ep.x + item.w <= containerW &&
        ep.y + item.d <= containerD &&
        ep.z + item.h <= containerH &&
        !checkOverlap(ep.x, ep.y, ep.z, item.w, item.d, item.h, packed) &&
        checkStability(ep.x, ep.y, ep.z, item.w, item.d, packed)
      ) {
        packed.push({
          id: item.id,
          label: item.id.split("-")[0],
          x: ep.x,
          y: ep.y,
          z: ep.z,
          w: item.w,
          d: item.d,
          h: item.h,
          color: item.color
        });

        extremePoints.push({ x: ep.x + item.w, y: ep.y, z: ep.z });
        extremePoints.push({ x: ep.x, y: ep.y + item.d, z: ep.z });
        extremePoints.push({ x: ep.x, y: ep.y, z: ep.z + item.h });

        extremePoints.splice(i, 1);
        placedSuccess = true;
        break;
      }

      if (
        ep.x + item.d <= containerW &&
        ep.y + item.w <= containerD &&
        ep.z + item.h <= containerH &&
        !checkOverlap(ep.x, ep.y, ep.z, item.d, item.w, item.h, packed) &&
        checkStability(ep.x, ep.y, ep.z, item.d, item.w, packed)
      ) {
        packed.push({
          id: item.id,
          label: item.id.split("-")[0],
          x: ep.x,
          y: ep.y,
          z: ep.z,
          w: item.d,
          d: item.w,
          h: item.h,
          color: item.color
        });

        extremePoints.push({ x: ep.x + item.d, y: ep.y, z: ep.z });
        extremePoints.push({ x: ep.x, y: ep.y + item.w, z: ep.z });
        extremePoints.push({ x: ep.x, y: ep.y, z: ep.z + item.h });

        extremePoints.splice(i, 1);
        placedSuccess = true;
        break;
      }
    }

    if (!placedSuccess) {
      unplacedFlat.push(item);
    }
  }

  const unplacedMap: Record<string, { qty: number; item: CargoItem }> = {};
  itemsToPack.forEach((orig) => {
    unplacedMap[orig.id] = { qty: 0, item: orig };
  });

  unplacedFlat.forEach((un) => {
    const baseId = un.id.split("-")[0];
    const match = Object.keys(unplacedMap).find((k) => k.trim() === baseId.trim());
    if (match) {
      unplacedMap[match].qty++;
    }
  });

  const unplaced: CargoItem[] = [];
  Object.values(unplacedMap).forEach(({ qty, item }) => {
    if (qty > 0) {
      unplaced.push({
        ...item,
        qty: `${qty} Unit`
      });
    }
  });

  const totalVolumeUsed = packed.reduce((sum, b) => sum + (b.w * b.d * b.h), 0);
  const utilization = (totalVolumeUsed / 67.7) * 100;

  return { packed, unplaced, utilization };
};

type SolverState = "idle" | "solving" | "solved";

const INITIAL_SLOTS: CargoSlot[] = [
  // Row A
  { id: "A1", row: "A", col: 1, colSpan: 1, occupied: true, shipmentId: "SHP-5839", badgeColor: "green", type: "Pallet", dimensions: "0.8x0.6x1 m" },
  { id: "A2", row: "A", col: 2, colSpan: 1, occupied: true, shipmentId: "SHP-2212", badgeColor: "green", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "A3", row: "A", col: 3, colSpan: 1, occupied: true, shipmentId: "SHP-0080", badgeColor: "none", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "A4", row: "A", col: 4, colSpan: 1, occupied: false },
  { id: "A5", row: "A", col: 5, colSpan: 1, occupied: false },
  { id: "A6", row: "A", col: 6, colSpan: 1, occupied: false },

  // Row B
  { id: "B1", row: "B", col: 1, colSpan: 1, occupied: true, shipmentId: "SHP-1233", badgeColor: "none", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "B2", row: "B", col: 2, colSpan: 2, occupied: true, shipmentId: "SHP-4434", badgeColor: "green", type: "Pallet", dimensions: "0.8x0.6x1 m" },
  { id: "B3", row: "B", col: 4, colSpan: 1, occupied: true, shipmentId: "SHP-3324", badgeColor: "none", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "B4", row: "B", col: 5, colSpan: 1, occupied: false },
  { id: "B5", row: "B", col: 6, colSpan: 1, occupied: false },

  // Row C
  { id: "C1", row: "C", col: 1, colSpan: 1, occupied: true, shipmentId: "SHP-3030", badgeColor: "none", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "C2", row: "C", col: 2, colSpan: 1, occupied: true, shipmentId: "SHP-8833", badgeColor: "none", type: "Box", dimensions: "0.4x0.2x1 m" },
  { id: "C3", row: "C", col: 3, colSpan: 1, occupied: true, shipmentId: "SHP-0040", badgeColor: "blue", type: "Pallet", dimensions: "1.5x1.2x0.4 m" },
  { id: "C4", row: "C", col: 4, colSpan: 2, occupied: true, shipmentId: "SHP-3320", badgeColor: "none", type: "Pallet", dimensions: "0.8x0.6x1 m" }
];

const EMPTY_SLOTS: CargoSlot[] = [
  // Row A
  { id: "A1", row: "A", col: 1, colSpan: 1, occupied: false },
  { id: "A2", row: "A", col: 2, colSpan: 1, occupied: false },
  { id: "A3", row: "A", col: 3, colSpan: 1, occupied: false },
  { id: "A4", row: "A", col: 4, colSpan: 1, occupied: false },
  { id: "A5", row: "A", col: 5, colSpan: 1, occupied: false },
  { id: "A6", row: "A", col: 6, colSpan: 1, occupied: false },

  // Row B
  { id: "B1", row: "B", col: 1, colSpan: 1, occupied: false },
  { id: "B2", row: "B", col: 2, colSpan: 2, occupied: false },
  { id: "B3", row: "B", col: 4, colSpan: 1, occupied: false },
  { id: "B4", row: "B", col: 5, colSpan: 1, occupied: false },
  { id: "B5", row: "B", col: 6, colSpan: 1, occupied: false },

  // Row C
  { id: "C1", row: "C", col: 1, colSpan: 1, occupied: false },
  { id: "C2", row: "C", col: 2, colSpan: 1, occupied: false },
  { id: "C3", row: "C", col: 3, colSpan: 1, occupied: false },
  { id: "C4", row: "C", col: 4, colSpan: 2, occupied: false }
];

function generateRandomShipmentId() {
  return `SHP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function CargoDetailsDashboardPage() {
  const profile = useProfile();

  // Selected slot configuration
  const [selectedSlotId, setSelectedSlotId] = useState<string>("A5");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Solver engine state
  const [solverState, setSolverState] = useState<SolverState>("idle");
  const [solverProgressMsg, setSolverProgressMsg] = useState("");

  // Manifest printer modal
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Custom shipments logic
  const [customId, setCustomId] = useState("");
  const [customType, setCustomType] = useState("Pallet");
  const [customQty, setCustomQty] = useState("10 Unit");
  const [customDim, setCustomDim] = useState("1.2x0.8x1.4 m");
  const [customMethod, setCustomMethod] = useState("Forklift");
  const [customBadge, setCustomBadge] = useState("Standard");
  const [customCounter, setCustomCounter] = useState(1);

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // 3D View and BPP States
  const [visualizerMode, setVisualizerMode] = useState<"2d" | "3d">("3d");
  const [packedBoxes, setPackedBoxes] = useState<PlacedBox[]>([]);
  const [rotation, setRotation] = useState({ x: -15, y: -35 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse handlers for 3D rotation dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      x: Math.max(-80, Math.min(80, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const baselines = {
    default: {
      name: "TRC-204 Default Cargo Hold",
      slots: [...EMPTY_SLOTS],
      shipments: [
        { id: "SHP-9821", badge: "Standard", badgeColor: "bg-slate-100 text-slate-705 border-slate-200", type: "Pallet", qty: "10 pallets", dimension: "0.8x0.6x1 m", method: "Pickup" },
        { id: "SHP-9821 ", badge: "Express", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Box", qty: "15 boxes", dimension: "0.4x0.2x1 m", method: "Pickup" },
        { id: "SHP-9821  ", badge: "Same day", badgeColor: "bg-blue-50 text-blue-700 border-blue-200", type: "Box", qty: "12 boxes", dimension: "1.5x1.2x0.4 m", method: "Pickup" }
      ] as CargoItem[]
    },
    br1: {
      name: "Bischoff BR1 (Heterogen Lemah)",
      slots: [...EMPTY_SLOTS],
      shipments: [
        { id: "SHP-BR1-01", badge: "Standard", badgeColor: "bg-slate-100 text-slate-705 border-slate-200", type: "Pallet", qty: "8 pallets", dimension: "1.2x0.8x1.6 m", method: "Pickup" },
        { id: "SHP-BR1-02", badge: "Express", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Box", qty: "5 boxes", dimension: "0.8x0.6x1.0 m", method: "Pickup" }
      ] as CargoItem[]
    },
    br5: {
      name: "Bischoff BR5 (Heterogen Sedang)",
      slots: [...EMPTY_SLOTS],
      shipments: [
        { id: "SHP-BR5-01", badge: "Express", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Pallet", qty: "4 pallets", dimension: "2.0x0.8x1.2 m", method: "Pickup" },
        { id: "SHP-BR5-02", badge: "Same day", badgeColor: "bg-blue-50 text-blue-700 border-blue-200", type: "Box", qty: "6 boxes", dimension: "0.8x0.8x1.8 m", method: "Pickup" }
      ] as CargoItem[]
    },
    homogeneous: {
      name: "Europallet Homogen",
      slots: [...EMPTY_SLOTS],
      shipments: [
        { id: "SHP-HOM-01", badge: "Standard", badgeColor: "bg-slate-100 text-slate-705 border-slate-200", type: "Pallet", qty: "18 pallets", dimension: "1.2x0.8x1.4 m", method: "Pickup" }
      ] as CargoItem[]
    }
  };

  const [activeBaseline, setActiveBaseline] = useState<keyof typeof baselines>("default");

  // Slots loading state
  const [slots, setSlots] = useState<CargoSlot[]>([...baselines.default.slots]);

  // Sync initial 3D boxes on baseline change
  useEffect(() => {
    setPackedBoxes(getInitial3DBoxes(baselines[activeBaseline].slots));
  }, [activeBaseline]);

  // Available shipments database
  const [customShipments, setCustomShipments] = useState<Record<string, CargoItem[]>>({
    default: [...baselines.default.shipments],
    br1: [...baselines.br1.shipments],
    br5: [...baselines.br5.shipments],
    homogeneous: [...baselines.homogeneous.shipments]
  });

  // Loading activities log
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    { id: "log-1", time: "09:30 PM", text: "Shipment SHP-9821 assigned 02 boxes (0.16 m³) to A1" },
    { id: "log-2", time: "09:30 PM", text: "Shipment SHP-9821 assigned 02 boxes (0.16 m³) to A1" },
    { id: "log-3", time: "09:30 PM", text: "Driver Marcus Lee checked in" },
    { id: "log-4", time: "09:30 PM", text: "Driver Marcus Lee checked in" }
  ]);

  const maxCapacityVolume = 67.7;

  const currentLoadVolume = useMemo(() => {
    return slots
      .filter((s) => s.occupied && s.dimensions)
      .reduce((sum, s) => sum + getVolume(s.dimensions), 0);
  }, [slots]);

  const loadPercentage = useMemo(() => {
    return Math.min(100, Math.round((currentLoadVolume / maxCapacityVolume) * 100));
  }, [currentLoadVolume, maxCapacityVolume]);

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.id === selectedSlotId);
  }, [slots, selectedSlotId]);

  const availableShipments = useMemo(() => {
    return customShipments[activeBaseline] || [];
  }, [customShipments, activeBaseline]);

  // Actions
  const handleAssignCargoItem = (shipment: CargoItem) => {
    if (!selectedSlotId) return;

    // Check if selected slot is already occupied
    const slotIdx = slots.findIndex((s) => s.id === selectedSlotId);
    if (slotIdx === -1) return;
    if (slots[slotIdx].occupied) {
      showToast("Slot sudah terisi! Bongkar terlebih dahulu.", "error");
      return;
    }

    const badgeColor =
      shipment.badge === "Express"
        ? "green"
        : shipment.badge === "Same day"
        ? "blue"
        : "none";

    const updatedSlots = [...slots];
    updatedSlots[slotIdx] = {
      ...updatedSlots[slotIdx],
      occupied: true,
      shipmentId: shipment.id.trim(),
      badgeColor,
      type: shipment.type,
      dimensions: shipment.dimension
    };

    setSlots(updatedSlots);
    setPackedBoxes(getInitial3DBoxes(updatedSlots));

    // Remove from available shipments list
    setCustomShipments((prev) => ({
      ...prev,
      [activeBaseline]: prev[activeBaseline].filter((item) => item.id !== shipment.id)
    }));

    // Add activity log
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [
      { id: String(Date.now()), time: timestamp, text: `Shipment ${shipment.id.trim()} assigned to Bay ${selectedSlotId}` },
      ...prev
    ]);

    showToast(`Shipment ${shipment.id.trim()} successfully loaded to slot ${selectedSlotId}`, "success");
  };

  const handleUnloadSlot = (slotId: string) => {
    const slotIdx = slots.findIndex((s) => s.id === slotId);
    if (slotIdx === -1) return;
    const slot = slots[slotIdx];
    if (!slot.occupied) return;

    const restoredShipment: CargoItem = {
      id: slot.shipmentId || generateRandomShipmentId(),
      badge: slot.badgeColor === "green" ? "Express" : slot.badgeColor === "blue" ? "Same day" : "Standard",
      badgeColor: slot.badgeColor === "green" ? "bg-green-50 text-green-700 border-green-200" : slot.badgeColor === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200",
      type: slot.type || "Pallet",
      qty: "1 Unit",
      dimension: slot.dimensions || "1.0x1.0x1.0 m",
      method: "Pickup"
    };

    const updatedSlots = [...slots];
    updatedSlots[slotIdx] = {
      ...updatedSlots[slotIdx],
      occupied: false,
      shipmentId: undefined,
      badgeColor: undefined,
      type: undefined,
      dimensions: undefined
    };

    setSlots(updatedSlots);
    setPackedBoxes(getInitial3DBoxes(updatedSlots));

    // Add back to available shipments
    setCustomShipments((prev) => ({
      ...prev,
      [activeBaseline]: [...prev[activeBaseline], restoredShipment]
    }));

    // Add activity log
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [
      { id: String(Date.now()), time: timestamp, text: `Cargo hold Bay ${slotId} has been UNLOADED` },
      ...prev
    ]);

    showToast(`Slot ${slotId} successfully unloaded`, "success");
  };

  const handleRunBinPackingSolver = () => {
    if (availableShipments.length === 0) {
      showToast("No shipments available in queue!", "error");
      return;
    }

    setSolverState("solving");
    setSolverProgressMsg("Calculating volumetric placement rotations...");

    setTimeout(() => {
      setSolverProgressMsg("Analyzing container volume distribution...");
      setTimeout(() => {
        const initialBoxes = getInitial3DBoxes(slots);
        const updatedSlots = [...slots];
        const unassignedItems = [...availableShipments];
        const { packed, unplaced, utilization } = run3DDecoupledSolver(unassignedItems, initialBoxes);

        setPackedBoxes(packed);

        const loadedIds: string[] = [];
        const newlyPacked = packed.slice(initialBoxes.length);
        newlyPacked.forEach((box) => {
          const emptySlotIdx = updatedSlots.findIndex((s) => !s.occupied);
          if (emptySlotIdx !== -1) {
            const badgeColor = box.color.includes("emerald") ? "green" : box.color.includes("blue") ? "blue" : "none";
            updatedSlots[emptySlotIdx] = {
              ...updatedSlots[emptySlotIdx],
              occupied: true,
              shipmentId: box.label,
              badgeColor,
              type: box.label.startsWith("KRG") || box.label.startsWith("SHP") ? "Box" : "Pallet",
              dimensions: `${box.w}x${box.d}x${box.h} m`
            };
            loadedIds.push(box.id);
          }
        });

        setSlots(updatedSlots);
        setCustomShipments((prev) => ({
          ...prev,
          [activeBaseline]: unplaced
        }));

        setSolverState("solved");
        showToast("3D Heuristics Bin Packing completed optimally!", "success");

        const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setActivityLog((prev) => [
          { id: String(Date.now()), time: timestamp, text: `3D Bin Packing: loaded ${loadedIds.length} units (Utilisasi: ${utilization.toFixed(1)}%)` },
          ...prev
        ]);
      }, 1200);
    }, 1000);
  };

  const handleSaveCustomCargo = (e: React.FormEvent) => {
    e.preventDefault();
    const idToUse = customId.trim() || `SHP-CST-${String(customCounter).padStart(3, "0")}`;

    const duplicate = availableShipments.some((s) => s.id === idToUse);
    if (duplicate) {
      showToast(`Shipment ID ${idToUse} already exists!`, "error");
      return;
    }

    const badgeColor =
      customBadge === "Express"
        ? "bg-green-50 text-green-700 border-green-200"
        : customBadge === "Same day"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-slate-100 text-slate-705 border-slate-200";

    const newItem: CargoItem = {
      id: idToUse,
      badge: customBadge,
      badgeColor,
      type: customType,
      qty: customQty,
      dimension: customDim,
      method: customMethod
    };

    setCustomShipments((prev) => ({
      ...prev,
      [activeBaseline]: [...prev[activeBaseline], newItem]
    }));

    setCustomId("");
    setCustomCounter((c) => c + 1);
    setIsAddFormOpen(false);
    showToast(`Custom shipment ${idToUse} added to list`, "success");
  };

  const handleBaselineChange = (val: keyof typeof baselines) => {
    setActiveBaseline(val);
    setSlots([...baselines[val].slots]);
    setPackedBoxes(getInitial3DBoxes(baselines[val].slots));
    setSolverState("idle");
    showToast(`Manifest changed to: ${baselines[val].name}`, "success");
  };

  const handleClearContainer = () => {
    const restoredItems: CargoItem[] = [];
    slots.forEach((slot) => {
      if (slot.occupied) {
        restoredItems.push({
          id: slot.shipmentId || generateRandomShipmentId(),
          badge: slot.badgeColor === "green" ? "Express" : slot.badgeColor === "blue" ? "Same day" : "Standard",
          badgeColor: slot.badgeColor === "green" ? "bg-green-50 text-green-700 border-green-200" : slot.badgeColor === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200",
          type: slot.type || "Pallet",
          qty: "1 Unit",
          dimension: slot.dimensions || "1.0x1.0x1.0 m",
          method: "Pickup"
        });
      }
    });

    setSlots([...EMPTY_SLOTS]);
    setPackedBoxes([]);

    if (restoredItems.length > 0) {
      setCustomShipments((prev) => {
        // We merge quantity for matching IDs or just append them back
        const currentList = prev[activeBaseline] || [];
        const mergedList = [...currentList];
        
        restoredItems.forEach((restored) => {
          // Check if restored item's base ID already exists in queue to increase its quantity,
          // or just append if it's a unique item.
          const baseId = restored.id.split("-")[0].trim();
          const matchIdx = mergedList.findIndex((item) => item.id.trim() === baseId);
          if (matchIdx !== -1) {
            const currentQtyVal = parseInt(mergedList[matchIdx].qty) || 0;
            mergedList[matchIdx] = {
              ...mergedList[matchIdx],
              qty: `${currentQtyVal + 1} Unit`
            };
          } else {
            mergedList.push(restored);
          }
        });

        return {
          ...prev,
          [activeBaseline]: mergedList
        };
      });
    }

    setSolverState("idle");
    showToast("Kontainer kargo dikosongkan sepenuhnya!", "success");

    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [
      { id: String(Date.now()), time: timestamp, text: "Kontainer dibersihkan / dikosongkan sepenuhnya." },
      ...prev
    ]);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const filteredShipments = useMemo(() => {
    return availableShipments.filter(
      (s) =>
        s.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [availableShipments, searchQuery]);

  // Helper renderer for interactive slots grid overlaid on the truck trailer
  const renderSlotCell = (slot: CargoSlot) => {
    const isSelected = slot.id === selectedSlotId;
    return (
      <button
        key={slot.id}
        onClick={() => setSelectedSlotId(slot.id)}
        style={{ gridColumn: `span ${slot.colSpan || 1}` }}
        className={`relative h-full border text-left p-1.5 flex flex-col justify-between transition-all duration-200 cursor-pointer focus:outline-none bg-white/95 ${
          isSelected
            ? "ring-1 ring-slate-800 border-slate-800 z-10"
            : "border-slate-200/80 hover:border-slate-400"
        }`}
      >
        <div className="flex justify-between items-start w-full leading-none">
          <span className="text-[7px] font-bold text-slate-400">{slot.id}</span>
          {slot.occupied && slot.badgeColor && (
            <span className={`w-1.5 h-1.5 rounded-full ${
              slot.badgeColor === "green" ? "bg-emerald-500" : slot.badgeColor === "blue" ? "bg-blue-500" : "bg-slate-400"
            }`} />
          )}
        </div>
        
        {slot.occupied ? (
          <div className="w-full flex flex-col justify-end leading-none text-slate-800 mt-0.5">
            <span className="text-[7.5px] font-bold tracking-tight block">{(getVolume(slot.dimensions)).toFixed(2)}m³</span>
            <span className="text-[8px] font-extrabold tracking-tight truncate block mt-0.5">{slot.shipmentId}</span>
          </div>
        ) : (
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">
              +
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border transition-all duration-300 transform translate-y-0 scale-100 ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-655 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="TRC-204 Cargo details"
        breadcrumbs={[
          { label: "Warehouse Operations" },
          { label: "Cargo details" }
        ]}
        badge={
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Loading
          </span>
        }
      >
        <button
          onClick={() => setIsManifestOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Printer size={13} className="text-slate-400" />
          <span>View manifest</span>
        </button>

        <button
          onClick={() => {
            setSolverState("idle");
            showToast("TRC-204 cargo load finalized for dispatch!", "success");
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <span>Dispatch truck</span>
          <Send size={13} />
        </button>
      </PageHeader>

      {/* Layout Container */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-4 sm:p-8 bg-[#f8fafc]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 items-start">

          {/* ==================== LEFT COLUMN ==================== */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Truck Information Card */}
            <section className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Truck Information</h2>
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src="/marcus_lee.png"
                    alt="Driver Marcus Lee"
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-inner flex-shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Driver</span>
                    <h3 className="text-xs font-bold text-slate-800 leading-none mt-0.5">Marcus Lee</h3>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors cursor-pointer">
                    <Phone size={14} />
                  </button>
                  <button className="p-2 border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-lg transition-colors cursor-pointer">
                    <Check size={14} />
                  </button>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 border-b border-slate-100 py-4 text-xs font-medium">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Truck ID</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">TRC-204</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dock</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">Dock #3</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Started</span>
                  <span className="text-slate-800 font-bold mt-0.5 block">08:34 AM</span>
                </div>
              </div>

              {/* Route Path Graphic */}
              <div className="py-4 border-b border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2">
                  <span>ROUTE</span>
                </div>
                
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
                  <div className="text-center">
                    <span className="text-sm font-extrabold text-slate-800 block">NY</span>
                    <span className="text-[9px] text-slate-400 font-semibold block">New York</span>
                  </div>
                  
                  {/* Dotted connector line with a play circle in the middle */}
                  <div className="flex-1 flex items-center justify-center px-4 relative">
                    <div className="w-full border-t border-dashed border-slate-200 absolute" />
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-white relative z-10 shadow-xs cursor-pointer hover:scale-105 transition-transform">
                      <div className="w-0 h-0 border-t-[3.5px] border-t-transparent border-l-[6px] border-l-white border-b-[3.5px] border-b-transparent ml-0.5" />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-sm font-extrabold text-slate-800 block">NJ</span>
                    <span className="text-[9px] text-slate-400 font-semibold block">New Jersey</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => showToast("Change driver triggered", "success")}
                  className="py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Change driver
                </button>
                <button
                  onClick={() => showToast("Edit route triggered", "success")}
                  className="py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Edit route
                </button>
              </div>
            </section>

            {/* Capacity & load Card */}
            <section className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity & load</h2>
              </div>

              <div className="flex items-center gap-6">
                {/* Radial Gauge */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-600 transition-all duration-700 ease-out"
                      strokeDasharray={`${loadPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-slate-800 leading-none">{loadPercentage}%</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Volume</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex-1 space-y-3.5 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current volume</span>
                    <span className="text-base font-bold text-slate-800 block mt-0.5">{currentLoadVolume.toFixed(1)} m³</span>
                  </div>
                  <div className="border-t border-slate-50 pt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Capacity</span>
                    <span className="text-xs font-semibold text-slate-500 block">{maxCapacityVolume} m³</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Loading activity log */}
            <section className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Loading activity log</h2>

              <div className="max-h-56 overflow-y-auto pr-1.5 custom-scrollbar space-y-4 relative">
                <div className="absolute left-[13px] top-[14px] bottom-4 w-0.5 bg-slate-100 z-0" />

                {activityLog.map((log) => (
                  <div key={log.id} className="flex gap-4 relative z-10 items-start group">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400 shadow-xs transition-colors group-hover:bg-slate-50">
                      <Clock size={12} className="text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 block">{log.time}</span>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{log.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ==================== RIGHT COLUMN ==================== */}
          <div className="col-span-12 lg:col-span-8 space-y-6">

            {/* Truck Container Diagram Card with direct slots overlay */}
            <section className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">

              {/* HEURISTIC SOLVER RUNNING OVERLAY */}
              {solverState === "solving" && (
                <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center text-center p-6 backdrop-blur-xs animate-fade-in">
                  <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mb-3" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Bin Packing Solver Running</h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium animate-pulse">{solverProgressMsg}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Visualisator Pengepakan Kargo</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Klik slot pada kontainer di bawah untuk mengedit, memuat, atau membongkar kargo secara volumetrik.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Heuristic optimize button */}
                  <button
                    onClick={handleRunBinPackingSolver}
                    disabled={solverState === "solved"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${solverState === "solved"
                        ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                      }`}
                  >
                    <Cpu size={13} className={solverState === "solving" ? "animate-spin" : ""} />
                    <span>Jalankan Pengepakan Heuristik</span>
                  </button>

                  {/* Reset/Clear button */}
                  <button
                    onClick={handleClearContainer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-200 hover:bg-rose-50 text-rose-700 bg-white"
                  >
                    <RotateCw size={13} />
                    <span>Kosongkan Kontainer</span>
                  </button>

                  {/* Baseline dataset selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold border border-slate-200 px-2.5 py-1 bg-slate-50 rounded-lg shadow-inner">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Dataset:</span>
                    <select
                      value={activeBaseline}
                      onChange={(e) => handleBaselineChange(e.target.value as keyof typeof baselines)}
                      className="bg-transparent border-none text-slate-750 font-bold focus:outline-none cursor-pointer text-xs pr-1"
                    >
                      <option value="default">Default Hold</option>
                      <option value="br1">BR1 (Weak)</option>
                      <option value="br5">BR5 (Medium)</option>
                      <option value="homogeneous">Europallet</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tab Selector Visualizer */}
              <div className="flex gap-2 border-b border-slate-100 pb-3 mb-5">
                {[
                  { id: "3d", label: "Visualisator 3D Interaktif" },
                  { id: "2d", label: "Tampilan Grid 2D (Bay Slots)" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setVisualizerMode(tab.id as "2d" | "3d")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      visualizerMode === tab.id
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {visualizerMode === "3d" ? (
                <div className="w-full flex flex-col items-center justify-center p-6 bg-slate-950 text-white border border-slate-900 rounded-xl min-h-[380px] select-none overflow-hidden relative shadow-inner">
                  {/* Drag Instructions & Reset View */}
                  <div className="absolute top-3 left-3 text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-2 z-20">
                    <span>🔄 Drag mouse untuk memutar kontainer secara 3D</span>
                    <button
                      type="button"
                      onClick={() => setRotation({ x: -15, y: -35 })}
                      className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                    >
                      Reset View
                    </button>
                  </div>

                  <div className="absolute top-3 right-3 text-[10px] text-slate-400 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 z-20">
                    <span>Kapasitas Kontainer: 67.7 m³</span>
                  </div>

                  {/* 3D Scene Viewport */}
                  <div
                    className="w-full h-[300px] flex items-center justify-center cursor-grab active:cursor-grabbing relative"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ perspective: "1200px" }}
                  >
                    {/* Container 3D Bounds */}
                    <div
                      className="relative"
                      style={{
                        width: "432px",
                        height: "86px",
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transition: isDragging ? "none" : "transform 0.1s ease-out"
                      }}
                    >
                      {/* Floor Grid (rotated X -90) */}
                      <div className="absolute top-0 left-0 border border-slate-700/60 bg-slate-800/20"
                        style={{
                          width: "432px",
                          height: "86px",
                          transform: "translateY(86px) rotateX(-90deg)",
                          transformOrigin: "top",
                          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                          backgroundSize: "36px 36px"
                        }}
                      />

                      {/* Back Wall */}
                      <div className="absolute top-0 left-0 border border-slate-700/50 bg-slate-900/10"
                        style={{
                          width: "432px",
                          height: "86px",
                          transform: "translateZ(-86px)"
                        }}
                      />

                      {/* Left Wall */}
                      <div className="absolute top-0 left-0 border border-slate-700/50 bg-slate-900/20"
                        style={{
                          width: "86px",
                          height: "86px",
                          transform: "rotateY(90deg)",
                          transformOrigin: "left"
                        }}
                      />

                      {/* Right Wall */}
                      <div className="absolute top-0 left-0 border border-slate-700/50 bg-slate-900/20"
                        style={{
                          width: "86px",
                          height: "86px",
                          transform: "translateX(432px) rotateY(90deg)",
                          transformOrigin: "left"
                        }}
                      />

                      {/* Ceiling */}
                      <div className="absolute top-0 left-0 border border-slate-700/10 bg-slate-950/5"
                        style={{
                          width: "432px",
                          height: "86px",
                          transform: "rotateX(-90deg)",
                          transformOrigin: "top"
                        }}
                      />

                      {/* Render Packed Boxes */}
                      {packedBoxes.map((box, index) => (
                        <Box3D
                          key={index}
                          w={box.w}
                          h={box.h}
                          d={box.d}
                          x={box.x}
                          y={box.y}
                          z={box.z}
                          color={box.color}
                          label={box.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full relative flex items-center justify-center p-2 bg-[#fdfdfd] border border-slate-100 rounded-xl overflow-hidden min-h-[300px] select-none">
                  {/* Truck Background Image */}
                  <img
                    src="/truck_40ft.png"
                    alt="40ft Container Truck Layout"
                    className="w-full max-w-[720px] h-auto object-contain pointer-events-none"
                  />

                  {/* Cargo Compartments Grid Overlay on the truck trailer */}
                  <div
                    className="absolute flex flex-col justify-between"
                    style={{
                      left: "37.9%",
                      top: "7.8%",
                      width: "59.6%",
                      height: "45.5%"
                    }}
                  >
                    {/* Grid A */}
                    <div className="grid grid-cols-6 gap-0.5 h-[32%]">
                      {slots.filter((s) => s.row === "A").map((slot) => renderSlotCell(slot))}
                    </div>
                    {/* Grid B */}
                    <div className="grid grid-cols-6 gap-0.5 h-[32%]">
                      {slots.filter((s) => s.row === "B").map((slot) => renderSlotCell(slot))}
                    </div>
                    {/* Grid C */}
                    <div className="grid grid-cols-6 gap-0.5 h-[32%]">
                      {slots.filter((s) => s.row === "C").map((slot) => renderSlotCell(slot))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* COMPONENT 7: CARGO ASSIGNMENT PANEL */}
            <section className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                    {selectedSlot ? (
                      selectedSlot.occupied ? (
                        <span>Detail slot {selectedSlot.id}</span>
                      ) : (
                        <span>Assign shipment to {selectedSlot.id} slot</span>
                      )
                    ) : (
                      <span>Assign shipment to {selectedSlotId || "A5"} slot</span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {selectedSlot?.occupied
                      ? `Slot ini diisi oleh item kargo ${selectedSlot.shipmentId}.`
                      : `Pilih paket kargo di bawah untuk dimuat ke slot ${selectedSlotId || "A5"}.`}
                  </p>
                </div>

                {!selectedSlot?.occupied && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search query */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for shipment ID"
                        className="pl-8 pr-3.5 py-1.5 w-[160px] border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white placeholder-slate-400 text-slate-700"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-655"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                        <SlidersHorizontal size={12} />
                        <span>Sort by</span>
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    <button className="p-1.5 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg transition-colors" title="Toggle grid layout">
                      <Grid size={14} />
                    </button>

                    <button
                      onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Custom Cargo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Cargo Form */}
              {isAddFormOpen && (
                <form onSubmit={handleSaveCustomCargo} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tambah Item Kargo Kustom</h3>
                    <button type="button" onClick={() => setIsAddFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">ID Kargo (Opsional)</label>
                      <input
                        type="text"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value)}
                        placeholder={`SHP-CST-${String(customCounter).padStart(3, "0")}`}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Jenis Paket</label>
                      <select
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850 cursor-pointer"
                      >
                        <option value="Pallet">Pallet</option>
                        <option value="Box">Box</option>
                        <option value="Peti">Peti</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Jumlah</label>
                      <input
                        type="text"
                        value={customQty}
                        onChange={(e) => setCustomQty(e.target.value)}
                        placeholder="Contoh: 10 Unit"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850"
                        required
                      />
                    </div>



                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Dimensi (P x L x T)</label>
                      <input
                        type="text"
                        value={customDim}
                        onChange={(e) => setCustomDim(e.target.value)}
                        placeholder="Contoh: 1.2x0.8x1.4 m"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Prioritas / Badge</label>
                      <select
                        value={customBadge}
                        onChange={(e) => setCustomBadge(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850 cursor-pointer"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Express">Express</option>
                        <option value="Same day">Same day</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Metode Muat</label>
                      <select
                        value={customMethod}
                        onChange={(e) => setCustomMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-850 cursor-pointer"
                      >
                        <option value="Pickup">Pickup</option>
                        <option value="Forklift">Forklift</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-center"
                      >
                        Simpan Kargo
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Slot contents display or Available shipments database grid */}
              {selectedSlot?.occupied ? (
                <div className="p-5 border border-emerald-100 bg-emerald-50/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700/10 border border-emerald-200/50 flex items-center justify-center text-emerald-800 flex-shrink-0">
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{selectedSlot.shipmentId}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Dimuat
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-medium">
                        <div>Jenis: <span className="text-slate-700 font-semibold">{selectedSlot.type || "Kargo"}</span></div>
                        <div>Volume: <span className="text-slate-700 font-semibold">{(getVolume(selectedSlot.dimensions)).toFixed(2)} m³</span></div>
                        <div>Dimensi: <span className="text-slate-700 font-semibold">{selectedSlot.dimensions || "T/A"}</span></div>
                        <div>Bay: <span className="text-slate-700 font-semibold">{selectedSlot.id}</span></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnloadSlot(selectedSlot.id)}
                    className="px-4 py-2 border border-rose-250 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                  >
                    Bongkar kargo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between bg-slate-50/40 hover:bg-white hover:border-slate-205 transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100/80 mb-3.5">
                        <div className="flex items-center gap-1.5 text-slate-705">
                          <Package size={14} className="text-slate-400" />
                          <span className="text-xs font-extrabold">{shipment.id.trim()}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${shipment.badgeColor}`}>
                          {shipment.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-1.5 text-[10px] text-slate-400 font-medium mb-5">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Bentuk</span>
                          <span className="text-slate-750 font-bold">{getShapeLabel(shipment.dimension)}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                          <span className="text-slate-700 font-semibold">{shipment.type}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Quantity</span>
                          <span className="text-slate-700 font-semibold">{shipment.qty}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
                          <span className="text-slate-700 font-semibold">{(getVolume(shipment.dimension) * (parseInt(shipment.qty) || 1)).toFixed(2)} m³</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Dimension</span>
                          <span className="text-slate-700 font-semibold truncate block" title={shipment.dimension}>
                            {shipment.dimension}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                          <span className="text-slate-700 font-semibold">{shipment.method}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignCargoItem(shipment)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-750 transition-colors duration-200 cursor-pointer"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>+ Assign to truck</span>
                      </button>
                    </div>
                  ))}

                  {filteredShipments.length === 0 && (
                    <div className="col-span-3 text-center py-10 text-slate-400 text-sm font-medium">
                      No shipments match the search criteria.
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>

        </div>
      </div>

      {/* ==================== MANIFEST PRINT MODAL ==================== */}
      {isManifestOpen && (
        <div id="print-manifest-modal-container" className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:backdrop-blur-none">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 flex flex-col max-h-[90vh] overflow-y-auto print:max-h-full print:border-none print:p-0 print:w-full print:max-w-full">
            
            {/* Modal Header Actions */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="text-emerald-700" size={18} />
                <h3 className="text-sm font-bold text-slate-950">Manifes Operasional Kargo TRC-204</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Cetak Dokumen
                </button>
                <button
                  onClick={() => setIsManifestOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Print Area Slip */}
            <div id="print-manifest" className="space-y-6 text-slate-800 font-sans p-1">
              
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <h2 className="text-base font-bold tracking-wider uppercase text-slate-955">MANIFES OPERASIONAL MUATAN TRUK</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TRC-204 CARGO LOADING DOCUMENTATION</p>
                <div className="text-[9px] text-slate-400 font-semibold mt-1">
                  Cetak: {new Date().toLocaleString("id-ID")}
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Truck ID</span>
                  <span className="font-bold text-slate-900">TRC-204</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dock Location</span>
                  <span className="font-bold text-slate-900">Dock #3</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Driver</span>
                  <span className="font-bold text-slate-900">Marcus Lee</span>
                </div>
                 <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Volume load</span>
                  <span className="font-bold text-slate-900">{(currentLoadVolume).toFixed(2)} / {maxCapacityVolume} m³</span>
                </div>
              </div>

              {/* Loaded Slots Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detail Penempatan Trailer</h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Bay Slot</th>
                        <th className="py-2.5 px-3">ID Kargo</th>
                        <th className="py-2.5 px-3">Kategori</th>
                         <th className="py-2.5 px-3">Volume (m³)</th>
                        <th className="py-2.5 px-3">Dimensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {slots.filter(s => s.occupied).map((slot) => (
                        <tr key={slot.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">{slot.id}</td>
                          <td className="py-2 px-3">{slot.shipmentId}</td>
                          <td className="py-2 px-3">{slot.type}</td>
                           <td className="py-2 px-3">{(getVolume(slot.dimensions)).toFixed(2)} m³</td>
                          <td className="py-2 px-3 font-mono text-[10px]">{slot.dimensions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-750">
                <div className="space-y-12">
                  <span className="block border-b border-slate-200 pb-1.5 mx-auto max-w-[160px]">Marcus Lee</span>
                  <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Driver Signature</span>
                </div>
                <div className="space-y-12">
                  <span className="block border-b border-slate-200 pb-1.5 mx-auto max-w-[160px]">{profile?.name || "Petugas Logistik"}</span>
                  <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Loading Supervisor</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
