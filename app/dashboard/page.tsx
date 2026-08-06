"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  BarChart3,
  Search,
  X,
  Plus,
  ArrowUpDown,
  Hash,
  Type,
  Maximize,
  Tag,
  Zap,
  FileText,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { fetchCargosFromDb, fetchTrucksFromDb, CargoDbRecord } from "../../lib/db";

interface FleetTruckItem {
  id: string;
  driver: string;
  status: "Siap" | "Memuat" | "Keluar" | "Menganggur";
  capacity: string;
  link: string;
  image: string;
  type?: string;
  plate?: string;
}

export default function HomeOverviewPage() {
  const router = useRouter();
  const [dbCargos, setDbCargos] = useState<CargoDbRecord[]>([]);
  const [activeFleet, setActiveFleet] = useState<FleetTruckItem[]>([
    { id: "TRC-204", driver: "Marcus Lee", status: "Memuat", capacity: "48%", link: "/optimasi", image: "/truck_40ft.png", type: "Tronton 40ft", plate: "B 9204 TKG" },
    { id: "TRC-205", driver: "Sofia Rodriguez", status: "Siap", capacity: "92%", link: "/optimasi", image: "/truck_53ft.png", type: "Trailer 53ft", plate: "B 9205 SFA" },
    { id: "TRC-206", driver: "David Chen", status: "Keluar", capacity: "100%", link: "/optimasi", image: "/truck_45ft.png", type: "Wingbox 45ft", plate: "B 9206 DVC" },
    { id: "TRC-207", driver: "Elena Rostova", status: "Menganggur", capacity: "0%", link: "/optimasi", image: "/truck_20ft.png", type: "Engkel 20ft", plate: "B 9207 ELN" }
  ]);

  const [activeView, setActiveView] = useState<"summary" | "fleet" | "activity">("summary");
  const [searchQuery, setSearchQuery] = useState("");

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
          image: "/truck_40ft.png",
          type: t.truck_type || "Standard Container",
          plate: t.plate_number || "B ---- XXX"
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

  const filteredFleet = useMemo(() => {
    return activeFleet.filter(truck => {
      return (
        truck.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (truck.plate && truck.plate.toLowerCase().includes(searchQuery.toLowerCase())) ||
        truck.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeFleet, searchQuery]);

  const activityLogs = [
    { time: "21:30", desc: "Pengemudi TRC-204 Marcus Lee masuk (check-in)", tag: "Check-in" },
    { time: "21:20", desc: "Pemuatan kargo TRC-204 dimulai di Dock A2", tag: "Memuat" },
    { time: "20:10", desc: "TRC-206 Pengepakan Muatan 100% Selesai", tag: "Selesai" },
    { time: "19:50", desc: "Daftar periksa pra-pemuatan ditandatangani untuk TRC-205", tag: "Verified" },
    { time: "18:30", desc: "Perhitungan alokasi volume kargo baru diperbarui", tag: "System" }
  ];

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#fafafa] text-slate-800 font-sans antialiased">
      
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
                  Dashboard Overview
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pusat pemantauan status armada, volume kargo terdaftar, dan log aktivitas operasional real-time.
                </p>
              </div>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* NOTION TOOLBAR & VIEW TABS BAR */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            
            {/* Left: View Tabs Selector */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg">
              <button
                onClick={() => setActiveView("summary")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "summary"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart3 size={14} className={activeView === "summary" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={() => setActiveView("fleet")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "fleet"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Truck size={14} className={activeView === "fleet" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Fleet Database ({activeFleet.length})</span>
              </button>

              <button
                onClick={() => setActiveView("activity")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "activity"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock size={14} className={activeView === "activity" ? "text-[#2383e2]" : "text-slate-400"} />
                <span>Activity Timeline</span>
              </button>
            </div>

            {/* Right: Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dashboard..."
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
          {/* MAIN NOTION DATABASE CONTENT SECTION */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-6">
            
            {/* NOTION FLEET DATABASE TABLE */}
            {(activeView === "summary" || activeView === "fleet") && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden space-y-0">
                
                {/* Table Header Section */}
                <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-[#2383e2]" />
                    <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Status Alokasi Armada Real-Time
                    </h2>
                  </div>

                  <Link
                    href="/trucks"
                    className="text-xs font-bold text-[#2383e2] hover:underline flex items-center gap-1"
                  >
                    <span>Buka Database Armada</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    
                    {/* Property Header Icons */}
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
                            <span>Pengemudi & Armada</span>
                          </div>
                        </th>

                        <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-44">
                          <div className="flex items-center gap-1.5">
                            <Tag size={13} className="text-slate-400" />
                            <span>Tipe Kendaraan</span>
                          </div>
                        </th>

                        <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-32">
                          <div className="flex items-center gap-1.5">
                            <Zap size={13} className="text-slate-400" />
                            <span>Status</span>
                          </div>
                        </th>

                        <th className="py-2.5 px-4 font-medium border-r border-slate-200/60 w-44">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 size={13} className="text-slate-400" />
                            <span>Kapasitas Muatan</span>
                          </div>
                        </th>

                        <th className="py-2.5 px-4 font-medium text-right w-28">
                          <span>Aksi</span>
                        </th>
                      </tr>
                    </thead>

                    {/* Table Rows */}
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                      {filteredFleet.map((truck) => (
                        <tr key={truck.id} className="hover:bg-[#f7f7f5] transition-colors group">
                          
                          {/* ID Unit */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-mono font-bold text-slate-900">
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              {truck.id}
                            </span>
                          </td>

                          {/* Driver Name & Plate */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 font-medium text-slate-800">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{truck.driver}</span>
                              <span className="text-[10px] font-mono text-slate-400">{truck.plate}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60 text-slate-600 font-medium">
                            {truck.type}
                          </td>

                          {/* Status Tag Badge */}
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

                          {/* Capacity Progress Bar */}
                          <td className="py-2.5 px-4 border-r border-slate-200/60">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-500 font-medium">Ruang Terpakai</span>
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

                          {/* Action CTA */}
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => router.push("/optimasi")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-[#2383e2] hover:text-white text-slate-700 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Simulasi 3D</span>
                              <ChevronRight size={12} />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* NOTION ACTIVITY LOG TIMELINE */}
            {(activeView === "summary" || activeView === "activity") && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                
                <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#2383e2]" />
                    <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Log Aktivitas Terkini
                    </h2>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Live Stream
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {activityLogs.map((act, i) => (
                    <div key={i} className="p-3.5 hover:bg-[#f7f7f5] transition-colors flex items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono text-[10px] font-bold">
                          {act.time}
                        </div>
                        <span className="font-medium text-slate-700">{act.desc}</span>
                      </div>

                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {act.tag}
                      </span>

                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
