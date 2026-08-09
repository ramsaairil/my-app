"use client";

import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import { User, Mail, Phone, Shield, MapPin, Truck, Database, LogOut, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { name, email, initials, avatarColor, setName, setInitials, setAvatarColor, logout } = useProfile();
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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">
      
      {/* Toast Feedback */}
      {toast.show && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-[#087F5B] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-bold transition-all">
          <CheckCircle2 size={16} />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-7 sm:p-9 custom-scrollbar">
        <div className="max-w-[1320px] mx-auto space-y-7">
          
          {/* Header */}
          <div className="pb-4 border-b border-[#E7EBF0]">
            <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
              Pengaturan
            </h1>
            <p className="text-[14px] text-[#667085] mt-1">
              Kelola profil akun, preferensi operasional, dan integrasi Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            
            {/* Left Card: Avatar & Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 flex flex-col items-center text-center space-y-4">
                <div className={`relative w-20 h-20 rounded-full ${avatarColor} border-4 border-[#F8FAFC] flex items-center justify-center shadow-xs transition-all`}>
                  <span className="text-2xl font-bold text-white tracking-wider uppercase select-none">
                    {initials}
                  </span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#172033]">{name}</h2>
                  <p className="text-xs text-[#667085] flex items-center gap-1.5 justify-center">
                    <Truck size={14} className="text-[#087F5B]" />
                    Pengemudi Logistik Senior
                  </p>
                </div>
              </div>

              {/* Avatar Color customization */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-semibold text-[#667085] tracking-wider uppercase">Warna Badge Logo</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { name: "Emerald Green", value: "bg-[#087F5B]" },
                    { name: "Indigo Blue", value: "bg-indigo-700" },
                    { name: "Slate Gray", value: "bg-slate-700" },
                    { name: "Rose Red", value: "bg-rose-700" },
                    { name: "Amber Orange", value: "bg-[#B7791F]" }
                  ].map((colorOpt) => (
                    <button
                      key={colorOpt.value}
                      onClick={() => setAvatarColor(colorOpt.value)}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        avatarColor === colorOpt.value
                          ? "border-[#172033] scale-110"
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
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-[#172033] border-b border-[#E7EBF0] pb-3 flex items-center gap-2">
                  <User size={16} className="text-[#667085]" />
                  Identitas Operasional
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                  />
                </div>
              </div>

              {/* Credentials Grid */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-[#172033] border-b border-[#E7EBF0] pb-3">Kredensial Lisensi & Penugasan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-[#172033]">
                  <div className="flex items-center gap-3 p-3.5 border border-[#E7EBF0] rounded-lg bg-[#F8FAFC]">
                    <Mail size={16} className="text-[#667085]" />
                    <div>
                      <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">Alamat Email (Supabase)</span>
                      <span className="text-[#172033] font-semibold">{email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 border border-[#E7EBF0] rounded-lg bg-[#F8FAFC]">
                    <Phone size={16} className="text-[#667085]" />
                    <div>
                      <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">Nomor Kontak</span>
                      <span className="text-[#172033] font-semibold">+62 812-3456-7890</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 border border-[#E7EBF0] rounded-lg bg-[#F8FAFC]">
                    <Shield size={16} className="text-[#667085]" />
                    <div>
                      <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">Kelas Lisensi</span>
                      <span className="text-[#172033] font-semibold">Komersial Kelas A (CDL)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 border border-[#E7EBF0] rounded-lg bg-[#F8FAFC]">
                    <Truck size={16} className="text-[#667085]" />
                    <div>
                      <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">Unit yang Ditugaskan</span>
                      <span className="text-[#172033] font-semibold">TRC-204 (Gran Max)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* LOWER SECTION: GENERAL PREFERENCES & ACCOUNT SESSION */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 sm:p-8 space-y-8">
            
            {/* Account & Session Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#172033] border-b border-[#E7EBF0] pb-3 flex items-center gap-2">
                <LogOut size={16} className="text-[#667085]" />
                Akun & Sesi Supabase
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-[#172033]">
                <div>
                  <h3 className="text-[#172033]">Keluar dari Portal Operasi</h3>
                  <p className="text-[12px] text-[#667085] mt-0.5">Akhiri sesi Supabase Auth Anda.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold transition-all cursor-pointer self-start sm:self-center"
                >
                  <LogOut size={14} />
                  Keluar Sesi
                </button>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-4 border-t border-[#E7EBF0] flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Save size={15} />
                Simpan Pengaturan
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
