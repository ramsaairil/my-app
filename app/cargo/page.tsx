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
  Sparkles
} from "lucide-react";
import { CargoMasterItem } from "../../lib/types";
import {
  getStoredCargos,
  saveStoredCargos,
  calculateVolumeM3
} from "../../lib/storage";

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
    const loaded = getStoredCargos();
    setCargos(loaded);
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
      const updated = cargos.map((c) => {
        if (c.id === editingId) {
          return {
            ...c,
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            lengthCm: Number(formLength),
            widthCm: Number(formWidth),
            heightCm: Number(formHeight),
            volumeM3: computedVolumeM3,
            color: formColor
          };
        }
        return c;
      });
      setCargos(updated);
      saveStoredCargos(updated);
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
      showToast(`Barang ${formName} berhasil ditambahkan!`, "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteCargo = (id: string) => {
    const updated = cargos.filter((c) => c.id !== id);
    setCargos(updated);
    saveStoredCargos(updated);
    setDeleteTargetId(null);
    showToast("Data barang berhasil dihapus!", "success");
  };

  const filteredCargos = useMemo(() => {
    return cargos.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    });
  }, [cargos, searchQuery]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50/95 border-emerald-300 text-emerald-900"
              : "bg-rose-50/95 border-rose-300 text-rose-900"
          }`}
        >
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="text-xs font-bold">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader title="Data Muatan">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
          <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Tambah Barang</span>
        </button>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Jenis Barang</p>
                <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{cargos.length} <span className="text-sm font-bold text-slate-500">Box</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                <Package size={22} />
              </div>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group border-emerald-200/60">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Bentuk Geometri</p>
                <p className="text-3xl font-black text-emerald-700 mt-1 tracking-tight">100% <span className="text-sm font-bold text-emerald-800">Box (Cuboid)</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-inner group-hover:scale-110 transition-transform">
                <Box size={22} />
              </div>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group border-indigo-200/60">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800">Rata-rata Volume Unit</p>
                <p className="text-3xl font-black text-indigo-900 mt-1 tracking-tight">
                  {cargos.length > 0
                    ? (cargos.reduce((a, b) => a + b.volumeM3, 0) / cargos.length).toFixed(3)
                    : 0}{" "}
                  <span className="text-sm font-bold text-indigo-700">m³</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-inner group-hover:scale-110 transition-transform">
                <Palette size={22} />
              </div>
            </div>
          </div>

          {/* Master Table Container */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Package size={16} className="text-emerald-700" />
                  Master Data Barang Box
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Seluruh barang direpresentasikan dalam bentuk Box (Cuboid) untuk algoritma 3D Bin Packing.
                </p>
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode atau nama barang..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 bg-white font-medium shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider bg-slate-50/80 text-[10px]">
                    <th className="py-3.5 px-4">Kode Barang</th>
                    <th className="py-3.5 px-4">Nama Barang</th>
                    <th className="py-3.5 px-4">Dimensi Box (P x L x T)</th>
                    <th className="py-3.5 px-4">Volume Unit</th>
                    <th className="py-3.5 px-4">Warna Box 3D</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCargos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400">
                        <Package className="mx-auto mb-2 text-slate-300" size={36} />
                        <p className="font-bold text-xs text-slate-700">Tidak ada data barang ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik &quot;Tambah Barang&quot; untuk mendaftarkan barang box baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCargos.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {item.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-md shrink-0 border border-slate-950/20 shadow-xs group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {item.lengthCm} x {item.widthCm} x {item.heightCm} cm
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                          {item.volumeM3.toFixed(3)} m³
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-6 h-6 rounded-lg border border-slate-950/30 shadow-xs shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-mono text-[11px] font-bold text-slate-600 uppercase">
                              {item.color}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Barang"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Barang"
                            >
                              <Trash2 size={14} />
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
        </div>
      </div>

      {/* Modal Add / Edit Cargo Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 z-10 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Box size={18} className="text-emerald-700" />
                {editingId ? "Edit Master Barang Box" : "Tambah Barang Box Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Contoh: BOX-A"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kardus Indomie Standard"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Dimensions Section */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">
                    Dimensi Box (Cuboid)
                  </span>
                  <span className="text-[11px] font-black text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                    Volume Unit: {computedVolumeM3} m³
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Panjang (cm)
                    </label>
                    <input
                      type="number"
                      value={formLength || ""}
                      onChange={(e) => setFormLength(Number(e.target.value))}
                      placeholder="40"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Lebar (cm)
                    </label>
                    <input
                      type="number"
                      value={formWidth || ""}
                      onChange={(e) => setFormWidth(Number(e.target.value))}
                      placeholder="30"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Tinggi (cm)
                    </label>
                    <input
                      type="number"
                      value={formHeight || ""}
                      onChange={(e) => setFormHeight(Number(e.target.value))}
                      placeholder="30"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Color Picker section */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Warna Box untuk Visualisasi 3D
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-10 p-1 border border-slate-200 rounded-xl cursor-pointer bg-white shadow-2xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setFormColor(swatch)}
                        className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                          formColor.toLowerCase() === swatch.toLowerCase()
                            ? "scale-110 border-slate-900 shadow-md ring-2 ring-emerald-500"
                            : "border-slate-300 hover:scale-105"
                        }`}
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-md transition-colors cursor-pointer text-xs"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDeleteTargetId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full z-10 space-y-4 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">Hapus Data Barang Ini?</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Data barang box akan dihapus secara permanen dari master inventaris.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCargo(deleteTargetId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
