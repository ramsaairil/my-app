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
  const [trucks, setTrucks] = useState<TruckItem[]>([]);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [customId, setCustomId] = useState("");
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
      driver: "Driver TBA",
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
      driver_name: "Driver TBA",
      max_volume_m3: 67.70,
      status: customStatus,
      current_dock: "Dok #1"
    });

    setTrucks((prev) => [newTruck, ...prev]);
    setCustomId("");
    setCustomCounter((c) => c + 1);
    setIsAddFormOpen(false);
    showToast(`Armada ${idToUse} berhasil tersimpan ke database!`, "success");
  };

  const handleDeleteTruck = async (id: string) => {
    await deleteTruckFromDb(id);
    setTrucks((prev) => prev.filter((t) => t.id !== id));
    showToast(`Armada ${id} berhasil dihapus dari database!`, "success");
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-slate-50/50">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader title="Operasi & Manajemen Armada Truk">
        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Tambah Armada</span>
        </button>
      </PageHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-5">
          
          {/* Custom Add Truck Form */}
          {isAddFormOpen && (
            <form onSubmit={handleSaveTruck} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Plus size={15} className="text-emerald-700" />
                  Tambah Unit Armada Baru
                </h3>
                <button type="button" onClick={() => setIsAddFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Armada (Opsional)</label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={`TRC-${customCounter}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Kontainer</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 cursor-pointer"
                  >
                    <option value="Kontainer Standard 40ft (67,7 m³)">Kontainer Standard 40ft (67,7 m³)</option>
                    <option value="Trailer Dry Van 53ft (110 m³)">Trailer Dry Van 53ft (110 m³)</option>
                    <option value="Kontainer High Cube 45ft (86 m³)">Kontainer High Cube 45ft (86 m³)</option>
                    <option value="Kontainer Standard 20ft (33,2 m³)">Kontainer Standard 20ft (33,2 m³)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Awal</label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 cursor-pointer"
                  >
                    <option value="Siap">Siap</option>
                    <option value="Memuat">Memuat</option>
                    <option value="Keluar">Keluar</option>
                    <option value="Menganggur">Menganggur</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-xs"
                >
                  Simpan Armada
                </button>
              </div>
            </form>
          )}

          {/* Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daftar Status Armada</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Monitoring status real-time pemuatan kargo dan alokasi unit truk.</p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {trucks.length} Unit
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Unit Truk</th>
                    <th className="py-3 px-3">Tipe Kontainer</th>
                    <th className="py-3 px-3">Okupansi</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {trucks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <Truck className="mx-auto mb-2 text-slate-300" size={32} />
                        <p className="font-bold text-xs text-slate-600">Belum ada armada truk terdaftar</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol &ldquo;Tambah Armada&rdquo; di atas untuk mendaftarkan armada baru.</p>
                      </td>
                    </tr>
                  ) : (
                    trucks.map((truck) => (
                      <tr key={truck.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img src={truck.image} alt={truck.id} className="w-8 h-5 rounded object-cover border border-slate-200 flex-shrink-0" />
                            <span className="font-extrabold text-xs text-slate-900">{truck.id}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-medium">{truck.containerType}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{truck.capacity}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            truck.status === "Siap"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : truck.status === "Memuat"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : truck.status === "Keluar"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {truck.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href="/optimasi"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-md text-[11px] font-bold transition-colors"
                            >
                              <span>Optimasi 3D</span>
                              <ArrowRight size={11} />
                            </Link>
                            <button
                              onClick={() => handleDeleteTruck(truck.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title={`Hapus Armada ${truck.id}`}
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
    </div>
  );
}
