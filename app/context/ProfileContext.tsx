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

const LOGISTIC_SESSION_KEY = "LOGISTIC_SESSION_V1";

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

  // Sync state strictly from active Supabase Session & User and save to storage
  const syncUserData = (currentUser: User | null, currentSession: Session | null) => {
    if (currentSession && currentUser) {
      setSession(currentSession);
      setUser(currentUser);

      const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      const userEmail = currentUser.email || "";
      const displayName = metaName || (userEmail.includes("@") ? userEmail.split("@")[0] : userEmail) || "User Logistik";

      setName(displayName);
      setEmail(userEmail);
      setInitials(computeInitials(displayName));

      try {
        localStorage.setItem(LOGISTIC_SESSION_KEY, JSON.stringify(currentSession));
      } catch (e) {
        // Ignore storage error
      }
    } else {
      setSession(null);
      setUser(null);
      setName("");
      setEmail("");
      setInitials("UL");
      try {
        localStorage.removeItem(LOGISTIC_SESSION_KEY);
      } catch (e) {
        // Ignore storage error
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      let activeSession: Session | null = null;
      let activeUser: User | null = null;

      // 1. Try fetching session from Supabase Client first
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data && data.session) {
            activeSession = data.session;
            activeUser = data.session.user;
          }
        } catch (e) {
          console.error("Error checking Supabase session", e);
        }
      }

      // 2. If Supabase client did not return a session, check local storage persistence fallback
      if (!activeSession) {
        try {
          const storedSessionStr = localStorage.getItem(LOGISTIC_SESSION_KEY);
          if (storedSessionStr) {
            const parsedSession = JSON.parse(storedSessionStr);
            if (parsedSession && parsedSession.user) {
              activeSession = parsedSession as Session;
              activeUser = parsedSession.user as User;
            }
          }
        } catch (e) {
          console.error("Error reading saved session from storage", e);
        }
      }

      if (mounted) {
        syncUserData(activeUser, activeSession);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to Auth state changes in real-time
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          // Check if session key still exists in localStorage before wiping
          const stored = localStorage.getItem(LOGISTIC_SESSION_KEY);
          if (!stored) {
            syncUserData(null, null);
            setLoading(false);
          }
        } else if (newSession) {
          syncUserData(newSession.user, newSession);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
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
      // Supabase tidak dikonfigurasi — tolak login
      return { success: false, error: "Sistem autentikasi belum dikonfigurasi. Hubungi administrator." };
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

      if (data.user) {
        // Derive username from email prefix (e.g. "ramsa" from "ramsa@gmail.com")
        const username = cleanEmail.split("@")[0];
        // Insert user data into public.users table.
        // NOTE: password kolom diisi placeholder — password asli dikelola aman oleh Supabase Auth (auth.users).
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          username: username,
          password: "managed_by_supabase_auth",
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          // Log error but do not block registration — auth.users sudah tersimpan
          console.error("Gagal insert ke public.users:", insertError.message);
        }
      }

      if (data.session) {
        // Auto-confirmed (Confirm Email is OFF in Supabase settings)
        syncUserData(data.user, data.session);
        return { success: true, needsEmailVerification: false };
      } else if (data.user) {
        // Email confirmation is required by Supabase settings
        syncUserData(null, null);
        return { success: true, needsEmailVerification: true };
      }

      return { success: true, needsEmailVerification: false };
    } else {
      // Supabase tidak dikonfigurasi — tolak registrasi
      return { success: false, error: "Sistem autentikasi belum dikonfigurasi. Hubungi administrator." };
    }
  };

  const updateProfileName = async (newName: string): Promise<AuthResult> => {
    const cleanName = newName.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Nama lengkap minimal 2 karakter." };
    }

    if (isSupabaseConfigured && supabase && session && !session.access_token.startsWith("mock-") && !session.access_token.startsWith("local-")) {
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
      const updatedUser = user ? {
        ...user,
        user_metadata: { ...user.user_metadata, full_name: cleanName }
      } as User : null;
      syncUserData(updatedUser, session);
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(LOGISTIC_SESSION_KEY);
    } catch (e) {
      // Ignore
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore signout error if session was local
      }
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
