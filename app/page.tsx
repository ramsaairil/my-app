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

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between relative overflow-hidden">

      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-100/40 via-emerald-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              <Box size={17} />
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900 group-hover:text-emerald-800 transition-colors">
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
              className="px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm hover:shadow-emerald-700/20"
            >
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-12 z-10">
        <div className="text-center space-y-5 max-w-2xl mx-auto">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Perencanaan & Optimasi <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Muatan 3D
            </span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto">
            Optimalkan okupansi volume kontainer, kalkulasi kubikasi volumetrik, dan kelola alokasi armada logistik secara presisi.
          </p>

        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-300/80 hover:shadow-md transition-all space-y-2 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Box size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Visualisasi 3D</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Simulasi peletakan kargo secara volumetrik 3D interaktif untuk efisiensi ruang maksimum.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-300/80 hover:shadow-md transition-all space-y-2 group">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <Database size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Database Muatan</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Kelola periferal manifes kargo dan dimensi secara terstruktur dalam database terpusat.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-300/80 hover:shadow-md transition-all space-y-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-700 group-hover:text-white transition-colors">
              <Truck size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Manajemen Armada</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Pantau status unit truk dan alokasi kapasitas muatan armada secara real-time.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 font-medium z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>&copy; {new Date().getFullYear()} Sistem Muatan 3D. All rights reserved.</span>
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
