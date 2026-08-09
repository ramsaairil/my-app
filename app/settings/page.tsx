"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "../context/ProfileContext";
import { LogOut, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, name, email, initials, updateProfileName, logout } = useProfile();

  const [formName, setFormName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // Dynamic user data sync from Supabase user_metadata
  useEffect(() => {
    const activeName = user?.user_metadata?.full_name || name || "";
    setFormName(activeName);
  }, [user, name]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formName.trim().length < 2) {
      showToast("Nama lengkap minimal 2 karakter.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfileName(formName.trim());
      if (res.success) {
        showToast("Profil berhasil diperbarui.", "success");
      } else {
        showToast(res.error || "Gagal memperbarui profil.", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    showToast("Anda telah keluar dari akun.", "success");
    setTimeout(async () => {
      await logout();
    }, 600);
  };

  const displayEmail = user?.email || email || "";
  const displayName = formName || name || displayEmail.split("@")[0] || "User";

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">
      
      {/* Toast Feedback */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border backdrop-blur-md transition-all shadow-md ${
            toast.type === "success"
              ? "bg-[#E8F7F1] border-[#087F5B]/30 text-[#087F5B]"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-[#087F5B] shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Main Page Container */}
      <div className="flex-grow overflow-y-auto p-7 sm:p-9 custom-scrollbar">
        <div className="max-w-[720px] mx-auto space-y-7">
          
          {/* Header */}
          <div className="pb-4 border-b border-[#E7EBF0]">
            <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
              Profil
            </h1>
            <p className="text-[14px] text-[#667085] mt-1">
              Kelola informasi akun Anda.
            </p>
          </div>

          {/* Top Profile Summary Card */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#087F5B] flex items-center justify-center text-white text-2xl font-bold tracking-wider uppercase shadow-xs">
              {initials}
            </div>
            <h2 className="text-lg font-bold text-[#172033]">{displayName}</h2>
          </div>

          {/* Section 1: Informasi Akun */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-[#172033] border-b border-[#E7EBF0] pb-3">
              Informasi Akun
            </h3>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg focus:outline-none focus:border-[#087F5B] focus:bg-white text-[#172033] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={displayEmail}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg text-[#667085] font-medium cursor-not-allowed select-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs ${
                    isSaving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Akun & Sesi */}
          <div className="bg-white border border-[#E7EBF0] rounded-xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-[#172033] border-b border-[#E7EBF0] pb-3">
              Akun & Sesi
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#172033]">Keluar dari Portal Operasi</h4>
                <p className="text-[12px] text-[#667085] mt-0.5">Akhiri sesi Supabase Auth Anda.</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold transition-all cursor-pointer self-start sm:self-center"
              >
                <LogOut size={14} />
                <span>Keluar Sesi</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
