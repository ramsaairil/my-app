"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  CheckCircle,
  Layers,
  Zap,
  BarChart3,
  ChevronRight,
  Clock,
  Hash,
  User as UserIcon
} from "lucide-react";
import { fetchCargosFromDb, fetchTrucksFromDb, CargoDbRecord } from "../../lib/db";
import { getStoredCargos, getStoredVehicles } from "../../lib/storage";

interface FleetTruckItem {
  id: string;
  driver: string;
  status: "Siap" | "Memuat" | "Keluar" | "Menganggur";
  capacity: string;
  link: string;
  type?: string;
  plate?: string;
}

const activityLogs = [
  { time: "10:45", desc: "Optimasi 3D selesai untuk Truk TRC-205 (Okupansi 94.2%)", tag: "3D Pack" },
  { time: "09:30", desc: "Data kargo baru Kardus Elektronik A (20 unit) tersimpan", tag: "PostgreSQL" },
  { time: "08:15", desc: "Armada Gran Max Pick Up (TRC-204) siap operasional", tag: "Fleet" },
  { time: "07:00", desc: "Sinkronisasi Supabase DB berhasil dihubungkan", tag: "System" },
];

export default function HomeOverviewPage() {
  const [dbCargos, setDbCargos] = useState<CargoDbRecord[]>([]);
  const [activeFleet, setActiveFleet] = useState<FleetTruckItem[]>([]);

  // Load and synchronize live data from Supabase PostgreSQL database & LocalStorage
  useEffect(() => {
    async function syncDashboardData() {
      const [cargos, trucks] = await Promise.all([
        fetchCargosFromDb(),
        fetchTrucksFromDb()
      ]);

      if (cargos && cargos.length > 0) {
        setDbCargos(cargos);
      } else {
        const localCargos = getStoredCargos();
        const mappedCargos: CargoDbRecord[] = localCargos.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.code,
          dimension: `${c.lengthCm}x${c.widthCm}x${c.heightCm} cm`,
          volume_m3: c.volumeM3
        }));
        setDbCargos(mappedCargos);
      }

      if (trucks && trucks.length > 0) {
        const mappedTrucks: FleetTruckItem[] = trucks.map((t) => ({
          id: t.id,
          driver: "Driver Logistik",
          status: (t.status === "Memuat" || t.status === "Keluar" || t.status === "Menganggur") ? t.status : "Siap",
          capacity: t.status === "Keluar" ? "100%" : t.status === "Memuat" ? "48%" : t.status === "Siap" ? "92%" : "0%",
          link: "/optimasi",
          type: t.truck_name || "Box Truck 3D",
          plate: `B 9${t.id.slice(-3)} UXR`
        }));
        setActiveFleet(mappedTrucks);
      } else {
        const localVehicles = getStoredVehicles();
        const mappedVehicles: FleetTruckItem[] = localVehicles.map((v) => ({
          id: v.id,
          driver: "Driver Logistics",
          status: v.status === "Aktif" ? "Siap" : "Menganggur",
          capacity: v.status === "Aktif" ? "85%" : "0%",
          link: "/optimasi",
          type: v.type,
          plate: `B ${v.id.replace("TRK-", "9")} UXR`
        }));
        setActiveFleet(mappedVehicles);
      }
    }

    syncDashboardData();
  }, []);

  // Compute live dynamic statistics strictly from actual database records
  const totalVolumeM3 = useMemo(() => {
    return dbCargos.reduce((sum, c) => sum + Number(c.volume_m3 || 0), 0);
  }, [dbCargos]);

  const totalTrucksCount = activeFleet.length;
  const totalCargosCount = dbCargos.length;

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#fafafa] text-slate-800 font-sans antialiased">
      
      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
        <div className="max-w-[1300px] mx-auto space-y-6">
          
          {/* ---------------------------------------------------- */}
          {/* NOTION PAGE HEADER */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-3 pb-2 border-b border-slate-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard Overview
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pusat pemantauan status armada, volume kargo terdaftar, dan statistik operasional.
                </p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* NOTION QUICK STAT CARDS (EXECUTIVE SUMMARY VIEW) */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 hover:border-[#2383e2]/40 transition-all shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="uppercase tracking-wider text-[10px]">Truk Aktif</span>
                <Truck size={15} className="text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{totalTrucksCount} Unit</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Unit armada terdaftar</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 hover:border-[#2383e2]/40 transition-all shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="uppercase tracking-wider text-[10px]">Total Kargo</span>
                <Layers size={15} className="text-blue-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{totalCargosCount} Item</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  PostgreSQL
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Tersimpan di database</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 hover:border-[#2383e2]/40 transition-all shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="uppercase tracking-wider text-[10px]">Volume Diproses</span>
                <Package size={15} className="text-indigo-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#2383e2] tracking-tight">{totalVolumeM3.toFixed(1)} m³</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  +10.5%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Total volume kubikasi minggu ini</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 hover:border-[#2383e2]/40 transition-all shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="uppercase tracking-wider text-[10px]">Efisiensi Muatan</span>
                <CheckCircle size={15} className="text-amber-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700 tracking-tight">98.6%</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  Optimized
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Rata-rata okupansi ruang muat</p>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* FLEET STATUS TABLE & ACTIVITY LOG */}
          {/* ---------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Fleet Status Table (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#2383e2]" />
                  <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Status Armada Operasional
                  </h2>
                </div>
                <Link href="/trucks" className="text-xs font-bold text-[#2383e2] hover:underline flex items-center gap-1">
                  <span>Kelola Armada</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold text-[11px] select-none">
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-28">
                        <div className="flex items-center gap-1.5">
                          <Hash size={13} className="text-slate-400" />
                          <span>ID Unit</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <UserIcon size={13} className="text-slate-400" />
                          <span>Driver / Plat</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-28">
                        <div className="flex items-center gap-1.5">
                          <Zap size={13} className="text-slate-400" />
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-36">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 size={13} className="text-slate-400" />
                          <span>Okupansi</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 font-medium text-right w-24">
                        <span>Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                    {activeFleet.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                          Belum ada data armada di database. Silakan tambah armada baru pada menu Operasional Armada.
                        </td>
                      </tr>
                    ) : (
                      activeFleet.map((truck) => (
                        <tr key={truck.id} className="hover:bg-[#f7f7f5] transition-colors group">
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-slate-900">
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              {truck.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-medium text-slate-800">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{truck.driver}</span>
                              <span className="text-[10px] font-mono text-slate-400">{truck.plate}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${
                              truck.status === "Siap" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              truck.status === "Memuat" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              truck.status === "Keluar" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                truck.status === "Siap" ? "bg-emerald-500" :
                                truck.status === "Memuat" ? "bg-blue-500" :
                                truck.status === "Keluar" ? "bg-amber-500" : "bg-slate-400"
                              }`} />
                              <span>{truck.status}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-500 font-medium">Terpakai</span>
                                <span className="font-bold text-slate-800">{truck.capacity}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    parseInt(truck.capacity) > 80 ? "bg-emerald-500" :
                                    parseInt(truck.capacity) > 30 ? "bg-[#2383e2]" : "bg-amber-500"
                                  }`}
                                  style={{ width: truck.capacity }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Link
                              href="/optimasi"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-[#2383e2] hover:text-white text-slate-700 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>3D</span>
                              <ChevronRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Stream (Right 1 col) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#2383e2]" />
                  <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Log Aktivitas Live
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Realtime
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs flex-1">
                {activityLogs.map((act, i) => (
                  <div key={i} className="p-3.5 hover:bg-[#f7f7f5] transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-[9px] font-bold flex-shrink-0">
                        {act.time}
                      </span>
                      <span className="font-medium text-slate-700 leading-tight">{act.desc}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                      {act.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

