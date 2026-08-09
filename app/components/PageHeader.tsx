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
    <header className="h-16 bg-white border-b border-[#E7EBF0] px-6 sm:px-8 flex items-center justify-between z-10 flex-shrink-0">
      {/* Left Column: Breadcrumbs & Title Info */}
      <div
        className={`flex flex-col justify-center transition-all duration-300 min-w-0 ${
          !isOpen ? "pl-28 sm:pl-32" : ""
        }`}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#667085] font-medium tracking-tight">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#172033] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? "text-[#172033] font-semibold"
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
          <h1 className="text-lg font-bold text-[#172033] tracking-tight truncate">
            {title}
          </h1>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
      </div>

      {/* Right Column: Actions */}
      {children && (
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
