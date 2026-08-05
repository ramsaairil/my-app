"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Truck,
  Settings,
  ChevronLeft,
  Layers,
  Sparkles
} from "lucide-react";
import Logo from "./Logo";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  const navigationItems: { id: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; href: string; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "optimasi", label: "Optimasi 3D", icon: Layers, href: "/optimasi" },
    { id: "cargo", label: "Data Muatan", icon: Package, href: "/cargo" },
    { id: "fleet", label: "Operasional Armada", icon: Truck, href: "/trucks" },
  ];

  return (
    <aside className="w-full flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-full z-20 relative shadow-sm">
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 transition-all duration-300">
        <Link href="/settings" className="hover:opacity-90 transition-opacity flex-shrink-0">
          <Logo size="sm" showText={isOpen} />
        </Link>
        <button
          onClick={toggle}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer hidden md:block transition-all duration-300 origin-right ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none w-0 p-0 overflow-hidden"
          }`}
          title="Sembunyikan Menu"
        >
          <ChevronLeft size={18} className="flex-shrink-0" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-6 space-y-1.5 overflow-y-auto custom-scrollbar flex flex-col items-stretch transition-all duration-300 ${isOpen ? "px-3" : "px-2.5"}`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) || (item.id === "dashboard" && pathname.startsWith("/overview"));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full h-11 flex items-center rounded-xl transition-all duration-200 group relative ${
                isOpen ? "px-3 gap-3" : "px-3 justify-center gap-0"
              } ${
                isActive
                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100/60 text-emerald-900 font-bold shadow-xs border border-emerald-200/60"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-600 rounded-r-full shadow-xs" />
              )}
              <Icon
                size={20}
                className={`transition-transform duration-200 flex-shrink-0 ${
                  isActive ? "text-emerald-700 scale-105" : "text-slate-400 group-hover:text-slate-700 group-hover:scale-105"
                }`}
              />
              <span
                className={`text-xs select-none truncate transition-all duration-300 origin-left flex items-center justify-between flex-1 ${
                  isOpen ? "opacity-100 max-w-[160px] ml-0" : "opacity-0 max-w-0 overflow-hidden pointer-events-none ml-0"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings */}
      <div className={`p-3 border-t border-slate-100 flex items-stretch transition-all duration-300 ${isOpen ? "px-3" : "px-2.5"}`}>
        <Link
          href="/settings"
          className={`w-full h-11 flex items-center rounded-xl transition-all duration-200 group ${
            isOpen ? "px-3 gap-3" : "px-3 justify-center gap-0"
          } ${
            pathname.startsWith("/settings")
              ? "bg-gradient-to-r from-emerald-50 to-emerald-100/60 text-emerald-900 font-bold shadow-xs border border-emerald-200/60"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
          }`}
          title="Pengaturan"
        >
          <Settings
            size={20}
            className={`transition-colors duration-200 flex-shrink-0 ${
              pathname.startsWith("/settings") ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-700"
            }`}
          />
          <span
            className={`text-xs select-none truncate transition-all duration-300 origin-left ${
              isOpen ? "opacity-100 max-w-[150px] ml-0" : "opacity-0 max-w-0 overflow-hidden pointer-events-none ml-0"
            }`}
          >
            Pengaturan
          </span>
        </Link>
      </div>
    </aside>
  );
}
