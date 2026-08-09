"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../context/ProfileContext";
import { Box, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error || "Gagal masuk. Periksa email dan password Anda.");
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
            <h1 className="text-xl font-bold text-[#172033]">Masuk</h1>
            <p className="text-xs text-[#667085]">
              Masukkan email dan password akun Anda.
            </p>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
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
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                  autoFocus
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
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
                <span>Masuk</span>
              )}
            </button>

          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center text-xs text-[#667085]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#087F5B] hover:underline"
            >
              Daftar
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
