"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "../components/PageHeader";
import { Truck, ArrowRight, User } from "lucide-react";

export default function TrucksPage() {
  const trucks = [
    { id: "TRC-204", status: "Memuat", driver: "Marcus Lee", containerType: "Kontainer Standard 40ft (67,7 m³)", dock: "Dok #3", started: "08:34", capacity: "48%", image: "/truck_40ft.png" },
    { id: "TRC-205", status: "Siap", driver: "Sofia Rodriguez", containerType: "Trailer Dry Van 53ft (110 m³)", dock: "Dok #1", started: "09:45", capacity: "92%", image: "/truck_53ft.png" },
    { id: "TRC-206", status: "Keluar", driver: "David Chen", containerType: "Kontainer High Cube 45ft (86 m³)", dock: "Dalam Pemuatan", started: "06:12", capacity: "100%", image: "/truck_45ft.png" },
    { id: "TRC-207", status: "Menganggur", driver: "Elena Rostova", containerType: "Kontainer Standard 20ft (33,2 m³)", dock: "Dok #2", started: "Menunggu", capacity: "0%", image: "/truck_20ft.png" }
  ];

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <PageHeader
        title="Armada Truk"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Armada" }
        ]}
      />

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-colors duration-200 flex flex-col"
              >
                {/* Truck Image and Status Overlay */}
                <div className="h-44 relative bg-slate-50">
                  <img src={truck.image} alt={truck.id} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${
                    truck.status === "Siap"
                      ? "bg-emerald-50/90 text-emerald-700 border-emerald-100/50"
                      : truck.status === "Memuat"
                      ? "bg-amber-50/90 text-amber-700 border-amber-100/50"
                      : truck.status === "Keluar"
                      ? "bg-indigo-50/90 text-indigo-700 border-indigo-100/50"
                      : "bg-slate-100/90 text-slate-600 border-slate-200/50"
                  }`}>
                    {truck.status}
                  </span>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 flex-shrink-0">
                          <Truck size={18} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">{truck.id}</h2>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <User size={12} />
                            <span>{truck.driver}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500 pt-2 border-t border-slate-50">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipe Kontainer</span>
                        <span className="text-slate-800 font-semibold">{truck.containerType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dok</span>
                        <span className="text-slate-800 font-semibold">{truck.dock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mulai</span>
                        <span className="text-slate-800 font-semibold">{truck.started}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kapasitas saat ini</span>
                        <span className="text-slate-800 font-semibold">{truck.capacity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                    {truck.id === "TRC-204" ? (
                      <Link
                        href="/optimasi"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>Kelola Kargo</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors">
                        <span>Lihat detail</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
