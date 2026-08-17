"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useProfile } from "../context/ProfileContext";
import Sidebar from "./Sidebar";
import Logo from "./Logo";
import { Menu } from "lucide-react";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const PROTECTED_ROUTES = ["/dashboard", "/cargo", "/trucks", "/optimasi", "/simulasi", "/settings"];

export default function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebar();
  const { user, session, loading } = useProfile();

  const isAuthenticated = Boolean(session && session.user);

  useEffect(() => {
    if (loading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (!isAuthenticated && isProtectedRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isAuthPage) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, pathname, router]);

  // Loading state while checking Supabase session
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#667085]">Memuat sesi...</span>
        </div>
      </div>
    );
  }

  // Bypass sidebar layout for public pages: "/", "/login", "/register"
  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen w-full font-sans bg-[#F8FAFC] text-[#172033] antialiased selection:bg-[#087F5B] selection:text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans relative">
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-[#172033]/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <div
        className={`h-full flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden fixed inset-y-0 left-0 z-50 md:relative md:z-20 bg-white ${isOpen
            ? "w-[230px] opacity-100 pointer-events-auto border-r border-[#E7EBF0]"
            : "w-0 opacity-0 pointer-events-none"
          }`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative w-full min-w-0">
        {/* Floating Header button when sidebar is collapsed */}
        {!isOpen && (
          <div className="absolute top-3 left-3 sm:left-4 z-40 flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-[#E7EBF0] shadow-xs transition-all">
            <Link href="/settings" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" showText={false} />
            </Link>
            <div className="h-4 w-[1px] bg-[#E7EBF0]" />
            <button
              onClick={toggle}
              className="p-1 rounded-md text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC] transition-all focus:outline-none cursor-pointer"
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
