"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import {
  Package,
  Plus,
  Search,
  X,
  Database,
  Inbox,
  Trash2
} from "lucide-react";
import { fetchCargosFromDb, insertCargoToDb, deleteCargoFromDb } from "../../lib/db";

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
  type: string;
  qty: string;
  dimension: string;
}

export default function CargoDatabasePage() {
  const profile = useProfile();

  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  const [customCounter, setCustomCounter] = useState(1);

  // Baseline profiles definitions
  const baselines = {
    default: {
      name: "Operasi Default Logistic",
      description: "Muatan kargo default (KRG-9821, KRG-9822, KRG-9823) dengan beberapa slot terisi sebelumnya.",
      shipments: [
        { id: "KRG-9821", type: "Pallet", qty: "10 palet", dimension: "0.8x0.6x1 m" },
        { id: "KRG-9822", type: "Kotak", qty: "15 kotak", dimension: "0.4x0.2x1 m" },
        { id: "KRG-9823", type: "Kotak", qty: "12 kotak", dimension: "1.5x1.2x0.4 m" }
      ] as CargoItem[]
    },
    br1: {
      name: "Bischoff & Ratcliff (BR1) - Heterogen Lemah",
      description: "Dataset patokan standar BR1 untuk masalah pengepakan kontainer yang berisi kargo dengan jenis heterogen lemah.",
      shipments: [
        { id: "KRG-BR1-01", type: "Pallet", qty: "8 palet", dimension: "1.2x0.8x1.6 m" },
        { id: "KRG-BR1-02", type: "Kotak", qty: "5 kotak", dimension: "0.8x0.6x1.0 m" },
        { id: "KRG-BR1-03", type: "Kotak", qty: "10 kotak", dimension: "0.4x0.4x0.4 m" }
      ] as CargoItem[]
    },
    br5: {
      name: "Bischoff & Ratcliff (BR5) - Heterogen Sedang",
      description: "Dataset patokan BR5 dengan lebih banyak variasi dalam ukuran kotak dan batasan, ideal untuk pengujian distribusi berat.",
      shipments: [
        { id: "KRG-BR5-01", type: "Pallet", qty: "4 palet", dimension: "2.0x0.8x1.2 m" },
        { id: "KRG-BR5-02", type: "Kotak", qty: "6 kotak", dimension: "0.8x0.8x1.8 m" },
        { id: "KRG-BR5-03", type: "Kotak", qty: "12 kotak", dimension: "0.5x0.5x0.5 m" }
      ] as CargoItem[]
    },
    homogeneous: {
      name: "Profil Europallet Homogen",
      description: "Europallet standar seragam untuk optimalisasi muatan kontainer seragam dan pengepakan volume maksimum.",
      shipments: [
        { id: "KRG-HOM-01", type: "Pallet", qty: "18 palet", dimension: "1.2x0.8x1.4 m" }
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

  // Sync cargos from Supabase PostgreSQL database
  useEffect(() => {
    async function syncDb() {
      const dbCargos = await fetchCargosFromDb();
      if (dbCargos && dbCargos.length > 0) {
        const mappedFromDb: CargoItem[] = dbCargos.map((item) => ({
          id: item.id,
          type: item.category || "Pallet",
          qty: `${item.quantity || 1} unit`,
          dimension: item.dimension || "1.2x0.8x1.4 m"
        }));

        setCustomShipments((prev) => ({
          ...prev,
          default: [...mappedFromDb, ...prev.default.filter(d => !mappedFromDb.some(m => m.id === d.id))]
        }));
      }
    }
    syncDb();
  }, []);

  const handleSaveCustomCargo = async (e: React.FormEvent) => {
    e.preventDefault();

    const idToUse = customId.trim() || `KRG-CST-${String(customCounter).padStart(3, "0")}`;
    
    // Check for duplicate ID
    const exists = availableShipments.some((item) => item.id.toLowerCase() === idToUse.toLowerCase());
    if (exists) {
      showToast(`ID Kargo ${idToUse} sudah digunakan!`, "error");
      return;
    }

    const newItem: CargoItem = {
      id: idToUse,
      type: customType,
      qty: customQty,
      dimension: customDim
    };

    // Save to Supabase PostgreSQL database
    const qtyNumber = parseInt(customQty) || 1;
    const volM3 = getVolume(customDim) * qtyNumber;
    await insertCargoToDb({
      id: idToUse,
      name: `Kargo ${idToUse}`,
      category: customType,
      quantity: qtyNumber,
      dimension: customDim,
      volume_m3: volM3,
      status: "Unassigned"
    });

    setCustomShipments((prev) => ({
      ...prev,
      [activeBaseline]: [...(prev[activeBaseline] || []), newItem]
    }));

    // Reset Form
    setCustomId("");
    setCustomCounter((c) => c + 1);
    setIsAddFormOpen(false);
    showToast(`Kargo Kustom ${idToUse} tersimpan ke database!`, "success");
  };

  const handleDeleteCargo = async (id: string) => {
    await deleteCargoFromDb(id);
    setCustomShipments((prev) => ({
      ...prev,
      [activeBaseline]: (prev[activeBaseline] || []).filter((item) => item.id !== id)
    }));
    showToast(`Kargo ${id} berhasil dihapus!`, "success");
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Search filtering
  const filteredShipments = useMemo(() => {
    return availableShipments.filter((shipment) => {
      return (
        shipment.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        shipment.type.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    });
  }, [availableShipments, searchQuery]);

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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-medium">
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

            {/* Inventory Table List */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3 px-4">ID Kargo</th>
                    <th className="py-3 px-4">Jenis Paket</th>
                    <th className="py-3 px-4">Jumlah</th>
                    <th className="py-3 px-4">Dimensi (P x L x T)</th>
                    <th className="py-3 px-4">Total Volume</th>
                    <th className="py-3 px-4">Bentuk</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package size={15} className="text-slate-400" />
                          <span>{shipment.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{shipment.type}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{shipment.qty}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{shipment.dimension}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {(getVolume(shipment.dimension) * (parseInt(shipment.qty) || 1)).toFixed(2)} m³
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{getShapeLabel(shipment.dimension)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCargo(shipment.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Hapus Kargo ${shipment.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400 text-sm font-semibold bg-slate-50/30">
                        <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
                        Tidak ada data kargo yang cocok dengan &quot;{searchQuery}&quot; dalam kategori ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

