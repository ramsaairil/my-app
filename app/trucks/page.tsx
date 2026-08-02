"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";
import { Truck, ArrowRight, Plus, Trash2, X, CheckCircle2 } from "lucide-react";
import { fetchTrucksFromDb, insertTruckToDb, deleteTruckFromDb } from "../../lib/db";

interface TruckItem {
  id: string;
  driver: string;
  containerType: string;
  capacity: string;
  status: "Siap" | "Memuat" | "Keluar" | "Menganggur";
  image: string;
}

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<TruckItem[]>([
    { id: "TRC-204", status: "Memuat", driver: "Marcus Lee", containerType: "Kontainer Standard 40ft (67,7 m³)", capacity: "48%", image: "/truck_40ft.png" },
    { id: "TRC-205", status: "Siap", driver: "Sofia Rodriguez", containerType: "Trailer Dry Van 53ft (110 m³)", capacity: "92%", image: "/truck_53ft.png" },
    { id: "TRC-206", status: "Keluar", driver: "David Chen", containerType: "Kontainer High Cube 45ft (86 m³)", capacity: "100%", image: "/truck_45ft.png" },
    { id: "TRC-207", status: "Menganggur", driver: "Elena Rostova", containerType: "Kontainer Standard 20ft (33,2 m³)", capacity: "0%", image: "/truck_20ft.png" }
  ]);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [customId, setCustomId] = useState("");
  const [customDriver, setCustomDriver] = useState("Ahmad Rizal");
  const [customType, setCustomType] = useState("Kontainer Standard 40ft (67,7 m³)");
  const [customStatus, setCustomStatus] = useState<"Siap" | "Memuat" | "Keluar" | "Menganggur">("Siap");
  const [customCounter, setCustomCounter] = useState(208);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Sync trucks from Supabase PostgreSQL database
  useEffect(() => {
    async function syncDb() {
      const dbTrucks = await fetchTrucksFromDb();
      if (dbTrucks && dbTrucks.length > 0) {
        const mappedFromDb: TruckItem[] = dbTrucks.map((t) => ({
          id: t.id,
          driver: t.driver_name || "Driver TBA",
          containerType: `${t.truck_type || "Kontainer Standard 40ft"} (${t.max_volume_m3 || 67.7} m³)`,
          capacity: "0%",
          status: (t.status === "Memuat" || t.status === "Keluar" || t.status === "Menganggur") ? t.status : "Siap",
          image: "/truck_40ft.png"
        }));

        setTrucks((prev) => [
          ...mappedFromDb,
          ...prev.filter((p) => !mappedFromDb.some((m) => m.id === p.id))
        ]);
      }
    }
    syncDb();
  }, []);

  const handleSaveTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToUse = customId.trim() || `TRC-${customCounter}`;

    const exists = trucks.some((t) => t.id.toLowerCase() === idToUse.toLowerCase());
    if (exists) {
      showToast(`ID Unit Armada ${idToUse} sudah digunakan!`, "error");
      return;
    }

    const newTruck: TruckItem = {
      id: idToUse,
      driver: customDriver,
      containerType: customType,
      capacity: "0%",
      status: customStatus,
      image: "/truck_40ft.png"
    };

    // Insert record into Supabase PostgreSQL
    await insertTruckToDb({
      id: idToUse,
      truck_name: `Armada ${idToUse}`,
      plate_number: `B ${Math.floor(1000 + Math.random() * 9000)} LOG`,
      truck_type: customType,
      driver_name: customDriver,
      max_volume_m3: 67.70,
      status: customStatus,
      current_dock: "Dok #1"
    });

    setTrucks((prev) => [newTruck, ...prev]);
    setCustomId("");
    setCustomCounter((c) => c + 1);
    setIsAddFormOpen(false);
    showToast(`Armada ${idToUse} berhasil tersimpan ke database Supabase!`, "success");
  };

  const handleDeleteTruck = async (id: string) => {
    await deleteTruckFromDb(id);
    setTrucks((prev) => prev.filter((t) => t.id !== id));
    showToast(`Armada ${id} berhasil dihapus dari database!`, "success");
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
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Operasi & Manajemen Armada Truk"
      >
        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus size={14} />
          <span>Tambah Armada</span>
        </button>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Daftar Status Armada</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Monitoring status real-time pemuatan kargo dan alokasi unit truk.</p>
              </div>
            </div>

            {/* Custom Add Truck Form */}
            {isAddFormOpen && (
              <form onSubmit={handleSaveTruck} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <Plus size={16} className="text-emerald-700" />
                    Tambah Unit Armada Truk Baru
                  </h3>
                  <button type="button" onClick={() => setIsAddFormOpen(false)} className="text-slate-400 hover:text-slate-650 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">ID Armada (Opsional)</label>
                    <input
                      type="text"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      placeholder={`TRC-${customCounter}`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tipe Kontainer</label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 cursor-pointer"
                    >
                      <option value="Kontainer Standard 40ft (67,7 m³)">Kontainer Standard 40ft (67,7 m³)</option>
                      <option value="Trailer Dry Van 53ft (110 m³)">Trailer Dry Van 53ft (110 m³)</option>
                      <option value="Kontainer High Cube 45ft (86 m³)">Kontainer High Cube 45ft (86 m³)</option>
                      <option value="Kontainer Standard 20ft (33,2 m³)">Kontainer Standard 20ft (33,2 m³)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Status Awal</label>
                    <select
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-800 cursor-pointer"
                    >
                      <option value="Siap">Siap</option>
                      <option value="Memuat">Memuat</option>
                      <option value="Keluar">Keluar</option>
                      <option value="Menganggur">Menganggur</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-center"
                    >
                      Simpan Unit Armada ke Supabase
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Table View */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3.5 px-4">Unit Truk</th>
                    <th className="py-3.5 px-4">Tipe Kontainer</th>
                    <th className="py-3.5 px-4">Okupansi</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Operasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {trucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img src={truck.image} alt={truck.id} className="w-10 h-7 rounded object-cover border border-slate-200 flex-shrink-0" />
                          <span className="font-extrabold text-sm text-slate-900">{truck.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">{truck.containerType}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">{truck.capacity}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          truck.status === "Siap"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : truck.status === "Memuat"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : truck.status === "Keluar"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {truck.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {truck.id === "TRC-204" ? (
                            <Link
                              href="/optimasi"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                            >
                              <span>Kelola Kargo 3D</span>
                              <ArrowRight size={12} />
                            </Link>
                          ) : (
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                              <span>Detail</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTruck(truck.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={`Hapus Armada ${truck.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
