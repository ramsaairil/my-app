"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchCargosFromDb, fetchTrucksFromDb, CargoDbRecord } from "../../lib/db";
import { getStoredCargos, getStoredVehicles } from "../../lib/storage";
import { Vehicle } from "../../lib/types";
import { useProfile } from "../context/ProfileContext";

interface LastOptimizationData {
  vehicleName: string;
  score: string;
  utilization: string;
  placedItems: string | null;
  utilizationNum: number | null;
}

export default function HomeOverviewPage() {
  const { name: profileName } = useProfile();
  const [dbCargos, setDbCargos] = useState<CargoDbRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lastOptimization, setLastOptimization] = useState<LastOptimizationData | null>(null);

  // Load and synchronize live data from Supabase PostgreSQL database & LocalStorage
  useEffect(() => {
    async function syncDashboardData() {
      const [cargos, dbTrucks] = await Promise.all([
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

      if (dbTrucks && dbTrucks.length > 0) {
        const mappedTrucks: Vehicle[] = dbTrucks.map((t) => ({
          id: t.id,
          name: t.truck_name || t.id,
          type: "Box Truck 3D",
          lengthCm: t.length_cm || 450,
          widthCm: t.width_cm || 200,
          heightCm: t.height_cm || 200,
          volumeM3: Number(t.max_volume_m3 || 18.0),
          status: t.status === "Maintenance" ? "Nonaktif" : "Aktif"
        }));
        setVehicles(mappedTrucks);
      } else {
        const localVehicles = getStoredVehicles();
        setVehicles(localVehicles);
      }

      // Read last optimization result from storage if available
      try {
        const rawPreload =
          sessionStorage.getItem("SIMULATION_PRELOAD_RESULT") ||
          localStorage.getItem("SIMULATION_PRELOAD_RESULT");
        if (rawPreload) {
          const parsed = JSON.parse(rawPreload);
          if (parsed) {
            const opt = parsed.optimizationResult || parsed;
            const vehicleName =
              opt.vehicle?.name ||
              opt.vehicleName ||
              (parsed.bestTrial ? parsed.bestTrial.vehicleName : null) ||
              "-";
            
            let rawScore = opt.fitnessScore !== undefined ? opt.fitnessScore : opt.score;
            if (rawScore === undefined && parsed.bestTrial) {
              rawScore = parsed.bestTrial.score;
            }
            const scoreStr = rawScore !== undefined && rawScore !== null ? Number(rawScore).toFixed(1) : "-";

            let rawUtil = opt.utilizationPercent;
            if (rawUtil === undefined && parsed.bestTrial) {
              rawUtil = parsed.bestTrial.utilizationPercent;
            }
            const utilStr = rawUtil !== undefined && rawUtil !== null ? `${rawUtil}%` : "-";

            let placedStr: string | null = null;
            if (opt.totalBoxesPacked !== undefined && opt.totalBoxesRequested !== undefined) {
              placedStr = `${opt.totalBoxesPacked}/${opt.totalBoxesRequested} unit`;
            } else if (opt.totalPlacedItems !== undefined && opt.totalRequestedItems !== undefined) {
              placedStr = `${opt.totalPlacedItems}/${opt.totalRequestedItems} unit`;
            } else if (parsed.bestTrial && parsed.bestTrial.totalPlacedItems !== undefined) {
              placedStr = `${parsed.bestTrial.totalPlacedItems}/${parsed.bestTrial.totalRequestedItems} unit`;
            }

            setLastOptimization({
              vehicleName,
              score: scoreStr,
              utilization: utilStr,
              placedItems: placedStr,
              utilizationNum: rawUtil !== undefined && rawUtil !== null ? Number(rawUtil) : null
            });
          }
        }
      } catch (e) {
        console.error("Failed to load last optimization result", e);
      }
    }

    syncDashboardData();
  }, []);

  const totalVolumeM3 = useMemo(() => {
    return dbCargos.reduce((sum, c) => sum + Number(c.volume_m3 || 0), 0);
  }, [dbCargos]);

  const totalTrucksCount = vehicles.length;
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
              Selamat datang{profileName ? `, ${profileName}` : ""}! Pantau data kendaraan, barang, dan hasil optimasi.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Total Kendaraan</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#172033]">{totalTrucksCount} Unit</span>
              </div>
              <p className="text-[13px] text-[#667085]">Armada terdaftar</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Total Jenis Barang</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#172033]">{totalCargosCount} Jenis</span>
              </div>
              <p className="text-[13px] text-[#667085]">Jenis barang master</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Total Volume Barang</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#087F5B]">{totalVolumeM3.toFixed(1)} m³</span>
              </div>
              <p className="text-[13px] text-[#667085]">Total kubikasi barang</p>
            </div>

            <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-1.5 transition-all">
              <span className="text-[12px] font-semibold text-[#667085] uppercase tracking-wider block">Utilisasi Terbaik</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold text-[#087F5B]">
                  {lastOptimization && lastOptimization.utilization !== "-" ? lastOptimization.utilization : "-"}
                </span>
              </div>
              <p className="text-[13px] text-[#667085]">Hasil optimasi 3D terbaik</p>
            </div>

          </div>

          {/* Section: HASIL OPTIMASI TERAKHIR */}
          {lastOptimization ? (
            <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7EBF0]">
                <h2 className="font-bold text-base text-[#172033]">Hasil Optimasi Terakhir</h2>
                <span className="px-2.5 py-0.5 bg-[#E8F7F1] text-[#087F5B] text-xs font-bold rounded">
                  Terverifikasi 3D
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Kendaraan Terpilih</span>
                  <span className="text-base sm:text-lg font-bold text-[#172033] block truncate">{lastOptimization.vehicleName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Score Optimasi</span>
                  <span className="text-base sm:text-lg font-bold text-[#172033] block">{lastOptimization.score}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Utilisasi Ruang</span>
                  <span className="text-base sm:text-lg font-bold text-[#087F5B] block">{lastOptimization.utilization}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Muatan Berhasil</span>
                  <span className="text-base sm:text-lg font-bold text-[#172033] block">{lastOptimization.placedItems || "-"}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href="/optimasi"
                  className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Lihat Hasil Optimasi</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="font-bold text-base text-[#172033]">Hasil Optimasi Terakhir</h2>
                <p className="text-xs text-[#667085]">Belum ada hasil optimasi.</p>
              </div>
              <Link
                href="/optimasi"
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <span>Lihat Hasil Optimasi</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Section: DAFTAR KENDARAAN (Full Width) */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl overflow-hidden">
            <div className="p-4 sm:px-5 border-b border-[#E7EBF0] flex items-center justify-between">
              <h2 className="font-bold text-base text-[#172033]">
                Daftar Kendaraan
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
                    <th className="py-3 px-5 font-medium">ID Unit</th>
                    <th className="py-3 px-5 font-medium">Nama Kendaraan</th>
                    <th className="py-3 px-5 font-medium">Tipe</th>
                    <th className="py-3 px-5 font-medium">Kapasitas Volume</th>
                    <th className="py-3 px-5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EBF0] text-[#172033]">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#667085] text-xs">
                        Belum ada data kendaraan di database. Silakan tambah kendaraan baru pada menu Data Kendaraan.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#172033]">
                          {v.id}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#172033]">
                          {v.name}
                        </td>
                        <td className="py-3.5 px-5 text-[#667085]">
                          {v.type}
                        </td>
                        <td className="py-3.5 px-5 font-mono font-bold text-[#087F5B]">
                          {v.volumeM3.toFixed(2)} m³
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link
                            href="/optimasi"
                            className="text-[12px] font-semibold text-[#087F5B] hover:text-[#066B4D] hover:underline"
                          >
                            Optimasi 3D
                          </Link>
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
