"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import {
  Package,
  Plus,
  Search,
  X,
  Layers,
  Database,
  Sparkles,
  Inbox
} from "lucide-react";

// Helper to calculate volume (m³) from dimension string like "1.2x0.8x1.4 m"
const getVolume = (dimStr: string): number => {
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
interface CargoItem {
  id: string;
  badge: string;
  badgeColor: string;
  type: string;
  qty: string;
  dimension: string;
  method: string;
}

export default function CargoDatabasePage() {
  const profile = useProfile();

  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Toast Notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // State for new custom cargo input form
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [customId, setCustomId] = useState("");
  const [customType, setCustomType] = useState("Pallet");
  const [customQty, setCustomQty] = useState("10 Unit");
  const [customDim, setCustomDim] = useState("1.2x0.8x1.4 m");
  const [customMethod, setCustomMethod] = useState("Forklift");
  const [customBadge, setCustomBadge] = useState("Standar");
  const [customCounter, setCustomCounter] = useState(1);

  // Baseline profiles definitions
  const baselines = {
    default: {
      name: "Operasi Default Logistic",
      description: "Muatan kargo default (KRG-9821, KRG-9822, KRG-9823) dengan beberapa slot terisi sebelumnya.",
      shipments: [
        { id: "KRG-9821", badge: "Standar", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", type: "Pallet", qty: "10 palet", dimension: "0.8x0.6x1 m", method: "Forklift" },
        { id: "KRG-9822", badge: "Prioritas", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Kotak", qty: "15 kotak", dimension: "0.4x0.2x1 m", method: "Manual" },
        { id: "KRG-9823", badge: "Volume Tinggi", badgeColor: "bg-blue-50 text-blue-700 border-blue-200", type: "Kotak", qty: "12 kotak", dimension: "1.5x1.2x0.4 m", method: "Forklift" }
      ] as CargoItem[]
    },
    br1: {
      name: "Bischoff & Ratcliff (BR1) - Heterogen Lemah",
      description: "Dataset patokan standar BR1 untuk masalah pengepakan kontainer yang berisi kargo dengan jenis heterogen lemah.",
      shipments: [
        { id: "KRG-BR1-01", badge: "Standar", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", type: "Pallet", qty: "8 palet", dimension: "1.2x0.8x1.6 m", method: "Forklift" },
        { id: "KRG-BR1-02", badge: "Prioritas", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Kotak", qty: "5 kotak", dimension: "0.8x0.6x1.0 m", method: "Manual" },
        { id: "KRG-BR1-03", badge: "Volume Tinggi", badgeColor: "bg-blue-50 text-blue-700 border-blue-200", type: "Kotak", qty: "10 kotak", dimension: "0.4x0.4x0.4 m", method: "Manual" }
      ] as CargoItem[]
    },
    br5: {
      name: "Bischoff & Ratcliff (BR5) - Heterogen Sedang",
      description: "Dataset patokan BR5 dengan lebih banyak variasi dalam ukuran kotak dan batasan, ideal untuk pengujian distribusi berat.",
      shipments: [
        { id: "KRG-BR5-01", badge: "Prioritas", badgeColor: "bg-green-50 text-green-700 border-green-200", type: "Pallet", qty: "4 palet", dimension: "2.0x0.8x1.2 m", method: "Forklift" },
        { id: "KRG-BR5-02", badge: "Volume Tinggi", badgeColor: "bg-blue-50 text-blue-700 border-blue-200", type: "Kotak", qty: "6 kotak", dimension: "0.8x0.8x1.8 m", method: "Manual" },
        { id: "KRG-BR5-03", badge: "Standar", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", type: "Kotak", qty: "12 kotak", dimension: "0.5x0.5x0.5 m", method: "Manual" }
      ] as CargoItem[]
    },
    homogeneous: {
      name: "Profil Europallet Homogen",
      description: "Europallet standar seragam untuk optimalisasi muatan kontainer seragam dan pengepakan volume maksimum.",
      shipments: [
        { id: "KRG-HOM-01", badge: "Standar", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", type: "Pallet", qty: "18 palet", dimension: "1.2x0.8x1.4 m", method: "Forklift" }
      ] as CargoItem[]
    }
  };

  const [activeBaseline, setActiveBaseline] = useState<keyof typeof baselines>("default");

  // Dynamic state for baseline/custom shipments
  const [customShipments, setCustomShipments] = useState<Record<string, CargoItem[]>>({
    default: [...baselines.default.shipments],
    br1: [...baselines.br1.shipments],
    br5: [...baselines.br5.shipments],
    homogeneous: [...baselines.homogeneous.shipments]
  });

  const availableShipments = useMemo(() => {
    return customShipments[activeBaseline] || [];
  }, [customShipments, activeBaseline]);

  // Statistics calculations
  const statsSummary = useMemo(() => {
    const items = availableShipments;
    const totalItemsCount = items.length;
    const totalVolume = items.reduce((sum, item) => {
      const qtyVal = parseInt(item.qty) || 1;
      return sum + (getVolume(item.dimension) * qtyVal);
    }, 0);
    const priorityCount = items.filter(item => item.badge === "Prioritas").length;
    return {
      totalItemsCount,
      totalVolume,
      priorityCount
    };
  }, [availableShipments]);

  const handleSaveCustomCargo = (e: React.FormEvent) => {
    e.preventDefault();

    const idToUse = customId.trim() || `KRG-CST-${String(customCounter).padStart(3, "0")}`;
    
    // Check for duplicate ID
    const exists = availableShipments.some((item) => item.id.toLowerCase() === idToUse.toLowerCase());
    if (exists) {
      showToast(`ID Kargo ${idToUse} sudah digunakan!`, "error");
      return;
    }

    const badgeColor =
      customBadge === "Prioritas"
        ? "bg-green-50 text-green-700 border-green-200"
        : customBadge === "Volume Tinggi"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-slate-100 text-slate-700 border-slate-200";

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
      [activeBaseline]: [...(prev[activeBaseline] || []), newItem]
    }));

    // Reset Form
    setCustomId("");
    setCustomCounter((c) => c + 1);
    setIsAddFormOpen(false);
    showToast(`Kargo Kustom ${idToUse} ditambahkan ke database!`, "success");
  };

  const handleBaselineChange = (val: keyof typeof baselines) => {
    setActiveBaseline(val);
    showToast(`Memuat dataset kargo: ${baselines[val].name}`, "success");
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Search and priority category filtering
  const filteredShipments = useMemo(() => {
    return availableShipments.filter((shipment) => {
      const matchesSearch =
        shipment.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        shipment.type.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        shipment.badge.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "priority" && shipment.badge === "Prioritas") ||
        (activeTab === "volume" && shipment.badge === "Volume Tinggi") ||
        (activeTab === "standard" && shipment.badge === "Standar");

      return matchesSearch && matchesTab;
    });
  }, [availableShipments, searchQuery, activeTab]);

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
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Database Kargo & Inventaris Barang"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Kargo" }
        ]}
        badge={
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <Database size={12} />
            Data Inventaris
          </span>
        }
      >
        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus size={14} />
          <span>Tambah Kargo</span>
        </button>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Jenis Barang</span>
                <Package size={18} className="text-slate-400" />
              </div>
              <div className="mt-4 space-y-0.5">
                <span className="text-2xl font-bold text-slate-800 block">{statsSummary.totalItemsCount} Kategori</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Terdaftar dalam manifest aktif</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimasi Total Volume</span>
                <Layers size={18} className="text-slate-400" />
              </div>
              <div className="mt-4 space-y-0.5">
                <span className="text-2xl font-bold text-slate-800 block">{statsSummary.totalVolume.toFixed(2)} m³</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Berdasarkan P x L x T barang</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kargo Prioritas</span>
                <Sparkles size={18} className="text-slate-400" />
              </div>
              <div className="mt-4 space-y-0.5">
                <span className="text-2xl font-bold text-slate-800 block">{statsSummary.priorityCount} Kargo</span>
                <span className="text-[10px] font-semibold text-slate-500 block">Memerlukan penanganan prioritas</span>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Dataset selectors */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Inventaris & Manifes Kargo</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Daftar manifes kargo yang terdaftar di hub pergudangan untuk dioptimalkan.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search query */}
                <div className="relative min-w-[200px]">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID atau nama barang..."
                    className="pl-8 pr-8 py-2 w-full border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white placeholder-slate-400 text-slate-700 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-650"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Dataset selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold border border-slate-200 px-3 py-2 bg-slate-50 rounded-lg shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Dataset:</span>
                  <select
                    value={activeBaseline}
                    onChange={(e) => handleBaselineChange(e.target.value as keyof typeof baselines)}
                    className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="default">Default Logistic</option>
                    <option value="br1">Bischoff BR1 (Lemah)</option>
                    <option value="br5">Bischoff BR5 (Sedang)</option>
                    <option value="homogeneous">Europallet Homogen</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Cargo Addition Form */}
            {isAddFormOpen && (
              <form onSubmit={handleSaveCustomCargo} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <Plus size={16} className="text-emerald-700" />
                    Tambah Item Kargo Kustom Baru
                  </h3>
                  <button type="button" onClick={() => setIsAddFormOpen(false)} className="text-slate-400 hover:text-slate-650 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">ID Kargo (Opsional)</label>
                    <input
                      type="text"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      placeholder={`KRG-CST-${String(customCounter).padStart(3, "0")}`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Jenis Paket</label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 cursor-pointer"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Prioritas / Badge</label>
                    <select
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 cursor-pointer"
                    >
                      <option value="Standar">Standar</option>
                      <option value="Prioritas">Prioritas</option>
                      <option value="Volume Tinggi">Volume Tinggi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Metode Muat</label>
                    <select
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 cursor-pointer"
                    >
                      <option value="Forklift">Forklift</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-center"
                    >
                      Simpan Kargo ke Database
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Category tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-3">
              {[
                { id: "all", label: "Semua Kargo" },
                { id: "priority", label: "Prioritas Utama" },
                { id: "volume", label: "Volume Tinggi" },
                { id: "standard", label: "Standar" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Inventory Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="border border-slate-150 rounded-xl p-5 flex flex-col justify-between bg-slate-50/40 hover:bg-white hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start pb-3 border-b border-slate-100/80 mb-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-sm font-extrabold text-slate-900">{shipment.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${shipment.badgeColor}`}>
                      {shipment.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-1.5 text-[11px] text-slate-400 font-medium mb-4">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jenis Paket</span>
                      <span className="text-slate-800 font-bold text-xs">{shipment.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jumlah</span>
                      <span className="text-slate-800 font-bold text-xs">{shipment.qty}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
                      <span className="text-slate-800 font-bold text-xs">{(getVolume(shipment.dimension) * (parseInt(shipment.qty) || 1)).toFixed(2)} m³</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dimensi</span>
                      <span className="text-slate-800 font-bold font-mono text-xs block truncate" title={shipment.dimension}>
                        {shipment.dimension}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metode Muat</span>
                      <span className="text-slate-700 font-semibold">{shipment.method}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bentuk</span>
                      <span className="text-slate-750 font-bold">{getShapeLabel(shipment.dimension)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredShipments.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-slate-400 text-sm font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
                  Tidak ada data kargo yang cocok dengan &quot;{searchQuery}&quot; dalam kategori ini.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
