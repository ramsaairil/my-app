"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "./context/ProfileContext";
import {
  ArrowRight,
  ChevronRight,
  Box,
  Truck,
  Database
} from "lucide-react";

export default function LandingPage() {
  const profile = useProfile();
  const isAuthenticated = Boolean(profile.session || profile.user);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] font-sans antialiased flex flex-col justify-between relative overflow-hidden">

      {/* Navbar */}
      <header className="bg-white border-b border-[#E7EBF0] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#087F5B] flex items-center justify-center text-white font-bold text-xs">
              <Box size={17} />
            </div>
            <span className="font-bold text-base tracking-tight text-[#172033]">
              SISTEM MUATAN 3D
            </span>
          </Link>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-[13px] font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <span>Buka Dashboard</span>
                <ChevronRight size={15} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-[13px] font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <span>Masuk</span>
                <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center py-16 px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-12 z-10">
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#172033] tracking-tight leading-tight">
            Perencanaan & Optimasi <br />
            <span className="text-[#087F5B]">
              Muatan 3D
            </span>
          </h1>

          <p className="text-[#667085] text-sm font-medium leading-relaxed max-w-xl mx-auto">
            Optimalkan penempatan muatan, kapasitas kendaraan, dan utilisasi ruang menggunakan visualisasi 3D.
          </p>

          <div className="pt-2 flex flex-col items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2"
                >
                  <span>Mulai Sekarang</span>
                  <ArrowRight size={16} />
                </Link>

                <div className="text-xs text-[#667085]">
                  Belum punya akun?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#087F5B] hover:underline"
                  >
                    Daftar
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E8F7F1] flex items-center justify-center text-[#087F5B]">
              <Box size={20} />
            </div>
            <h3 className="text-base font-semibold text-[#172033]">Visualisasi 3D</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Simulasi penempatan muatan secara visual 3D interaktif tanpa barang menggantung.
            </p>
          </div>

          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E8F7F1] flex items-center justify-center text-[#087F5B]">
              <Database size={20} />
            </div>
            <h3 className="text-base font-semibold text-[#172033]">Integrasi Supabase</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Kelola data kargo dan armada secara langsung terhubung dengan database Supabase PostgreSQL.
            </p>
          </div>

          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#E8F7F1] flex items-center justify-center text-[#087F5B]">
              <Truck size={20} />
            </div>
            <h3 className="text-base font-semibold text-[#172033]">Rekomendasi Otomatis</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Sistem menentukan kendaraan terbaik secara otomatis berdasarkan volume muatan input.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7EBF0] py-5 px-6 lg:px-8 text-xs text-[#667085]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} SISTEM MUATAN 3D. Connected to Supabase Auth.</span>
          <div>
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-[#087F5B] font-semibold hover:underline">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-[#087F5B] font-semibold hover:underline">
                Portal Login
              </Link>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
