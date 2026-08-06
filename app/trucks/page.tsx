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
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid,
  BarChart3,
  ArrowUpDown,
  Hash,
  Type,
  Maximize,
  Tag,
  Zap,
  FileText,
  Check,
  ChevronRight,
  ExternalLink
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
  const [statusFilter, setStatusFilter] = useState<"Semua" | "Aktif" | "Nonaktif">("Semua");
  const [activeView, setActiveView] = useState<"table" | "gallery" | "summary">("table");
  const [sortBy, setSortBy] = useState<"id" | "name" | "volume" | "status">("id");

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
    async function loadData() {
      const dbTrucks = await fetchTrucksFromDb();
      if (dbTrucks && dbTrucks.length > 0) {
        const mapped: Vehicle[] = dbTrucks.map((t) => ({
          id: t.id,
          name: t.truck_name || t.id,
          type: t.truck_type || "Gran Max Pick Up",
          lengthCm: 300,
          widthCm: 180,
          heightCm: 180,
          volumeM3: Number(t.max_volume_m3 || 9.72),
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
            status: formStatus,
            notes: formNotes.trim()
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
        status: formStatus,
        notes: formNotes.trim()
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

  // Filtered & Sorted Vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "Semua" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return result.sort((a, b) => {
      let valA: string | number = a.id;
      let valB: string | number = b.id;

      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "volume") {
        valA = a.volumeM3;
        valB = b.volumeM3;
      } else if (sortBy === "status") {
        valA = a.status;
        valB = b.status;
      }

      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });
  }, [vehicles, searchQuery, statusFilter, sortBy]);

  const activeCount = useMemo(() => vehicles.filter((v) => v.status === "Aktif").length, [vehicles]);

  const totalVolumeActiveSum = useMemo(() => {
    return filteredVehicles.reduce((acc, v) => acc + (v.status === "Aktif" ? v.volumeM3 : 0), 0);
  }, [filteredVehicles]);

  const avgVolumeM3 = useMemo(() => {
    return filteredVehicles.length > 0
      ? filteredVehicles.reduce((acc, v) => acc + v.volumeM3, 0) / filteredVehicles.length
      : 0;
  }, [filteredVehicles]);

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
                  Operasional Armada
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Database unit kendaraan armada, kapasitas volume kubikasi, dan status kesiapan operasional.
                </p>
              </div>

              {/* Notion Signature Blue + New Button */}
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d70c4] text-white text-xs font-bold rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={15} />
                <span>New Vehicle</span>
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

            {/* Right: Search, Status Filter & Sort Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              {/* Notion Search Input */}
              <div className="relative flex-1 sm:w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter or search armada..."
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

              {/* Status Filter Pill Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#2383e2] cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif Operasional</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>

              {/* Sort Order Button */}
              <button
                onClick={() => {
                  if (sortBy === "id") setSortBy("name");
                  else if (sortBy === "name") setSortBy("volume");
                  else if (sortBy === "volume") setSortBy("status");
                  else setSortBy("id");
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
                      
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-32">
                        <div className="flex items-center gap-1.5">
                          <Hash size={13} className="text-slate-400" />
                          <span>ID Unit</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <Type size={13} className="text-slate-400" />
                          <span>Nama Kendaraan</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-44">
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-slate-400" />
                          <span>Tipe / Model</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-44">
                        <div className="flex items-center gap-1.5">
                          <Maximize size={13} className="text-slate-400" />
                          <span>Dimensi Ruang (P×L×T)</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-36">
                        <div className="flex items-center gap-1.5">
                          <Truck size={13} className="text-slate-400" />
                          <span>Kapasitas (m³)</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-32">
                        <div className="flex items-center gap-1.5">
                          <Zap size={13} className="text-slate-400" />
                          <span>Status</span>
                        </div>
                      </th>

                      <th className="py-2.5 px-4 font-medium text-right w-24">
                        <span>Aksi</span>
                      </th>

                    </tr>
                  </thead>

                  {/* Notion Table Rows */}
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Truck className="mx-auto mb-2 text-slate-300" size={32} />
                          <p className="font-bold text-xs text-slate-600">No fleet vehicles found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting search or status filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-[#f7f7f5] transition-colors group">
                          
                          {/* ID Property */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-slate-900">
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              {vehicle.id}
                            </span>
                          </td>

                          {/* Vehicle Name */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-bold text-slate-900">
                            {vehicle.name}
                          </td>

                          {/* Type Select Tag */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <Truck size={11} className="text-slate-400" />
                              <span>{vehicle.type}</span>
                            </span>
                          </td>

                          {/* Dimensions */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono text-slate-600">
                            {vehicle.lengthCm} × {vehicle.widthCm} × {vehicle.heightCm} <span className="text-[10px] text-slate-400">cm</span>
                          </td>

                          {/* Volume Capacity */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-emerald-800">
                            {vehicle.volumeM3.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">m³</span>
                          </td>

                          {/* Notion Status Tag Badge */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${
                              vehicle.status === "Aktif"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${vehicle.status === "Aktif" ? "bg-emerald-500" : "bg-slate-400"}`} />
                              <span>{vehicle.status}</span>
                            </span>
                          </td>



                          {/* Actions */}
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(vehicle)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(vehicle.id)}
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
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all space-y-3 relative group"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {vehicle.id}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      vehicle.status === "Aktif"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {vehicle.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{vehicle.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{vehicle.type}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Ruang Muatan</span>
                      <span className="font-bold text-slate-700">{vehicle.lengthCm}×{vehicle.widthCm}×{vehicle.heightCm} cm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kapasitas Volume</span>
                      <span className="font-bold text-emerald-700">{vehicle.volumeM3.toFixed(2)} m³</span>
                    </div>
                  </div>



                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <Link
                      href="/optimasi"
                      className="text-xs font-bold text-[#2383e2] hover:underline flex items-center gap-1"
                    >
                      <span>Simulasi 3D</span>
                      <ChevronRight size={12} />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(vehicle)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(vehicle.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Unit Armada</span>
                <span className="text-3xl font-black text-slate-900 block">{filteredVehicles.length} Unit</span>
                <p className="text-xs text-slate-500">Terdaftar di master data armada</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Armada Siap Operasional</span>
                <span className="text-3xl font-black text-emerald-700 block">{activeCount} Unit</span>
                <p className="text-xs text-slate-500">Status Aktif Siap Angkut</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Kapasitas Volume</span>
                <span className="text-3xl font-black text-indigo-700 block">{totalVolumeActiveSum.toFixed(1)} m³</span>
                <p className="text-xs text-slate-500">Total ruang muat armada aktif</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT VEHICLE */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-10 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? "Edit Kendaraan Armada" : "Tambah Kendaraan Armada Baru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur spesifikasi ruang muatan dan pilih preset standar jika tersedia.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Presets Picker */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Gunakan Preset Standar:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VEHICLE_PRESETS.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => handleApplyPreset(p.type)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-[#2383e2] hover:text-white text-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kendaraan / Plat</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Gran Max Pick Up #1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kendaraan</label>
                  <input
                    type="text"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    placeholder="Contoh: Box Medium"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2383e2] focus:bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Aktif">Aktif Operasional</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
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
                <span className="text-xs text-emerald-800 font-medium">Kapasitas Volume Ruang:</span>
                <span className="text-sm font-bold font-mono text-emerald-700">{computedVolumeM3.toFixed(2)} m³</span>
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
                  Simpan Armada
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
              Apakah Anda yakin ingin menghapus armada <span className="font-bold text-slate-900">{deleteTargetId}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
