"use client";

import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import { User, Mail, Phone, Shield, MapPin, Truck, Database, LogOut, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { name, initials, avatarColor, setName, setInitials, setAvatarColor } = useProfile();
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const handleNameChange = (newName: string) => {
    setName(newName);
    const words = newName.trim().split(/\s+/).filter(Boolean);
    let init = "L";
    if (words.length >= 2) {
      init = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      init = words[0].slice(0, 2).toUpperCase();
    }
    setInitials(init);
  };

  const handleSave = () => {
    setToast({ show: true, message: "Preferensi dan profil berhasil disimpan!" });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const handleLogout = () => {
    console.log("Pengguna telah keluar dari sesi aktif.");
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Pengaturan & Profil"
      />

      {/* Toast Feedback */}
      {toast.show && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-700 text-xs font-bold transition-all animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* TOP SECTION: PROFILE SUMMARY & AVATAR CUSTOMIZATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Card: Avatar & Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
                <div className={`relative w-24 h-24 rounded-full ${avatarColor} border-4 border-slate-50 flex items-center justify-center shadow-md transition-all`}>
                  <span className="text-3xl font-extrabold text-white tracking-wider uppercase select-none">
                    {initials}
                  </span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-slate-800 transition-all">{name}</h2>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 justify-center">
                    <Truck size={13} className="text-emerald-700" />
                    Pengemudi Logistik Senior (TRC-204)
                  </p>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 justify-center">
                    <MapPin size={12} />
                    Hub Logistik Gudang New York
                  </p>
                </div>
              </div>

              {/* Avatar Color customization */}
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Warna Badge Logo</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { name: "Emerald Green", value: "bg-emerald-700" },
                    { name: "Indigo Blue", value: "bg-indigo-700" },
                    { name: "Slate Gray", value: "bg-slate-700" },
                    { name: "Rose Red", value: "bg-rose-700" },
                    { name: "Amber Orange", value: "bg-amber-600" }
                  ].map((colorOpt) => (
                    <button
                      key={colorOpt.value}
                      onClick={() => setAvatarColor(colorOpt.value)}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        avatarColor === colorOpt.value
                          ? "border-slate-800 scale-110 shadow-xs"
                          : "border-transparent hover:scale-105"
                      } ${colorOpt.value}`}
                      title={colorOpt.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Identity Form & Credentials */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Identity Form */}
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase border-b border-slate-50 pb-2 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  Identitas Operasional
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Credentials Grid */}
              <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase border-b border-slate-50 pb-2">Kredensial Lisensi & Penugasan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <Mail size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email</span>
                      <span className="text-slate-800 font-semibold">marcus.lee@logistic.com</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <Phone size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Kontak</span>
                      <span className="text-slate-800 font-semibold">+1 (555) 392-1204</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <Shield size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas Lisensi</span>
                      <span className="text-slate-800 font-semibold">Komersial Kelas A (CDL)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <Truck size={16} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit yang Ditugaskan</span>
                      <span className="text-slate-800 font-semibold">TRC-204 (Volvo FH16 Semi)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* LOWER SECTION: GENERAL PREFERENCES & ACCOUNT SESSION */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* General Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <Database size={16} className="text-slate-400" />
                Preferensi Umum Operasional
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
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Save size={15} />
                Simpan semua preferensi
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
