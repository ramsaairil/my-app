"use client";

import React from "react";
import Link from "next/link";
import { useSidebar } from "../context/SidebarContext";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  breadcrumbs,
  badge,
  children,
}: PageHeaderProps) {
  const { isOpen } = useSidebar();

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between z-10 flex-shrink-0 shadow-2xs">
      {/* Left Column: Breadcrumbs & Title Info */}
      <div
        className={`flex flex-col justify-center transition-all duration-300 min-w-0 ${
          !isOpen ? "pl-28 sm:pl-32" : ""
        }`}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium tracking-wide">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-700 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? "text-slate-600 font-bold"
                        : ""
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 min-w-0">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
      </div>

      {/* Right Column: Actions (buttons, etc.) */}
      {children && (
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
