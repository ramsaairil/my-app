"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Search,
  Check
} from "lucide-react";
import { Vehicle, VehicleType } from "../../lib/types";
import {
  VEHICLE_PRESETS,
  getStoredVehicles,
  saveStoredVehicles,
  calculateVolumeM3
} from "../../lib/storage";
import { upsertTruckToDb, deleteTruckFromDb, fetchTrucksFromDb } from "../../lib/db";

export default function FleetOperationsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
  const [formType, setFormType] = useState<VehicleType | string>("Gran Max Pick Up");
  const [formLength, setFormLength] = useState<number>(235);
  const [formWidth, setFormWidth] = useState<number>(155);
  const [formHeight, setFormHeight] = useState<number>(130);
  const [formStatus, setFormStatus] = useState<"Aktif" | "Nonaktif">("Aktif");

  // Confirmation Delete Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Auto-calculated volume
  const computedVolumeM3 = useMemo(() => {
    return calculateVolumeM3(formLength, formWidth, formHeight);
  }, [formLength, formWidth, formHeight]);

  useEffect(() => {
    async function loadData() {
      const dbTrucks = await fetchTrucksFromDb();
      if (dbTrucks && dbTrucks.length > 0) {
        const mapped: Vehicle[] = dbTrucks.map((t) => ({
          id: t.id,
          name: t.truck_name || t.id,
          type: "Box Truck 3D",
          lengthCm: t.length_cm || 450,
          widthCm: t.width_cm || 200,
          heightCm: t.height_cm || 200,
          volumeM3: Number(t.max_volume_m3 || 18.0),
          status: t.status === "Maintenance" ? "Nonaktif" : "Aktif",
          notes: ""
        }));
        setVehicles(mapped);
        saveStoredVehicles(mapped);
      } else {
        const stored = getStoredVehicles();
        setVehicles(stored);
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

  const handleApplyPreset = (presetType: VehicleType) => {
    const preset = VEHICLE_PRESETS.find((p) => p.type === presetType);
    if (preset) {
      setFormType(preset.type);
      setFormLength(preset.lengthCm);
      setFormWidth(preset.widthCm);
      setFormHeight(preset.heightCm);
      if (!editingId && (!formName || formName.startsWith("Armada"))) {
        setFormName(`${preset.name} #1`);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormName("Gran Max Pick Up #1");
    setFormType("Gran Max Pick Up");
    setFormLength(235);
    setFormWidth(155);
    setFormHeight(130);
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setEditingId(v.id);
    setFormName(v.name);
    setFormType(v.type);
    setFormLength(v.lengthCm);
    setFormWidth(v.widthCm);
    setFormHeight(v.heightCm);
    setFormStatus(v.status);
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast("Nama kendaraan wajib diisi!", "error");
      return;
    }
    if (formLength <= 0 || formWidth <= 0 || formHeight <= 0) {
      showToast("Dimensi ruang muatan harus lebih dari 0 cm!", "error");
      return;
    }

    if (editingId) {
      let editedVehicle: Vehicle | null = null;
      const updated = vehicles.map((v) => {
        if (v.id === editingId) {
          editedVehicle = {
            ...v,
            name: formName.trim(),
            type: formType,
            lengthCm: Number(formLength),
            widthCm: Number(formWidth),
            heightCm: Number(formHeight),
            volumeM3: computedVolumeM3,
            status: formStatus
          };
          return editedVehicle;
        }
        return v;
      });
      setVehicles(updated);
      saveStoredVehicles(updated);
      if (editedVehicle) {
        upsertTruckToDb(editedVehicle);
      }
      showToast(`Kendaraan ${formName} berhasil diperbarui!`, "success");
    } else {
      const newId = `TRK-${String(Date.now()).slice(-4)}`;
      const newVehicle: Vehicle = {
        id: newId,
        name: formName.trim(),
        type: formType,
        lengthCm: Number(formLength),
        widthCm: Number(formWidth),
        heightCm: Number(formHeight),
        volumeM3: computedVolumeM3,
        status: formStatus
      };
      const updated = [newVehicle, ...vehicles];
      setVehicles(updated);
      saveStoredVehicles(updated);
      upsertTruckToDb(newVehicle);
      showToast(`Kendaraan baru ${formName} berhasil ditambahkan!`, "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteVehicle = (id: string) => {
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    saveStoredVehicles(updated);
    deleteTruckFromDb(id);
    setDeleteTargetId(null);
    showToast("Kendaraan berhasil dihapus!", "success");
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      return (
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vehicles, searchQuery]);

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
                Data Kendaraan
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Kelola armada dan kapasitas ruang muat.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-[13px] font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Tambah Kendaraan</span>
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
                placeholder="Cari ID unit atau nama kendaraan..."
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
              Total Armada: <span className="font-semibold text-[#172033]">{filteredVehicles.length} Unit</span>
            </span>
          </div>

          {/* Clean Enterprise Data Table */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#E7EBF0] bg-[#F8FAFC] text-[#667085] font-semibold text-[12px]">
                    <th className="py-3 px-5 font-medium">ID Unit</th>
                    <th className="py-3 px-5 font-medium">Nama Kendaraan</th>
                    <th className="py-3 px-5 font-medium">Tipe</th>
                    <th className="py-3 px-5 font-medium">Dimensi Ruang</th>
                    <th className="py-3 px-5 font-medium">Kapasitas Volume</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EBF0] text-[#172033]">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#667085]">
                        <Truck className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="font-semibold text-sm text-[#172033]">Tidak ada data kendaraan</p>
                        <p className="text-xs text-[#667085] mt-0.5">Coba cari dengan kata kunci lain atau tambahkan armada baru.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#172033]">
                          {vehicle.id}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#172033]">
                          {vehicle.name}
                        </td>
                        <td className="py-3.5 px-5 text-[#667085]">
                          {vehicle.type}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[#667085]">
                          {vehicle.lengthCm} × {vehicle.widthCm} × {vehicle.heightCm} cm
                        </td>
                        <td className="py-3.5 px-5 font-mono font-bold text-[#087F5B]">
                          {vehicle.volumeM3.toFixed(2)} m³
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#087F5B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                            <span>{vehicle.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(vehicle)}
                              className="text-[12px] font-semibold text-[#667085] hover:text-[#172033] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(vehicle.id)}
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

      {/* MODAL: ADD / EDIT VEHICLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-[#172033]/30 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#E7EBF0] p-6 z-10 space-y-5">
            <div className="flex justify-between items-center border-b border-[#E7EBF0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  {editingId ? "Edit Kendaraan" : "Tambah Kendaraan Baru"}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Atur spesifikasi ruang muat armada kendaraan.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#667085] hover:text-[#172033] p-1 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Presets Picker */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                Gunakan Preset Standar:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VEHICLE_PRESETS.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => handleApplyPreset(p.type)}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#F8FAFC] hover:bg-[#E8F7F1] hover:text-[#087F5B] text-[#172033] rounded-md transition-colors cursor-pointer border border-[#E7EBF0]"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Nama Kendaraan</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Gran Max Pick Up #1"
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-medium text-[#172033]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Tipe Kendaraan</label>
                  <input
                    type="text"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    placeholder="Contoh: Box Medium"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-medium text-[#172033]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Status Operasional</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white font-bold text-[#172033] cursor-pointer"
                  >
                    <option value="Aktif">Aktif Operasional</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
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
                <span className="text-xs text-[#087F5B] font-medium">Kapasitas Volume Ruang:</span>
                <span className="text-sm font-bold font-mono text-[#087F5B]">{computedVolumeM3.toFixed(2)} m³</span>
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
                  Simpan Kendaraan
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
              Apakah Anda yakin ingin menghapus armada <span className="font-bold text-[#172033]">{deleteTargetId}</span>?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 bg-[#F8FAFC] hover:bg-slate-200 text-[#172033] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#E7EBF0]"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteVehicle(deleteTargetId)}
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
