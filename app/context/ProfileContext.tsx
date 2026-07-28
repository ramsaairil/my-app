"use client";

import React, { createContext, useContext, useState } from "react";

interface ProfileContextType {
  name: string;
  initials: string;
  avatarColor: string;
  setName: (name: string) => void;
  setInitials: (initials: string) => void;
  setAvatarColor: (color: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("Marcus Lee");
  const [initials, setInitials] = useState("ML");
  const [avatarColor, setAvatarColor] = useState("bg-emerald-700");

  return (
    <ProfileContext.Provider
      value={{
        name,
        initials,
        avatarColor,
        setName,
        setInitials,
        setAvatarColor,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
