"use client";

import React from "react";
import { useProfile } from "../context/ProfileContext";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "glass" | "badge";
  iconOnly?: boolean;
}

export default function Logo({
  className = "",
  showText = true,
  size = "md",
  variant = "default",
  iconOnly = false,
}: LogoProps) {
  // Use state context with fallback if rendered outside provider
  let initials = "L";
  let avatarColor = "bg-emerald-700";

  try {
    const profile = useProfile();
    initials = profile.initials;
    avatarColor = profile.avatarColor;
  } catch (e) {
    // Fallback if rendered outside the layout provider (e.g. testing)
  }

  // Size mapping (fully round badges)
  const badgeSizes = {
    sm: "w-8 h-8 rounded-full text-xs font-bold",
    md: "w-9 h-9 rounded-full text-sm font-bold",
    lg: "w-11 h-11 rounded-full text-base font-bold",
    xl: "w-14 h-14 rounded-full text-lg font-bold",
  };

  const titleSizes = {
    sm: "text-sm font-semibold",
    md: "text-base font-bold",
    lg: "text-lg font-bold",
    xl: "text-2xl font-extrabold",
  };

  const isDarkVariant = variant === "dark";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Icon Badge L - Made fully round and color-customizable */}
      <div
        className={`${badgeSizes[size]} ${avatarColor} relative flex items-center justify-center 
        text-white shadow-sm shadow-emerald-700/20 
        transition-all duration-300 group-hover:scale-[1.03] 
        flex-shrink-0 overflow-hidden uppercase`}
      >
        {initials}
      </div>

      {/* Logo Typography */}
      {!iconOnly && (
        <div
          className={`flex items-center gap-1.5 leading-none transition-all duration-300 origin-left overflow-hidden ${
            showText ? "opacity-100 max-w-[120px]" : "opacity-0 max-w-0 pointer-events-none"
          }`}
        >
          <span
            className={`tracking-tight ${titleSizes[size]} ${
              isDarkVariant ? "text-white" : "text-slate-900"
            }`}
          >
            Logistic
          </span>
        </div>
      )}
    </div>
  );
}
