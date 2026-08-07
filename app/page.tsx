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
            {profile.user || profile.session ? (
              <Link
                href="/dashboard"
                className="px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm hover:shadow-emerald-700/20"
              >
                <span>Buka Dashboard</span>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsLoginOpen(true);
                }}
                className="px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm hover:shadow-emerald-700/20"
              >
                <span>Login</span>
              </button>
            )}
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
            Optimalkan okupansi volume kontainer, kalkulasi kubikasi volumetrik, dan kelola alokasi armada logistik secara presisi terhubung dengan Supabase.
          </p>

          <div className="pt-2 flex justify-center">
            {profile.user || profile.session ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-emerald-700/20"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsLoginOpen(true);
                }}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-emerald-700/20"
              >
                <span>Masuk (Login)</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

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
            <h3 className="text-xs font-bold text-slate-900">Database Supabase</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Kelola data kargo, armada, dan otentikasi user terhubung langsung dengan Supabase PostgreSQL.
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
            <span>&copy; {new Date().getFullYear()} Sistem Muatan 3D. Connected to Supabase Auth.</span>
          </div>

          <div>
            <button
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setIsLoginOpen(true);
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Portal Login Supabase
            </button>
          </div>
        </div>
      </footer>

      {/* Pure Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setIsLoginOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 transition-all transform scale-100">
            {/* Close Button */}
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Title */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">Portal Login</h3>
              <p className="text-xs text-slate-500 mt-0.5">Masukkan kredensial Anda untuk masuk ke sistem.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold leading-relaxed flex items-center gap-2">
                <Check size={16} className="text-emerald-700 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email / Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Contoh: admin@logistic.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                    autoFocus
                    required
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20"
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
