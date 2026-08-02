"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "./context/ProfileContext";
import {
  Package,
  ArrowRight,
  ChevronRight,
  Lock,
  User,
  X,
  Box,
  Truck,
  Database,
  Check
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const profile = useProfile();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password harus diisi");
      return;
    }
    setError("");
    
    // Update profile context with the logged-in username
    const nameInput = username.trim();
    profile.setName(nameInput);
    
    // Calculate initials
    const words = nameInput.split(/\s+/);
    let init = "L";
    if (words.length >= 2) {
      init = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      init = words[0].slice(0, 2).toUpperCase();
    }
    profile.setInitials(init);
    
    router.push("/overview");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
              <Box size={16} />
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
              Sistem Muatan 3D
            </span>
          </Link>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setError("");
                setIsLoginOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <span>Sistem Perencanaan Muatan & Armada Logistik</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Perencanaan Tata Letak Kargo & Ruang Kontainer Truk
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Optimalkan okupansi volume kontainer, hitung kubikasi kargo secara volumetrik, dan alokasikan slot muatan armada logistik secara presisi.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setError("");
                setIsLoginOpen(true);
              }}
              className="px-7 py-3 rounded-lg font-bold text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <Lock size={16} />
              <span>Masuk Ke Sistem</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-700" />
              Simulasi Viewport 3D
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-700" />
              Kalkulasi Kubikasi Volumetrik
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-700" />
              Manajemen Armada Real-time
            </span>
          </div>

        </div>

        {/* Product Workspace Preview */}
        <div id="simulasi" className="max-w-4xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            
            {/* Titlebar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs font-bold text-slate-700 ml-2">Simulasi Unit TRC-204 — Tampilan 3D Logistik</span>
              </div>
            </div>

            {/* Viewport Area */}
            <div className="p-6 bg-slate-50/50">
              <div className="h-[210px] bg-white border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden p-4">
                <div
                  className="relative w-[280px] h-[65px] transition-transform duration-500 ease-out transform scale-110"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateX(-18deg) rotateY(-35deg)"
                  }}
                >
                  {/* Back Wall */}
                  <div
                    className="absolute inset-0 bg-blue-500/5 border border-blue-500/60 rounded"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: "translate3d(0,0,-40px)",
                      backgroundImage: "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}
                  />
                  {/* Floor */}
                  <div
                    className="absolute bg-blue-500/5 border-2 border-blue-500/60"
                    style={{
                      width: "280px",
                      height: "80px",
                      left: 0,
                      top: "calc(50% - 40px)",
                      transform: "rotateX(90deg) translate3d(0,0,32px)",
                      backgroundImage: "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}
                  />
                  {/* Cargo Box 1 */}
                  <div
                    className="absolute bg-rose-500/70 border border-rose-700 text-[8px] font-black text-slate-900 flex items-center justify-center rounded shadow-xs"
                    style={{ width: "75px", height: "20px", left: "20px", top: "10px", transform: "translate3d(0,0,10px)" }}
                  >
                    KRG-5839
                  </div>
                  {/* Cargo Box 2 */}
                  <div
                    className="absolute bg-cyan-500/70 border border-cyan-700 text-[8px] font-black text-slate-900 flex items-center justify-center rounded shadow-xs"
                    style={{ width: "105px", height: "20px", left: "105px", top: "10px", transform: "translate3d(0,0,10px)" }}
                  >
                    KRG-4434
                  </div>
                  {/* Cargo Box 3 */}
                  <div
                    className="absolute bg-fuchsia-500/70 border border-fuchsia-700 text-[8px] font-black text-slate-900 flex items-center justify-center rounded shadow-xs"
                    style={{ width: "70px", height: "20px", left: "105px", top: "35px", transform: "translate3d(0,0,10px)" }}
                  >
                    KRG-0040
                  </div>
                </div>
              </div>

              {/* Status metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-semibold text-slate-700">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-400 font-normal">Okupansi:</span>
                  <span className="font-bold text-emerald-700">88.5%</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-400 font-normal">Total Volume:</span>
                  <span className="font-bold text-slate-900">59.9 m³</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-400 font-normal">Efisiensi Ruang:</span>
                  <span className="font-bold text-slate-900">Sangat Baik</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-400 font-normal">Status Pemuatan:</span>
                  <span className="font-bold text-emerald-700">Memuat</span>
                </div>
              </div>
            </div>

            {/* Footer Bar inside product frame */}
            <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Profil Patokan: Operasi Default</span>
              <button
                onClick={() => {
                  setError("");
                  setIsLoginOpen(true);
                }}
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Masuk Ke Sistem</span>
                <ArrowRight size={12} />
              </button>
            </div>

          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              <Box size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Visualisasi Kargo 3D</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tampilkan peletakan kargo secara volumetrik 3D interaktif untuk memaksimalkan okupansi ruang kontainer.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold">
              <Database size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Database Inventaris</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Kelola periferal manifes kargo, dimensi palet/box, serta integrasi langsung dengan database PostgreSQL.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              <Truck size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Manajemen Armada</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Pantau status unit truk dan tingkat okupansi volume kontainer secara real-time dari satu dashboard terpusat.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 font-medium">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>&copy; {new Date().getFullYear()} Sistem Perencanaan Muatan Logistik. All rights reserved.</span>
          </div>

          <div>
            <button
              onClick={() => {
                setError("");
                setIsLoginOpen(true);
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Portal Login Operasi
            </button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setIsLoginOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-6 z-10 transition-all transform scale-100">
            {/* Close Button */}
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Portal Operasi</h3>
              <p className="text-xs text-slate-500 mt-1">Masukkan kredensial untuk masuk ke sistem.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-700/10"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
