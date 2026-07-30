"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "./Sidebar";
import Logo from "./Logo";
import { Menu } from "lucide-react";

export default function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  // Bypass app sidebar layout for Landing Page at "/"
  if (pathname === "/") {
    return <div className="min-h-screen w-full font-sans bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-700 selection:text-white">{children}</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans relative">
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container with smooth sliding transition */}
      <div
        className={`h-full flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden fixed inset-y-0 left-0 z-50 md:relative md:z-20 shadow-2xl md:shadow-none bg-white ${
          isOpen
            ? "w-[240px] opacity-100 pointer-events-auto"
            : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative w-full min-w-0">
        {/* Floating Header with Profile Avatar & Toggle Button when sidebar is hidden */}
        {!isOpen && (
          <div className="absolute top-3 left-3 sm:left-4 z-40 flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 shadow-sm transition-all">
            <Link href="/settings" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" showText={false} />
            </Link>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button
              onClick={toggle}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all focus:outline-none cursor-pointer"
              title="Tampilkan Sidebar"
            >
              <Menu size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
