"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Truck,
  Inbox,
  User,
  Settings,
  ChevronLeft,
  Layers
} from "lucide-react";
import Logo from "./Logo";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();

  const navigationItems = [
    { id: "overview", label: "Dashboard", icon: Home, href: "/overview" },
    { id: "cargo", label: "Cargo Database", icon: Package, href: "/cargo" },
    { id: "optimasi", label: "3D Visualizer", icon: Layers, href: "/optimasi" },
    { id: "fleet", label: "Fleet Operations", icon: Truck, href: "/trucks" },
    { id: "messages", label: "Messages & Alerts", icon: Inbox, href: "/inbox" },
    { id: "profile", label: "Profile Settings", icon: User, href: "/profile" },
  ] as { id: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; href: string; badge?: string }[];

  return (
    <aside className="w-full flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-full z-20 relative">
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-50 transition-all duration-300">
        <Link href="/profile" className="hover:opacity-90 transition-opacity flex-shrink-0">
          <Logo size="sm" showText={isOpen} />
        </Link>
        <button
          onClick={toggle}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer hidden md:block transition-all duration-300 origin-right ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none w-0 p-0 overflow-hidden"
          }`}
          title="Sembunyikan Menu"
        >
          <ChevronLeft size={18} className="flex-shrink-0" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-6 space-y-3 overflow-y-auto custom-scrollbar flex flex-col items-stretch transition-all duration-300 ${isOpen ? "px-4" : "px-3"}`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full h-11 flex items-center rounded-xl transition-all duration-300 group ${
                isOpen 
                  ? "px-3 gap-3" 
                  : "px-[14px] gap-0"
              } ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
              title={item.label}
            >
              <Icon
                size={20}
                className={`transition-colors duration-200 flex-shrink-0 ${
                  isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span
                className={`text-sm select-none truncate transition-all duration-300 origin-left ${
                  isOpen ? "opacity-100 max-w-[150px] ml-0" : "opacity-0 max-w-0 overflow-hidden pointer-events-none ml-0"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom / Settings (Moved here replacing Logout) */}
      <div className={`p-3 border-t border-slate-50 flex items-stretch transition-all duration-300 ${isOpen ? "px-4" : "px-3"}`}>
        <Link
          href="/settings"
          className={`w-full h-11 flex items-center rounded-xl transition-all duration-300 group ${
            isOpen 
              ? "px-3 gap-3" 
              : "px-[14px] gap-0"
          } ${
            pathname.startsWith("/settings")
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
          title="Pengaturan"
        >
          <Settings
            size={20}
            className={`transition-colors duration-200 flex-shrink-0 ${
              pathname.startsWith("/settings") ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
          <span
            className={`text-sm select-none truncate transition-all duration-300 origin-left ${
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
