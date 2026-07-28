"use client";

import React from "react";
import PageHeader from "../components/PageHeader";
import { useProfile } from "../context/ProfileContext";
import { Mail, Phone, Shield, MapPin, Truck } from "lucide-react";

export default function ProfilePage() {
  const { name, initials, avatarColor, setName, setInitials, setAvatarColor } = useProfile();

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Pengaturan Profil"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Profil" }
        ]}
      />

      <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Summary Card & Avatar customization (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Summary Card */}
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

          {/* RIGHT COLUMN: Edit Form & Credentials (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Edit Identity Card */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase border-b border-slate-50 pb-2">Identitas Operasional</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Inisial Logo (Maks 2 Karakter)</label>
                  <input
                    type="text"
                    value={initials}
                    maxLength={2}
                    onChange={(e) => setInitials(e.target.value.slice(0, 2).toUpperCase())}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-semibold text-slate-800 tracking-wider uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Credentials Card */}
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
      </div>
    </div>
  );
}
