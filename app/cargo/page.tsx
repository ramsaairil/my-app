"use client";

import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import {
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
  Box,
  Palette,
  Sparkles,
  Table as TableIcon,
  LayoutGrid,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Hash,
  Type,
  Maximize,
  Tag,
  MoreHorizontal,
  Info,
  Check
} from "lucide-react";
import { CargoMasterItem } from "../../lib/types";
import {
  getStoredCargos,
  saveStoredCargos,
  calculateVolumeM3
} from "../../lib/storage";
import { upsertCargoToDb, deleteCargoFromDb, fetchCargosFromDb } from "../../lib/db";

const COLOR_SWATCHES = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#F97316"  // Orange
];

export default function CargoMasterDataPage() {
  const [cargos, setCargos] = useState<CargoMasterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"table" | "gallery" | "summary">("table");
  const [sortBy, setSortBy] = useState<"code" | "name" | "volume">("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>("all");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formLength, setFormLength] = useState<number>(40);
  const [formWidth, setFormWidth] = useState<number>(30);
  const [formHeight, setFormHeight] = useState<number>(30);
  const [formColor, setFormColor] = useState<string>("#3B82F6");

  // Delete Target Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Auto-computed Volume
  const computedVolumeM3 = useMemo(() => {
    return calculateVolumeM3(formLength, formWidth, formHeight);
  }, [formLength, formWidth, formHeight]);

  useEffect(() => {
    async function loadData() {
      const dbCargos = await fetchCargosFromDb();
      if (dbCargos && dbCargos.length > 0) {
        const mapped: CargoMasterItem[] = dbCargos.map((item, idx) => {
          const dimsStr = (item.dimension || "40x30x30").replace(/\s*cm/gi, "").replace(/[\*×]/g, "x");
          const parts = dimsStr.split("x").map((n) => Number(n.trim()) || 30);
          const colorList = COLOR_SWATCHES;
          return {
            id: item.id,
            name: item.name || item.id,
            code: item.category || item.id,
            lengthCm: parts[0] || 40,
            widthCm: parts[1] || 30,
            heightCm: parts[2] || 30,
            volumeM3: Number(item.volume_m3 || calculateVolumeM3(parts[0] || 40, parts[1] || 30, parts[2] || 30)),
            color: colorList[idx % colorList.length]
          };
        });
        setCargos(mapped);
        saveStoredCargos(mapped);
      } else {
        const stored = getStoredCargos();
        setCargos(stored);
      }
    }
    loadData();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormName("Kardus Standar Baru");
    setFormCode(`BOX-${String(cargos.length + 1).padStart(3, "0")}`);
    setFormLength(45);
    setFormWidth(35);
    setFormHeight(30);
    setFormColor("#3B82F6");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CargoMasterItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCode(item.code);
    setFormLength(item.lengthCm);
    setFormWidth(item.widthCm);
    setFormHeight(item.heightCm);
    setFormColor(item.color);
    setIsModalOpen(true);
  };

  const handleSaveCargo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast("Nama barang wajib diisi!", "error");
      return;
    }
    if (!formCode.trim()) {
      showToast("Kode barang wajib diisi!", "error");
      return;
    }
    if (formLength <= 0 || formWidth <= 0 || formHeight <= 0) {
      showToast("Dimensi box harus lebih dari 0 cm!", "error");
      return;
    }

    if (editingId) {
      let editedItem: CargoMasterItem | null = null;
      const updated = cargos.map((c) => {
        if (c.id === editingId) {
          editedItem = {
            ...c,
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            lengthCm: Number(formLength),
            widthCm: Number(formWidth),
            heightCm: Number(formHeight),
            volumeM3: computedVolumeM3,
            color: formColor
          };
          return editedItem;
        }
        return c;
      });
      setCargos(updated);
      saveStoredCargos(updated);
      if (editedItem) {
        upsertCargoToDb(editedItem);
      }
      showToast(`Barang ${formName} berhasil diperbarui!`, "success");
    } else {
      const newId = `CRG-${String(Date.now()).slice(-4)}`;
      const newCargo: CargoMasterItem = {
        id: newId,
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        lengthCm: Number(formLength),
        widthCm: Number(formWidth),
        heightCm: Number(formHeight),
        volumeM3: computedVolumeM3,
        color: formColor
      };
      const updated = [newCargo, ...cargos];
      setCargos(updated);
      saveStoredCargos(updated);
      upsertCargoToDb(newCargo);
      showToast(`Barang ${formName} berhasil ditambahkan!`, "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteCargo = (id: string) => {
    const updated = cargos.filter((c) => c.id !== id);
    setCargos(updated);
    saveStoredCargos(updated);
    deleteCargoFromDb(id);
    setDeleteTargetId(null);
    showToast("Data barang berhasil dihapus!", "success");
  };

  // Filtered and Sorted Cargos
  const filteredCargos = useMemo(() => {
    let result = cargos.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesColor = selectedColorFilter === "all" || c.color.toLowerCase() === selectedColorFilter.toLowerCase();
      return matchesSearch && matchesColor;
    });

    return result.sort((a, b) => {
      let valA: string | number = a.code;
      let valB: string | number = b.code;

      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "volume") {
        valA = a.volumeM3;
        valB = b.volumeM3;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [cargos, searchQuery, selectedColorFilter, sortBy, sortOrder]);

  // Notion Database Aggregations
  const totalVolumeSum = useMemo(() => {
    return filteredCargos.reduce((sum, c) => sum + (c.volumeM3 || 0), 0);
  }, [filteredCargos]);

  const avgVolumeM3 = useMemo(() => {
    return filteredCargos.length > 0 ? totalVolumeSum / filteredCargos.length : 0;
  }, [filteredCargos, totalVolumeSum]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#fafafa] text-slate-800 font-sans antialiased">
      
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50/95 border-emerald-300 text-emerald-900"
              : "bg-rose-50/95 border-rose-300 text-rose-900"
          }`}
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Page Scroll Container */}
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
                  Data Muatan
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Database spesifikasi dimensi & volume kargo untuk algoritma 3D Bin Packing.
                </p>
              </div>

              {/* Notion Signature Blue + New Button */}
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d70c4] text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>New Cargo</span>
              </button>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* NOTION TOOLBAR & VIEW TABS BAR */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            
            {/* Left: View Tabs Selector */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg">
              <button
                onClick={() => setActiveView("table")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "table"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TableIcon size={14} className={activeView === "table" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Table View</span>
              </button>

              <button
                onClick={() => setActiveView("gallery")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "gallery"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid size={14} className={activeView === "gallery" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Gallery Cards</span>
              </button>

              <button
                onClick={() => setActiveView("summary")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "summary"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart3 size={14} className={activeView === "summary" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Analytics</span>
              </button>
            </div>

            {/* Right: Search, Color Filter & Sort Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              {/* Notion Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter or search cargo..."
                  className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-[#2383e2] transition-all text-slate-800 placeholder-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Sort Order Button */}
              <button
                onClick={() => {
                  if (sortBy === "code") setSortBy("name");
                  else if (sortBy === "name") setSortBy("volume");
                  else setSortBy("code");
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title={`Sort by: ${sortBy}`}
              >
                <ArrowUpDown size={12} className="text-slate-400" />
                <span className="capitalize">{sortBy}</span>
              </button>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* VIEW 1: NOTION DATABASE TABLE VIEW */}
          {/* ---------------------------------------------------- */}
          {activeView === "table" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  
                  {/* Notion Header with Property Type Icons */}
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold text-[11px] select-none">
                      
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-36">
                        <div className="flex items-center gap-1.5">
                          <Hash size={13} className="text-slate-400" />
                          <span>Kode Barang</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <Type size={13} className="text-slate-400" />
                          <span>Nama Barang</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-44">
                        <div className="flex items-center gap-1.5">
                          <Maximize size={13} className="text-slate-400" />
                          <span>Dimensi (P × L × T)</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-36">
                        <div className="flex items-center gap-1.5">
                          <Box size={13} className="text-slate-400" />
                          <span>Volume Unit</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-36">
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-slate-400" />
                          <span>Tag Warna 3D</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium text-right w-24">
                        <span>Aksi</span>
                      </th>

                    </tr>
                  </thead>

                  {/* Notion Table Rows */}
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                    {filteredCargos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Package className="mx-auto mb-2 text-slate-300" size={32} />
                          <p className="font-bold text-xs text-slate-600">No cargo items found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different code or name.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCargos.map((cargo) => (
                        <tr key={cargo.id} className="hover:bg-[#f7f7f5] transition-colors group">
                          
                          {/* Code Title Property */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-slate-900">
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              {cargo.code}
                            </span>
                          </td>

                          {/* Cargo Name */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cargo.color }} />
                              <span>{cargo.name}</span>
                            </div>
                          </td>

                          {/* Dimensions */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono text-slate-600">
                            {cargo.lengthCm} × {cargo.widthCm} × {cargo.heightCm} <span className="text-[10px] text-slate-400">cm</span>
                          </td>

                          {/* Volume */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-slate-900">
                            {cargo.volumeM3.toFixed(3)} <span className="text-[10px] text-slate-500 font-normal">m³</span>
                          </td>

                          {/* Notion Pastel Color Badge */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border"
                              style={{
                                backgroundColor: `${cargo.color}15`,
                                borderColor: `${cargo.color}40`,
                                color: cargo.color
                              }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cargo.color }} />
                              <span>Box ({cargo.color.toUpperCase()})</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(cargo)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(cargo.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW 2: GALLERY CARDS VIEW */}
          {/* ---------------------------------------------------- */}
          {activeView === "gallery" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCargos.map((cargo) => (
                <div
                  key={cargo.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group relative space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cargo.color }} />
                      <span className="font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {cargo.code}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{cargo.id}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cargo.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Cuboid Box Shape</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Dimensi</span>
                      <span className="font-bold text-slate-700">{cargo.lengthCm}×{cargo.widthCm}×{cargo.heightCm} cm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Volume</span>
                      <span className="font-bold text-emerald-700">{cargo.volumeM3.toFixed(3)} m³</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(cargo)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(cargo.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW 3: SUMMARY ANALYTICS */}
          {/* ---------------------------------------------------- */}
          {activeView === "summary" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Jenis Cargo</span>
                <span className="text-3xl font-black text-slate-900 block">{filteredCargos.length} Items</span>
                <p className="text-xs text-slate-500">Tersimpan di local storage & database</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Kumulatif Volume</span>
                <span className="text-3xl font-black text-emerald-700 block">{totalVolumeSum.toFixed(3)} m³</span>
                <p className="text-xs text-slate-500">Estimasi kubikasi total barang</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Volume Unit</span>
                <span className="text-3xl font-black text-indigo-700 block">{avgVolumeM3.toFixed(3)} m³</span>
                <p className="text-xs text-slate-500">Perhitungan rata-rata per box</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CARGO */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-10 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? "Edit Barang Box" : "Tambah Barang Box Baru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi spesifikasi ukuran dan warna untuk visualisasi 3D.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Barang</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Contoh: BOX-001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kardus Elektronik"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Panjang (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formLength}
                    onChange={(e) => setFormLength(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lebar (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formWidth}
                    onChange={(e) => setFormWidth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formHeight}
                    onChange={(e) => setFormHeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg flex justify-between items-center">
                <span className="text-xs text-emerald-800 font-medium">Volume Otomatis (m³):</span>
                <span className="text-sm font-bold font-mono text-emerald-700">{computedVolumeM3.toFixed(3)} m³</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Warna Tampilan 3D</label>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                        formColor === color ? "scale-110 ring-2 ring-slate-900 ring-offset-1" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#2383e2] hover:bg-[#1d70c4] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Simpan Barang
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ---------------------------------------------------- */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteTargetId(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus barang <span className="font-bold text-slate-900">{deleteTargetId}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteCargo(deleteTargetId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
