"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Search,
  ArrowRight,
  Sliders,
  Maximize2,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Vehicle, VehicleType } from "../../lib/types";
import {
  VEHICLE_PRESETS,
  getStoredVehicles,
  saveStoredVehicles,
  calculateVolumeM3
} from "../../lib/storage";

export default function FleetOperationsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Aktif" | "Nonaktif">("Semua");

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
  const [formNotes, setFormNotes] = useState("");

  // Confirmation Delete Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Auto-calculated volume
  const computedVolumeM3 = useMemo(() => {
    return calculateVolumeM3(formLength, formWidth, formHeight);
  }, [formLength, formWidth, formHeight]);

  useEffect(() => {
    const loaded = getStoredVehicles();
    setVehicles(loaded);
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
      if (!editingId) {
        setFormNotes(preset.description);
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
    setFormNotes("Kapasitas muatan standar angkutan kota");
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
    setFormNotes(v.notes || "");
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
      const updated = vehicles.map((v) => {
        if (v.id === editingId) {
          return {
            ...v,
            name: formName.trim(),
            type: formType,
            lengthCm: Number(formLength),
            widthCm: Number(formWidth),
            heightCm: Number(formHeight),
            volumeM3: computedVolumeM3,
            status: formStatus,
            notes: formNotes.trim()
          };
        }
        return v;
      });
      setVehicles(updated);
      saveStoredVehicles(updated);
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
        status: formStatus,
        notes: formNotes.trim()
      };
      const updated = [newVehicle, ...vehicles];
      setVehicles(updated);
      saveStoredVehicles(updated);
      showToast(`Kendaraan baru ${formName} berhasil ditambahkan!`, "success");
    }

    setIsModalOpen(false);
  };

  const handleDeleteVehicle = (id: string) => {
    const updated = vehicles.filter((v) => v.id !== id);
    setVehicles(updated);
    saveStoredVehicles(updated);
    setDeleteTargetId(null);
    showToast("Kendaraan berhasil dihapus!", "success");
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "Semua" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const activeCount = useMemo(() => vehicles.filter((v) => v.status === "Aktif").length, [vehicles]);

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
      <PageHeader title="Operasional Armada">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
          <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Tambah Kendaraan</span>
        </button>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Armada */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Unit Armada</p>
                <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{vehicles.length} <span className="text-sm font-bold text-slate-500">Unit</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                <Truck size={22} />
              </div>
            </div>

            {/* Status Aktif */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group border-emerald-200/60">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Armada Siap Operasional</p>
                <p className="text-3xl font-black text-emerald-700 mt-1 tracking-tight">{activeCount} <span className="text-sm font-bold text-emerald-800">Unit</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-inner group-hover:scale-110 transition-transform">
                <ShieldCheck size={22} />
              </div>
            </div>

            {/* Total Volume */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-between group border-indigo-200/60">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800">Total Volume Ruang Muat</p>
                <p className="text-3xl font-black text-indigo-900 mt-1 tracking-tight">
                  {vehicles.reduce((acc, v) => acc + (v.status === "Aktif" ? v.volumeM3 : 0), 0).toFixed(1)} <span className="text-sm font-bold text-indigo-700">m³</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-inner group-hover:scale-110 transition-transform">
                <Maximize2 size={22} />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            {/* Table Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={16} className="text-emerald-700" />
                  Master Data Armada Kendaraan
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Kelola spesifikasi ruang muatan armada untuk simulasi 3D Bin Packing secara otomatis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[240px]">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari armada atau jenis..."
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

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 cursor-pointer shadow-2xs"
                >
                  <option value="Semua">Semua Status Armada</option>
                  <option value="Aktif">Aktif Saja</option>
                  <option value="Nonaktif">Nonaktif Saja</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider bg-slate-50/80 text-[10px]">
                    <th className="py-3.5 px-4">Nama Kendaraan</th>
                    <th className="py-3.5 px-4">Jenis Kendaraan</th>
                    <th className="py-3.5 px-4">Dimensi Ruang (P x L x T)</th>
                    <th className="py-3.5 px-4">Volume Ruang</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400">
                        <Truck className="mx-auto mb-2 text-slate-300" size={36} />
                        <p className="font-bold text-xs text-slate-700">Tidak ada armada ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik &quot;Tambah Kendaraan&quot; untuk mendaftarkan armada baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-105 transition-transform">
                              <Truck size={16} />
                            </div>
                            <div>
                              <span className="text-slate-900 font-black">{v.name}</span>
                              {v.notes && (
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                                  {v.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-extrabold text-slate-700 shadow-2xs">
                            {v.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {v.lengthCm} x {v.widthCm} x {v.heightCm} cm
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                          {v.volumeM3.toFixed(2)} m³
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                              v.status === "Aktif"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href="/optimasi"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 border border-emerald-300/80 rounded-lg text-[11px] font-black transition-all shadow-2xs"
                              title="Simulasi 3D Kendaraan Ini"
                            >
                              <span>Optimasi 3D</span>
                              <ArrowRight size={12} />
                            </Link>

                            <button
                              onClick={() => handleOpenEditModal(v)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Kendaraan"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => setDeleteTargetId(v.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kendaraan"
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

      {/* Modal Add / Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 z-10 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Truck size={18} className="text-emerald-700" />
                {editingId ? "Edit Master Data Kendaraan" : "Tambah Armada Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-5 text-xs">
              {/* Preset Selector */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                    Preset Standar Kendaraan Indonesia
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">Klik untuk isi otomatis</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {VEHICLE_PRESETS.map((preset) => (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => handleApplyPreset(preset.type)}
                      className={`px-2.5 py-2 rounded-xl border text-left transition-all text-[10px] cursor-pointer ${
                        formType === preset.type
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <p className="truncate font-extrabold">{preset.type}</p>
                      <p className={`text-[9px] ${formType === preset.type ? "text-emerald-100" : "text-slate-400"} font-mono mt-0.5`}>
                        {preset.lengthCm}x{preset.widthCm}x{preset.heightCm} cm
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Nama Kendaraan
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: CDD Box Express #1"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Jenis Kendaraan
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-bold bg-white cursor-pointer"
                  >
                    {VEHICLE_PRESETS.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.type}
                      </option>
                    ))}
                    <option value="Kustom">Kustom / Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Dimensions Input */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">
                    Dimensi Ruang Muatan (cm)
                  </span>
                  <span className="text-[11px] font-black text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                    Volume Otomatis: {computedVolumeM3} m³
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
                      placeholder="235"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={10}
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
                      placeholder="155"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={10}
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
                      placeholder="130"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-black font-mono text-center"
                      required
                      min={10}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-bold bg-white cursor-pointer"
                  >
                    <option value="Aktif">Aktif (Tersedia untuk Optimasi)</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Rute Jabodetabek"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-slate-900 font-medium"
                  />
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
                  {editingId ? "Simpan Perubahan" : "Tambah Kendaraan"}
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
                <h3 className="text-sm font-black text-slate-900">Hapus Kendaraan Ini?</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Data kendaraan akan dihapus secara permanen dari master operasional armada.
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
                onClick={() => handleDeleteVehicle(deleteTargetId)}
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
