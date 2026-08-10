"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Layers,
  BarChart3,
  Settings,
  ChevronLeft
} from "lucide-react";
import Logo from "./Logo";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "cargo", label: "Data Barang", icon: Package, href: "/cargo" },
    { id: "fleet", label: "Data Kendaraan", icon: Truck, href: "/trucks" },
    { id: "optimasi", label: "Optimasi 3D", icon: Layers, href: "/optimasi" },
    { id: "simulasi", label: "Simulasi Kombinasi", icon: BarChart3, href: "/simulasi" },
  ];

  return (
    <aside className="w-full flex-shrink-0 bg-white border-r border-[#E7EBF0] flex flex-col h-full z-20 relative select-none">
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E7EBF0]/60 transition-all duration-300">
        <Link href="/dashboard" className="hover:opacity-90 transition-opacity flex-shrink-0">
          <Logo size="sm" showText={isOpen} />
        </Link>
        <button
          onClick={toggle}
          className={`p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] cursor-pointer hidden md:block transition-all duration-300 ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none w-0 p-0 overflow-hidden"
          }`}
          title="Sembunyikan Menu"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-5 space-y-1 overflow-y-auto custom-scrollbar flex flex-col items-stretch transition-all duration-300 ${isOpen ? "px-3" : "px-2"}`}>
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
              className={`w-full h-[42px] flex items-center rounded-lg transition-all duration-150 group relative ${
                isOpen ? "px-3 gap-3" : "px-3 justify-center gap-0"
              } ${
                isActive
                  ? "bg-[#E8F7F1] text-[#087F5B] font-semibold"
                  : "text-[#667085] hover:bg-[#F8FAFC] hover:text-[#172033] font-medium"
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#087F5B] rounded-r-full" />
              )}
              <Icon
                size={18}
                className={`transition-colors duration-150 flex-shrink-0 ${
                  isActive ? "text-[#087F5B]" : "text-[#667085] group-hover:text-[#172033]"
                }`}
              />
              <span
                className={`text-[13px] tracking-tight truncate transition-all duration-200 origin-left flex-1 ${
                  isOpen ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings Item */}
      <div className={`p-3 border-t border-[#E7EBF0]/60 flex items-stretch transition-all duration-300 ${isOpen ? "px-3" : "px-2"}`}>
        <Link
          href="/settings"
          className={`w-full h-[42px] flex items-center rounded-lg transition-all duration-150 group relative ${
            isOpen ? "px-3 gap-3" : "px-3 justify-center gap-0"
          } ${
            pathname.startsWith("/settings")
              ? "bg-[#E8F7F1] text-[#087F5B] font-semibold"
              : "text-[#667085] hover:bg-[#F8FAFC] hover:text-[#172033] font-medium"
          }`}
          title="Pengaturan"
        >
          {pathname.startsWith("/settings") && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#087F5B] rounded-r-full" />
          )}
          <Settings
            size={18}
            className={`transition-colors duration-150 flex-shrink-0 ${
              pathname.startsWith("/settings") ? "text-[#087F5B]" : "text-[#667085] group-hover:text-[#172033]"
            }`}
          />
          <span
            className={`text-[13px] tracking-tight truncate transition-all duration-200 origin-left ${
              isOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0 overflow-hidden pointer-events-none"
            }`}
          >
            Pengaturan
          </span>
        </Link>
      </div>
    </aside>
  );
}
