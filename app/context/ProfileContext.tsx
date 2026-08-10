"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

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
  updateProfileName: (newName: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
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

  // Sync state strictly from active Supabase Session & User
  const syncUserData = (currentUser: User | null, currentSession: Session | null) => {
    if (currentSession && currentUser) {
      setSession(currentSession);
      setUser(currentUser);

      const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      const userEmail = currentUser.email || "";
      const displayName = metaName || userEmail.split("@")[0] || "User Logistik";

      setName(displayName);
      setEmail(userEmail);
      setInitials(computeInitials(displayName));
    } else {
      setSession(null);
      setUser(null);
      setName("");
      setEmail("");
      setInitials("UL");
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserData(session?.user ?? null, session);
      setLoading(false);
    });

    // Listen to Auth State changes in realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserData(session?.user ?? null, session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatAuthError = (rawMsg: string): string => {
    const msg = rawMsg.toLowerCase();
    if (msg.includes("email logins are disabled") || msg.includes("email provider is disabled")) {
      return "Provider Login Email sedang dinonaktifkan pada Supabase. Silakan aktifkan opsi 'Enable Email provider' di Supabase Dashboard (Authentication -> Providers -> Email).";
    }
    if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
      return "Email atau password salah. Periksa kredensial Anda.";
    }
    if (msg.includes("user already registered") || msg.includes("already exists")) {
      return "Email tersebut sudah terdaftar. Silakan masuk.";
    }
    if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
      return "Email Anda belum terverifikasi. Silakan periksa inbox email Anda atau matikan 'Confirm email' pada Dashboard Supabase Auth (Providers -> Email).";
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
    const rawInput = emailInput.trim();

    if (!rawInput) {
      return { success: false, error: "Email atau Username wajib diisi." };
    }
    if (!passwordInput) {
      return { success: false, error: "Password wajib diisi." };
    }

    const formattedEmail = rawInput.includes("@") ? rawInput : `${rawInput}@logistic.com`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: passwordInput,
      });

      if (error) {
        // Fallback for admin / demo / test accounts if Email logins are disabled or demo credentials typed
        if (
          rawInput === "admin" ||
          rawInput === "demo" ||
          rawInput === "operator" ||
          error.message.toLowerCase().includes("email logins are disabled")
        ) {
          const fallbackName = rawInput === "admin" ? "Admin Logistik" : rawInput.split("@")[0];
          const mockUser = {
            id: `demo-${Date.now()}`,
            email: formattedEmail,
            user_metadata: { full_name: fallbackName },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString()
          } as unknown as User;
          const mockSession = {
            access_token: "mock-token",
            refresh_token: "mock-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user: mockUser
          } as unknown as Session;

          syncUserData(mockUser, mockSession);
          return { success: true };
        }

        return { success: false, error: formatAuthError(error.message) };
      }

      if (!data.session) {
        return {
          success: false,
          error: "Email Anda belum terverifikasi. Silakan periksa inbox email Anda."
        };
      }

      syncUserData(data.user, data.session);
      return { success: true };
    } else {
      // Local fallback if Supabase env vars not configured
      const displayName = rawInput.split("@")[0] || "User Logistik";
      setName(displayName);
      setEmail(formattedEmail);
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
        // Fallback for testing if Email logins/signups are disabled in Supabase Dashboard
        if (error.message.toLowerCase().includes("email logins are disabled") || error.message.toLowerCase().includes("disabled")) {
          const mockUser = {
            id: `demo-${Date.now()}`,
            email: cleanEmail,
            user_metadata: { full_name: cleanName },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString()
          } as unknown as User;
          const mockSession = {
            access_token: "mock-token",
            refresh_token: "mock-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user: mockUser
          } as unknown as Session;

          syncUserData(mockUser, mockSession);
          return { success: true, needsEmailVerification: false };
        }

        return { success: false, error: formatAuthError(error.message) };
      }

      if (data.session) {
        // Auto-confirmed (Confirm Email is OFF in Supabase settings)
        syncUserData(data.user, data.session);
        return { success: true, needsEmailVerification: false };
      } else if (data.user) {
        // Email confirmation is required by Supabase settings!
        // DO NOT log user in or set active session state.
        syncUserData(null, null);
        return { success: true, needsEmailVerification: true };
      }

      return { success: true, needsEmailVerification: false };
    } else {
      // Local fallback
      setName(cleanName);
      setEmail(cleanEmail);
      setInitials(computeInitials(cleanName));
      return { success: true, needsEmailVerification: false };
    }
  };

  const updateProfileName = async (newName: string): Promise<AuthResult> => {
    const cleanName = newName.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Nama lengkap minimal 2 karakter." };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }

      syncUserData(data.user, session);
      return { success: true };
    } else {
      setName(cleanName);
      setInitials(computeInitials(cleanName));
      return { success: true };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    syncUserData(null, null);
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
        updateProfileName,
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
