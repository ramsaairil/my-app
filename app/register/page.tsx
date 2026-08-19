"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../context/ProfileContext";
import { Box, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useProfile();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setNeedsVerification(false);

    // Client-side validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Nama lengkap wajib diisi (minimal 2 karakter).");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Format email tidak valid.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register(email, password, fullName);
      if (res.success) {
        if (res.needsEmailVerification) {
          setNeedsVerification(true);
          setSuccessMessage("Registrasi berhasil. Silakan cek email Anda untuk memverifikasi akun.");
        } else {
          setSuccessMessage("Registrasi berhasil. Mengalihkan ke Dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        }
      } else {
        setError(res.error || "Gagal melakukan pendaftaran.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] font-sans antialiased flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#087F5B] flex items-center justify-center text-white font-bold">
              <Box size={22} />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#172033]">
              SISTEM MUATAN 3D
            </span>
          </Link>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 sm:p-8 shadow-xs space-y-5">
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#172033]">Buat Akun</h1>
            <p className="text-xs text-[#667085]">
              Daftar untuk mulai menggunakan Sistem Muatan 3D.
            </p>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Inline Success Alert */}
          {successMessage && (
            <div className="p-4 bg-[#E8F7F1] border border-[#087F5B]/30 rounded-lg text-[#087F5B] text-xs font-semibold space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#087F5B]" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
              {needsVerification && (
                <div className="pt-2 border-t border-[#087F5B]/20">
                  <Link
                    href="/login"
                    className="w-full py-2 px-3 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Masuk ke Halaman Login</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {!needsVerification && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field: Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder=""
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Field: Email */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan Email"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                    required
                  />
                </div>
              </div>

              {/* Field: Password */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#667085] hover:text-[#172033] cursor-pointer"
                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Field: Konfirmasi Password */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#667085] pointer-events-none">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                    <span>⏳ Memproses...</span>
                  </>
                ) : (
                  <span>Daftar</span>
                )}
              </button>

            </form>
          )}

          {/* Footer Link */}
          <div className="pt-2 text-center text-xs text-[#667085]">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#087F5B] hover:underline"
            >
              Masuk
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
