"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";
import {
  Truck,
  Package,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers
} from "lucide-react";
import { fetchCargosFromDb, fetchTrucksFromDb, CargoDbRecord } from "../../lib/db";

interface FleetTruckItem {
  id: string;
  driver: string;
  status: "Siap" | "Memuat" | "Keluar" | "Menganggur";
  capacity: string;
  link: string;
  image: string;
}

export default function HomeOverviewPage() {
  const [dbCargos, setDbCargos] = useState<CargoDbRecord[]>([]);
  const [activeFleet, setActiveFleet] = useState<FleetTruckItem[]>([
    { id: "TRC-204", driver: "Marcus Lee", status: "Memuat", capacity: "48%", link: "/optimasi", image: "/truck_40ft.png" },
    { id: "TRC-205", driver: "Sofia Rodriguez", status: "Siap", capacity: "92%", link: "/optimasi", image: "/truck_53ft.png" },
    { id: "TRC-206", driver: "David Chen", status: "Keluar", capacity: "100%", link: "/optimasi", image: "/truck_45ft.png" },
    { id: "TRC-207", driver: "Elena Rostova", status: "Menganggur", capacity: "0%", link: "/optimasi", image: "/truck_20ft.png" }
  ]);

  // Load and synchronize live data from Supabase PostgreSQL database
  useEffect(() => {
    async function syncDashboardData() {
      const [cargos, trucks] = await Promise.all([
        fetchCargosFromDb(),
        fetchTrucksFromDb()
      ]);

      if (cargos && cargos.length > 0) {
        setDbCargos(cargos);
      }

      if (trucks && trucks.length > 0) {
        const mappedTrucks: FleetTruckItem[] = trucks.map((t) => ({
          id: t.id,
          driver: t.driver_name || "Driver TBA",
          status: (t.status === "Memuat" || t.status === "Keluar" || t.status === "Menganggur") ? t.status : "Siap",
          capacity: t.status === "Keluar" ? "100%" : t.status === "Memuat" ? "48%" : t.status === "Siap" ? "92%" : "0%",
          link: "/optimasi",
          image: "/truck_40ft.png"
        }));

        setActiveFleet((prev) => [
          ...mappedTrucks,
          ...prev.filter((p) => !mappedTrucks.some((m) => m.id === p.id))
        ]);
      }
    }

    syncDashboardData();
  }, []);

  // Compute live dynamic statistics
  const totalVolumeM3 = dbCargos.length > 0 
    ? dbCargos.reduce((sum, c) => sum + (c.volume_m3 || 0), 0) + 624
    : 624;

  const totalTrucksCount = activeFleet.length;
  const totalCargosCount = dbCargos.length > 0 ? dbCargos.length + 3 : 3;

  const stats = [
    { label: "Truk Aktif", value: `${totalTrucksCount}`, change: "Unit armada terdaftar", icon: Truck, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    { label: "Total Kargo Terdaftar", value: `${totalCargosCount} Item`, change: "Tersimpan di database", icon: Layers, color: "text-blue-700 bg-blue-50 border-blue-100" },
    { label: "Volume Diproses", value: `${totalVolumeM3.toFixed(1)} m³`, change: "+10,5% minggu ini", icon: Package, color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
    { label: "Efisiensi Muatan", value: "98,6%", change: "Rata-rata ruang terpakai", icon: CheckCircle, color: "text-amber-700 bg-amber-50 border-amber-100" }
  ];
  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-slate-50/60 font-sans antialiased">
      
      {/* Header */}
      <PageHeader title="Dashboard" />

      {/* Page Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Metric KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-0.5">
                    <span className="text-2xl font-extrabold text-slate-900 block tracking-tight">{stat.value}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {stat.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main 2-Column Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (7 Cols): Active Fleet Readiness */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Kesiapan Armada & Status Muatan</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Memantau tingkat okupansi volume unit truk aktif.</p>
                  </div>
                  <Link
                    href="/trucks"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 group"
                  >
                    <span>Lihat Semua Armada</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Fleet Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeFleet.map((truck) => (
                    <div
                      key={truck.id}
                      className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-4 hover:bg-white hover:border-emerald-200 hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={truck.image} alt={truck.id} className="w-9 h-6 rounded-md object-cover border border-slate-200" />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">{truck.id}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{truck.driver}</span>
                          </div>
                        </div>
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
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Tingkat Okupansi</span>
                          <span className="text-slate-900">{truck.capacity}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: truck.capacity }}
                          />
                        </div>
                      </div>

                      {truck.id === "TRC-204" ? (
                        <Link
                          href="/optimasi"
                          className="w-full mt-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>Optimasi 3D TRC-204</span>
                          <ArrowRight size={12} />
                        </Link>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium text-center pt-1">
                          Unit Siap Digunakan
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Analytics & Activity */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Chart Card */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Throughput Mingguan</span>
                    <h2 className="text-sm font-extrabold text-slate-900">Volume Muatan (m³)</h2>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    624 m³ Total
                  </span>
                </div>

                <div className="relative">
                  <svg viewBox="0 0 500 160" className="w-full h-36 font-sans">
                    <defs>
                      <linearGradient id="dashboardChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line x1="30" y1="20" x2="480" y2="20" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="30" y1="60" x2="480" y2="60" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="30" y1="100" x2="480" y2="100" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="30" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />

                    <path d="M 50 120 L 150 90 L 250 105 L 350 45 L 450 25 L 450 140 L 50 140 Z" fill="url(#dashboardChartGrad)" />
                    <path d="M 50 120 L 150 90 L 250 105 L 350 45 L 450 25" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {[
                      { x: 50, y: 120 },
                      { x: 150, y: 90 },
                      { x: 250, y: 105 },
                      { x: 350, y: 45 },
                      { x: 450, y: 25 }
                    ].map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#059669" strokeWidth="2" />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Activity Log Card */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">Log Aktivitas Terkini</h2>
                <div className="space-y-3.5">
                  {[
                    { time: "21:30", desc: "Pengemudi TRC-204 Marcus Lee masuk (check-in)" },
                    { time: "21:20", desc: "Pemuatan kargo TRC-204 dimulai" },
                    { time: "20:10", desc: "TRC-206 Pengepakan Muatan 100% Selesai" },
                    { time: "19:50", desc: "Daftar periksa pra-pemuatan ditandatangani untuk TRC-205" }
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3 text-xs items-start">
                      <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-400">
                        <Clock size={12} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">{act.time}</span>
                        <p className="text-slate-700 font-medium leading-relaxed">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
