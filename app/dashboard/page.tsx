"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  CheckCircle2,
  Layers,
  BarChart3,
  ChevronRight,
  Clock,
  Hash,
  User as UserIcon,
  Zap
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

  const totalVolumeM3 = useMemo(() => {
    return dbCargos.reduce((sum, c) => sum + Number(c.volume_m3 || 0), 0);
  }, [dbCargos]);

  const totalTrucksCount = activeFleet.length;
  const totalCargosCount = dbCargos.length;

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">
      
      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 sm:p-9 space-y-7">
        <div className="max-w-[1320px] mx-auto space-y-7">
          
          {/* Header */}
          <div className="space-y-1 pb-4 border-b border-[#E7EBF0]">
            <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
              Dashboard
            </h1>
            <p className="text-[14px] text-[#667085]">
              Pantau kondisi armada, volume muatan, dan hasil optimasi dalam satu tampilan.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Truk Aktif</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#172033]">{totalTrucksCount} Unit</span>
              </div>
              <p className="text-[13px] text-[#667085]">Armada siap jalan</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Total Muatan</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#172033]">{totalCargosCount} Item</span>
              </div>
              <p className="text-[13px] text-[#667085]">Terdaftar di database</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Volume Muatan</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#087F5B]">{totalVolumeM3.toFixed(1)} m³</span>
              </div>
              <p className="text-[13px] text-[#667085]">Total kubikasi barang</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Efisiensi Ruang</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#087F5B]">94.2%</span>
              </div>
              <p className="text-[13px] text-[#667085]">Rata-rata okupansi 3D</p>
            </div>

          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Fleet Status Table (Left 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-[#E7EBF0] rounded-xl overflow-hidden">
              <div className="p-4 sm:px-5 border-b border-[#E7EBF0] flex items-center justify-between">
                <h2 className="font-semibold text-[15px] text-[#172033]">
                  Armada Operasional
                </h2>
                <Link href="/trucks" className="text-[13px] font-semibold text-[#087F5B] hover:text-[#066B4D] flex items-center gap-1">
                  <span>Lihat Semua</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E7EBF0] bg-[#F8FAFC] text-[#667085] font-semibold text-[12px]">
                      <th className="py-3 px-4 font-medium">ID Unit</th>
                      <th className="py-3 px-4 font-medium">Tipe / Driver</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Kapasitas</th>
                      <th className="py-3 px-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EBF0] text-[#172033]">
                    {activeFleet.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#667085] text-xs">
                          Belum ada data armada di database. Silakan tambah armada baru pada menu Data Kendaraan.
                        </td>
                      </tr>
                    ) : (
                      activeFleet.map((truck) => (
                        <tr key={truck.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                            {truck.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#172033]">{truck.type}</span>
                              <span className="text-[11px] text-[#667085]">{truck.driver} • {truck.plate}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                              <span className={`w-2 h-2 rounded-full ${
                                truck.status === "Siap" ? "bg-[#087F5B]" :
                                truck.status === "Memuat" ? "bg-blue-500" :
                                truck.status === "Keluar" ? "bg-[#B7791F]" : "bg-slate-400"
                              }`} />
                              <span className="text-[#172033]">{truck.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="font-semibold text-[#172033]">{truck.capacity}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href="/optimasi"
                              className="text-[12px] font-semibold text-[#087F5B] hover:underline"
                            >
                              Optimasi 3D →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Log (Right 1 col) */}
            <div className="bg-white border border-[#E7EBF0] rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 sm:px-5 border-b border-[#E7EBF0] flex items-center justify-between">
                <h2 className="font-semibold text-[15px] text-[#172033]">
                  Aktivitas Terbaru
                </h2>
                <span className="text-[11px] text-[#667085] font-mono">Realtime</span>
              </div>

              <div className="divide-y divide-[#E7EBF0] text-[13px] flex-1">
                {activityLogs.map((act, i) => (
                  <div key={i} className="p-4 hover:bg-[#F8FAFC] transition-colors space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#667085]">
                      <span>{act.time}</span>
                      <span className="font-medium text-[#087F5B]">{act.tag}</span>
                    </div>
                    <p className="text-[#172033] font-medium leading-snug">{act.desc}</p>
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
