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
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <PageHeader
        title="Ringkasan Operasi"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Ringkasan" }
        ]}
      />

      {/* Page Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                    <Icon size={18} className="text-slate-400" />
                  </div>
                  <div className="mt-4 space-y-0.5">
                    <span className="text-2xl font-bold text-slate-800 block">{stat.value}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 block">{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Volume Throughput */}
            <div className="bg-white border border-slate-100 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Throughput Mingguan</span>
                  <h2 className="text-xs font-bold text-slate-800">Volume Muatan Kargo</h2>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">Rata-rata: 410 m³</span>
              </div>
              <div className="relative">
                <svg viewBox="0 0 500 200" className="w-full h-44 font-sans">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="470" y2="30" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="75" x2="470" y2="75" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="120" x2="470" y2="120" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="165" x2="470" y2="165" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="15" y="34" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">600m³</text>
                  <text x="15" y="79" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">400m³</text>
                  <text x="15" y="124" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">200m³</text>
                  <text x="15" y="169" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">0m³</text>

                  {/* Clean thin line path without heavy fill */}
                  <path d="M 60 140 L 160 110 L 260 125 L 360 65 L 460 40" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Mini data points shown on hover */}
                  {[
                    { x: 60, y: 140, val: "200 m³" },
                    { x: 160, y: 110, val: "325 m³" },
                    { x: 260, y: 125, val: "275 m³" },
                    { x: 360, y: 65, val: "500 m³" },
                    { x: 460, y: 40, val: "600 m³" }
                  ].map((pt, idx) => (
                    <g key={idx} className="group/dot cursor-pointer" id={`throughput-dot-${idx}`}>
                      <circle cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#059669" strokeWidth="2" className="transition-all duration-200 group-hover/dot:r-5 group-hover/dot:stroke-emerald-700" />
                      <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />
                      <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect x={pt.x - 20} y={pt.y - 28} width="40" height="16" rx="3" fill="#0f172a" />
                        <text x={pt.x} y={pt.y - 17} fill="#ffffff" className="text-[8px] font-bold font-mono text-center" textAnchor="middle">{pt.val}</text>
                      </g>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  <text x="60" y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">Senin</text>
                  <text x="160" y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">Selasa</text>
                  <text x="260" y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">Rabu</text>
                  <text x="360" y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">Kamis</text>
                  <text x="460" y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">Jumat</text>
                </svg>
              </div>
            </div>

            {/* Chart 2: Occupancy Rate */}
            <div className="bg-white border border-slate-100 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Utilisasi Bulanan</span>
                  <h2 className="text-xs font-bold text-slate-800">Tingkat Okupansi Armada</h2>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">Rerata: 81%</span>
              </div>
              <div className="relative">
                <svg viewBox="0 0 500 200" className="w-full h-44 font-sans">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="470" y2="30" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="75" x2="470" y2="75" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="120" x2="470" y2="120" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="165" x2="470" y2="165" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="15" y="34" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">100%</text>
                  <text x="15" y="79" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">60%</text>
                  <text x="15" y="124" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">30%</text>
                  <text x="15" y="169" className="text-[9px] font-medium fill-slate-400 font-mono text-right" textAnchor="end">0%</text>

                  {/* Elegant thinner bars with slate base and emerald hover */}
                  {[
                    { month: "Jan", pct: 65, y: 72, h: 93 },
                    { month: "Feb", pct: 80, y: 50, h: 115 },
                    { month: "Mar", pct: 70, y: 65, h: 100 },
                    { month: "Apr", pct: 95, y: 27, h: 138 },
                    { month: "Mei", pct: 85, y: 42, h: 123 },
                    { month: "Jun", pct: 90, y: 35, h: 130 }
                  ].map((bar, idx) => {
                    const barWidth = 16;
                    const xCoord = 75 + idx * 65;
                    return (
                      <g key={idx} className="group/bar cursor-pointer" id={`occupancy-bar-${idx}`}>
                        <rect
                          x={xCoord}
                          y={bar.y}
                          width={barWidth}
                          height={bar.h}
                          className="fill-slate-200/80 group-hover/bar:fill-emerald-600 transition-colors duration-200"
                          rx="2"
                        />
                        {/* Hover Tooltip */}
                        <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <rect x={xCoord - 17} y={bar.y - 28} width="50" height="16" rx="3" fill="#0f172a" />
                          <text x={xCoord + 8} y={bar.y - 17} fill="#ffffff" className="text-[8px] font-bold font-mono text-center" textAnchor="middle">{bar.pct}%</text>
                        </g>
                        {/* X Label */}
                        <text x={xCoord + 8} y="185" className="text-[9px] font-medium fill-slate-400 text-center" textAnchor="middle">{bar.month}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Fleet Status List (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Status Armada Aktif</h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Memantau aset armada yang tersimpan di database.</p>
                  </div>
                  <Link href="/trucks" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1">
                    <span>Lihat semua armada</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">ID Truk</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Muatan Kargo</th>
                        <th className="pb-3 text-right pr-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                      {activeFleet.map((truck) => (
                        <tr key={truck.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-2 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <img src={truck.image} alt={truck.id} className="w-8 h-6 rounded object-cover border border-slate-100 flex-shrink-0" />
                              <span>{truck.id}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                          <td className="py-3.5 font-bold text-slate-900">{truck.capacity}</td>
                          <td className="py-3.5 text-right pr-2">
                            {truck.id === "TRC-204" ? (
                              <Link
                                href={truck.link}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                              >
                                <span>Detail Kargo</span>
                                <ArrowRight size={10} />
                              </Link>
                            ) : (
                              <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] cursor-not-allowed">
                                <span>Lihat manifes</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Actions & Activity Graph (Right 1 column) */}
            <div className="space-y-6">
              
              {/* Warehouse efficiency metric */}
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase mb-4">Status Operasi Armada</h2>
                
                <div className="space-y-5">
                  {activeFleet.slice(0, 3).map((truck, idx) => (
                    <div key={truck.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-amber-500" : "bg-slate-300"
                        }`} />
                        <span className="text-xs font-semibold text-slate-700">Unit {truck.id} ({truck.driver})</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{truck.capacity} muatan</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-50 pt-5 mt-5 text-center">
                  <Link
                    href="/optimasi"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span>Kelola Pemuatan Aktif (TRC-204)</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Operations logs */}
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase mb-4">Aktivitas Sistem</h2>
                <div className="space-y-4">
                  {[
                    { time: "21:30", desc: "Pengemudi TRC-204 Marcus Lee masuk (check-in)" },
                    { time: "21:20", desc: "Pemuatan kargo TRC-204 dimulai" },
                    { time: "20:10", desc: "TRC-206 Pengepakan Muatan 100% Selesai" },
                    { time: "19:50", desc: "Daftar periksa pra-pemuatan ditandatangani untuk TRC-205" }
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3 text-xs items-start">
                      <Clock size={14} className="text-slate-400 mt-0.5" />
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

