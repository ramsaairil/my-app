"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchCargosFromDb, fetchTrucksFromDb, CargoDbRecord } from "../../lib/db";
import { getStoredCargos, getStoredVehicles } from "../../lib/storage";
import { Vehicle } from "../../lib/types";
import { useProfile } from "../context/ProfileContext";


export default function HomeOverviewPage() {
  const { name: profileName } = useProfile();
  const [dbCargos, setDbCargos] = useState<CargoDbRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
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

          </div>

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
