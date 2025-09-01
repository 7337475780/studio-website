"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthContextType = {
  user: any | null;
  role: string | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  // Initialize user session
  useEffect(() => {
    const initUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;
      setUser(currentUser || null);

      if (currentUser) {
        try {
          // Check if profile exists
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows found
            console.error("Failed to fetch profile:", error.message);
          }

          if (!profile) {
            // Insert default profile
            const { data: insertedProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: currentUser.id,
                role: "user",
                email: currentUser.email,
                username: currentUser.user_metadata?.full_name || "User",
              })
              .select()
              .single();

            if (insertError)
              console.error("Failed to insert profile:", insertError);
            else setRole(insertedProfile.role);
          } else {
            setRole(profile.role);
          }
        } catch (err) {
          console.error("Unexpected error initializing profile:", err);
        }
      }
    };

    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setRole(null); // Reset role on logout
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = () => supabase.auth.signInWithOAuth({ provider: "google" });
  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
