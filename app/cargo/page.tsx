"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
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
  "#087F5B", // Emerald
  "#3B82F6", // Blue
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
  const [formColor, setFormColor] = useState<string>("#087F5B");

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
    setFormColor("#087F5B");
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
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">
      
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-[#E8F7F1] border-[#087F5B]/30 text-[#087F5B]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <CheckCircle2 size={16} className="text-[#087F5B]" />
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-[#667085] hover:text-[#172033] cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 sm:p-9 space-y-7">
        <div className="max-w-[1320px] mx-auto space-y-7">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7EBF0]">
            <div>
              <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
                Data Barang
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Kelola dimensi, volume, dan informasi muatan.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-[13px] font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Tambah Barang</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-[#E7EBF0]">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama barang..."
                className="w-full pl-9 pr-8 py-1.5 text-[13px] bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:bg-white focus:border-[#087F5B] transition-all text-[#172033] placeholder-[#667085]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#172033] cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <span className="text-[12px] font-mono text-[#667085]">
              Total: <span className="font-semibold text-[#172033]">{filteredCargos.length} Barang</span>
            </span>
          </div>

          {/* Clean Enterprise Data Table */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#E7EBF0] bg-[#F8FAFC] text-[#667085] font-semibold text-[12px]">
                    <th className="py-3 px-5 font-medium">Kode</th>
                    <th className="py-3 px-5 font-medium">Nama Barang</th>
                    <th className="py-3 px-5 font-medium">Dimensi</th>
                    <th className="py-3 px-5 font-medium">Volume</th>
                    <th className="py-3 px-5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EBF0] text-[#172033]">
                  {filteredCargos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#667085]">
                        <Package className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="font-semibold text-sm text-[#172033]">Tidak ada data barang</p>
                        <p className="text-xs text-[#667085] mt-0.5">Coba cari dengan kata kunci lain atau tambahkan barang baru.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCargos.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#172033]">
                          {cargo.code}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-[#172033]">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cargo.color }} />
                            <span>{cargo.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#667085]">
                          {cargo.lengthCm} × {cargo.widthCm} × {cargo.heightCm} cm
                        </td>
                        <td className="py-3.5 px-5 font-mono font-semibold text-[#087F5B]">
                          {cargo.volumeM3.toFixed(3)} m³
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(cargo)}
                              className="text-[12px] font-semibold text-[#667085] hover:text-[#172033] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(cargo.id)}
                              className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              Hapus
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

      {/* MODAL: ADD / EDIT CARGO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-[#172033]/30 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-[#E7EBF0] p-6 z-10 space-y-5">
            <div className="flex justify-between items-center border-b border-[#E7EBF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  {editingId ? "Edit Barang" : "Tambah Barang Baru"}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Spesifikasi dimensi dan volume muatan kargo.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#667085] hover:text-[#172033] p-1 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Kode Barang</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Contoh: BOX-001"
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Nama Barang</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kardus Elektronik A"
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">Panjang (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formLength}
                    onChange={(e) => setFormLength(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">Lebar (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formWidth}
                    onChange={(e) => setFormWidth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#172033] mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={formHeight}
                    onChange={(e) => setFormHeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#E8F7F1] border border-[#087F5B]/20 rounded-lg flex justify-between items-center">
                <span className="text-xs text-[#087F5B] font-medium">Volume Otomatis (m³):</span>
                <span className="text-sm font-bold font-mono text-[#087F5B]">{computedVolumeM3.toFixed(3)} m³</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">Warna Tampilan 3D</label>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                        formColor === color ? "scale-110 ring-2 ring-[#172033] ring-offset-1" : "hover:scale-105"
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
                  className="flex-1 py-2 bg-[#F8FAFC] hover:bg-slate-200 text-[#172033] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#E7EBF0]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Simpan Barang
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteTargetId(null)}
            className="absolute inset-0 bg-[#172033]/30 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-[#E7EBF0] p-5 z-10 space-y-4">
            <h3 className="text-base font-bold text-[#172033]">Konfirmasi Hapus</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Apakah Anda yakin ingin menghapus barang <span className="font-bold text-[#172033]">{deleteTargetId}</span>?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 bg-[#F8FAFC] hover:bg-slate-200 text-[#172033] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#E7EBF0]"
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
