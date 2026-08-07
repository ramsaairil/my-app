"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useRouter } from "next/navigation";

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
  login: (emailInput: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  register: (emailInput: string, passwordInput: string, fullNameInput: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("Marcus Lee");
  const [email, setEmail] = useState("marcus.lee@logistic.com");
  const [initials, setInitials] = useState("ML");
  const [avatarColor, setAvatarColor] = useState("bg-emerald-700");
  const [role, setRole] = useState("Admin Logistik");

  // Helper to extract initials
  const computeInitials = (fullName: string) => {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return "US";
  };

  // Sync state from Supabase User
  const syncUserData = (currentUser: User | null) => {
    setUser(currentUser);
    if (currentUser) {
      const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      const userEmail = currentUser.email || "user@logistic.com";
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

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      syncUserData(session?.user ?? null);
      setLoading(false);
    });

    // Listen to Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      syncUserData(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (emailInput: string, passwordInput: string) => {
    // Standardize input if user types email or username
    const formattedEmail = emailInput.includes("@") ? emailInput.trim() : `${emailInput.trim()}@logistic.com`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: passwordInput,
      });

      if (error) {
        // Fallback check if user enters admin/demo credentials and Supabase account doesn't exist yet
        if ((error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed")) && (emailInput === "admin" || emailInput === "demo")) {
          const fallbackName = emailInput === "admin" ? "Admin Logistik" : "Operator Logistik";
          setName(fallbackName);
          setEmail(`${emailInput}@logistic.com`);
          setInitials(computeInitials(fallbackName));
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      setSession(data.session);
      syncUserData(data.user);
      return { success: true };
    } else {
      const displayName = emailInput.split("@")[0];
      setName(displayName);
      setEmail(formattedEmail);
      setInitials(computeInitials(displayName));
      return { success: true };
    }
  };

  const register = async (emailInput: string, passwordInput: string, fullNameInput: string) => {
    const formattedEmail = emailInput.includes("@") ? emailInput.trim() : `${emailInput.trim()}@logistic.com`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: formattedEmail,
        password: passwordInput,
        options: {
          data: {
            full_name: fullNameInput.trim() || emailInput.split("@")[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        syncUserData(data.user);
      } else if (data.user) {
        // User created, confirmation email might be required or auto-confirmed
        syncUserData(data.user);
      }
      return { success: true };
    } else {
      const displayName = fullNameInput || emailInput.split("@")[0];
      setName(displayName);
      setEmail(formattedEmail);
      setInitials(computeInitials(displayName));
      return { success: true };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setName("Guest User");
    setInitials("GU");
    router.push("/");
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

