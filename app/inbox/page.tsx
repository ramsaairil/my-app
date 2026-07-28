"use client";

import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function InboxPage() {
  const [filter, setFilter] = useState<"all" | "alert" | "success" | "message-info">("all");

  const notifications = [
    { id: 1, type: "alert", title: "Keterlambatan pemuatan Dok #3 terdeteksi", desc: "TRC-204 telah berada dalam status pemuatan selama lebih dari 2 jam.", time: "10 menit yang lalu", unread: true },
    { id: 2, type: "success", title: "Manifes Keluar TRC-206 ditandatangani", desc: "Pengemudi David Chen telah berhasil berangkat ke Philadelphia.", time: "1 jam yang lalu", unread: true },
    { id: 3, type: "message", title: "Item kargo baru KRG-9823 siap dialokasikan", desc: "Paket kargo volume tinggi telah tiba. Permintaan optimasi pemuatan ekspres.", time: "3 jam yang lalu", unread: false },
    { id: 4, type: "info", title: "Pemeliharaan sistem selesai", desc: "Pencadangan database berhasil diselesaikan.", time: "1 hari yang lalu", unread: false }
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "message-info") {
      return notif.type === "message" || notif.type === "info";
    }
    return notif.type === filter;
  });

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Notifikasi Kotak Masuk"
        breadcrumbs={[
          { label: "Operasi Gudang" },
          { label: "Kotak Masuk" }
        ]}
      />

      <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-[1000px] mx-auto space-y-6">
          {/* Tab Filter System */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 border-b border-slate-100 pb-3">
            {([
              { id: "all", label: "Semua" },
              { id: "alert", label: "Peringatan" },
              { id: "success", label: "Sukses" },
              { id: "message-info", label: "Pesan & Info" }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === tab.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List of Notification cards */}
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white border rounded-xl p-5 flex gap-4 transition-all hover:shadow-md hover:-translate-y-[1px] duration-200 ${
                  notif.unread ? "border-emerald-255 bg-emerald-50/5 shadow-xs" : "border-slate-100"
                }`}
              >
                <div className={`p-2.5 rounded-xl border flex-shrink-0 self-start ${
                  notif.type === "alert"
                    ? "text-rose-600 bg-rose-50 border-rose-100"
                    : notif.type === "success"
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                    : notif.type === "info"
                    ? "text-blue-600 bg-blue-50 border-blue-100"
                    : "text-slate-600 bg-slate-50 border-slate-100"
                }`}>
                  {notif.type === "alert" ? (
                    <AlertTriangle size={18} />
                  ) : notif.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : notif.type === "info" ? (
                    <Info size={18} />
                  ) : (
                    <MessageSquare size={18} />
                  )}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-sm font-bold text-slate-850 flex items-center gap-2 truncate">
                      {notif.title}
                      {notif.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.desc}</p>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm font-medium bg-white border border-slate-100 rounded-xl">
                Tidak ada notifikasi dalam kategori ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
