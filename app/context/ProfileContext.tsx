"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useRouter } from "next/navigation";

interface AuthResult {
  success: boolean;
  error?: string;
  needsEmailVerification?: boolean;
}

interface ProfileContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  role: string;
  setName: (name: string) => void;
  setInitials: (initials: string) => void;
  setAvatarColor: (color: string) => void;
  login: (emailInput: string, passwordInput: string) => Promise<AuthResult>;
  register: (emailInput: string, passwordInput: string, fullNameInput: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("User Logistik");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("UL");
  const [avatarColor, setAvatarColor] = useState("bg-[#087F5B]");
  const [role, setRole] = useState("Admin Logistik");

  // Helper to extract initials from name
  const computeInitials = (fullName: string) => {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return "UL";
  };

  // Sync state from Supabase User
  const syncUserData = (currentUser: User | null) => {
    setUser(currentUser);
    if (currentUser) {
      const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      const userEmail = currentUser.email || "";
      const displayName = metaName || userEmail.split("@")[0] || "User Logistik";

      setName(displayName);
      setEmail(userEmail);
      setInitials(computeInitials(displayName));
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      syncUserData(session?.user ?? null);
      setLoading(false);
    });

    // Listen to Auth State changes realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      syncUserData(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatAuthError = (rawMsg: string): string => {
    const msg = rawMsg.toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
      return "Email atau password salah.";
    }
    if (msg.includes("user already registered") || msg.includes("already exists")) {
      return "Email tersebut sudah terdaftar. Silakan masuk.";
    }
    if (msg.includes("email not confirmed")) {
      return "Email Anda belum terverifikasi. Silakan periksa inbox email Anda.";
    }
    if (msg.includes("password should be at least")) {
      return "Password minimal 8 karakter.";
    }
    if (msg.includes("unable to validate email") || msg.includes("invalid format")) {
      return "Format email tidak valid.";
    }
    return rawMsg;
  };

  const login = async (emailInput: string, passwordInput: string): Promise<AuthResult> => {
    const cleanEmail = emailInput.trim();

    if (!cleanEmail) {
      return { success: false, error: "Email wajib diisi." };
    }
    if (!passwordInput) {
      return { success: false, error: "Password wajib diisi." };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });

      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }

      setSession(data.session);
      syncUserData(data.user);
      return { success: true };
    } else {
      // Local fallback if Supabase env vars not configured
      const displayName = cleanEmail.split("@")[0] || "User Logistik";
      setName(displayName);
      setEmail(cleanEmail);
      setInitials(computeInitials(displayName));
      return { success: true };
    }
  };

  const register = async (
    emailInput: string,
    passwordInput: string,
    fullNameInput: string
  ): Promise<AuthResult> => {
    const cleanEmail = emailInput.trim();
    const cleanName = fullNameInput.trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Nama lengkap minimal 2 karakter." };
    }
    if (!cleanEmail) {
      return { success: false, error: "Email wajib diisi." };
    }
    if (!passwordInput || passwordInput.length < 8) {
      return { success: false, error: "Password minimal 8 karakter." };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: passwordInput,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }

      if (data.session) {
        setSession(data.session);
        syncUserData(data.user);
        return { success: true };
      } else if (data.user) {
        // Confirmation email required by Supabase settings
        syncUserData(data.user);
        return { success: true, needsEmailVerification: true };
      }

      return { success: true };
    } else {
      // Local fallback
      setName(cleanName);
      setEmail(cleanEmail);
      setInitials(computeInitials(cleanName));
      return { success: true };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setName("");
    setEmail("");
    setInitials("UL");
  };

  return (
    <ProfileContext.Provider
      value={{
        user,
        session,
        loading,
        name,
        email,
        initials,
        avatarColor,
        role,
        setName,
        setInitials,
        setAvatarColor,
        login,
        register,
        logout,
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
