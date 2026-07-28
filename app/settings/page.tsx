"use client";

import React from "react";
import PageHeader from "../components/PageHeader";
import { Save, Database, Bell, ToggleRight, LogOut } from "lucide-react";

export default function SettingsPage() {
  const handleLogout = () => {
    console.log("Pengguna telah keluar dari sesi aktif.");
    alert("Sesi berakhir. Anda telah berhasil keluar!");
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Pengaturan"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Pengaturan" }
        ]}
      />

      <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-[1000px] mx-auto bg-white border border-slate-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* General Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <Database size={16} className="text-slate-400" />
              Preferensi Umum
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dok Pemuatan Default</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-750 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer font-semibold">
                  <option>Dok #3 (Utama)</option>
                  <option>Dok #1</option>
                  <option>Dok #2</option>
                  <option>Dok #4</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pemicu Optimasi Muatan Otomatis</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-750 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer font-semibold">
                  <option>90% Kapasitas volume kargo</option>
                  <option>95% Kapasitas volume kargo</option>
                  <option>Hanya manual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <Bell size={16} className="text-slate-400" />
              Notifikasi Peringatan
            </h2>
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-slate-900">Ringkasan Manifes Email</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Simpan rekap manifes ke supervisor logistik saat muatan selesai dipak.</p>
                </div>
                <ToggleRight className="text-emerald-700 cursor-pointer hover:opacity-90 transition-opacity" size={32} />
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                <div>
                  <h3 className="text-slate-900">Peringatan Kapasitas Berlebih</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Peringatkan operator segera ketika muatan truk melebihi 100% kapasitas.</p>
                </div>
                <ToggleRight className="text-emerald-700 cursor-pointer hover:opacity-90 transition-opacity" size={32} />
              </div>
            </div>
          </div>

          {/* Account & Session Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <LogOut size={16} className="text-slate-400" />
              Akun & Sesi
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-700">
              <div>
                <h3 className="text-slate-900">Keluar dari Portal Operasi</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Akhiri sesi manajemen optimasi muatan Anda untuk Logistic.</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-center"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer">
              <Save size={14} />
              Simpan preferensi
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
