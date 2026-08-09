"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "./context/ProfileContext";
import {
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
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!emailOrUsername.trim() || !password.trim()) {
      setError("Email/Username dan Password harus diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await profile.login(emailOrUsername, password);
      if (res.success) {
        setSuccessMsg("Login berhasil! Mengalihkan ke Dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } else {
        setError(res.error || "Gagal login. Periksa email/username dan password Anda.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Sistem Muatan 3D
            </span>
          </Link>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {profile.user || profile.session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-[13px] font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <span>Buka Dashboard</span>
                <ChevronRight size={15} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsLoginOpen(true);
                }}
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-[13px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Login</span>
              </button>
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
              Muatan Kendaraan 3D
            </span>
          </h1>

          <p className="text-[#667085] text-sm font-medium leading-relaxed max-w-xl mx-auto">
            Optimalkan penempatan muatan berdasarkan kapasitas ruang kendaraan secara presisi menggunakan Algoritma Genetika 3D.
          </p>

          <div className="pt-2 flex justify-center">
            {profile.user || profile.session ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsLoginOpen(true);
                }}
                className="px-6 py-3 bg-[#087F5B] hover:bg-[#066B4D] text-white rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Masuk (Login)</span>
                <ArrowRight size={16} />
              </button>
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
          <span>&copy; {new Date().getFullYear()} Sistem Muatan 3D. All rights reserved.</span>
          <button
            onClick={() => {
              setError("");
              setSuccessMsg("");
              setIsLoginOpen(true);
            }}
            className="text-[#087F5B] font-semibold hover:underline cursor-pointer"
          >
            Portal Login Supabase
          </button>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsLoginOpen(false)}
            className="absolute inset-0 bg-[#172033]/30 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-[#E7EBF0] p-6 z-10 space-y-4">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-[#667085] hover:text-[#172033] p-1 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#172033]">Portal Login</h3>
              <p className="text-xs text-[#667085] mt-0.5">Masukkan kredensial Anda untuk masuk ke sistem.</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-[#E8F7F1] border border-[#087F5B]/30 rounded-lg text-[#087F5B] text-xs font-semibold flex items-center gap-2">
                <Check size={16} className="text-[#087F5B] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Email / Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Contoh: admin@logistic.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033]"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#087F5B] hover:bg-[#066B4D]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Login...</span>
                  </>
                ) : (
                  <span>Masuk (Login)</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
