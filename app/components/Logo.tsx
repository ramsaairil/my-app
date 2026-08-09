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
  let initials = "UL";
  let avatarColor = "bg-[#087F5B]";
  let displayName = "Sistem Muatan 3D";

  try {
    const profile = useProfile();
    if (profile.name) {
      displayName = profile.name;
    }
    if (profile.initials) {
      initials = profile.initials;
    }
    if (profile.avatarColor) {
      avatarColor = profile.avatarColor;
    }
  } catch (e) {
    // Fallback if rendered outside provider
  }

  // Size mapping (fully round badges)
  const badgeSizes = {
    sm: "w-8 h-8 rounded-full text-xs font-bold",
    md: "w-9 h-9 rounded-full text-sm font-bold",
    lg: "w-11 h-11 rounded-full text-base font-bold",
    xl: "w-14 h-14 rounded-full text-lg font-bold",
  };

  const titleSizes = {
    sm: "text-xs font-semibold",
    md: "text-sm font-bold",
    lg: "text-base font-bold",
    xl: "text-xl font-extrabold",
  };

  const isDarkVariant = variant === "dark";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Icon Badge - Displays User Initials */}
      <div
        className={`${badgeSizes[size]} ${avatarColor} relative flex items-center justify-center 
        text-white shadow-xs
        transition-all duration-300 group-hover:scale-[1.03] 
        flex-shrink-0 overflow-hidden uppercase`}
      >
        {initials}
      </div>

      {/* Logo Typography - Displays User Name */}
      {!iconOnly && (
        <div
          className={`flex items-center gap-1.5 leading-none transition-all duration-300 origin-left overflow-hidden ${
            showText ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
          }`}
        >
          <span
            className={`tracking-tight truncate ${titleSizes[size]} ${
              isDarkVariant ? "text-white" : "text-[#172033]"
            }`}
            title={displayName}
          >
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
}
