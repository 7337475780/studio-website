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
  profile: any | null; // full profile including avatar, full_name, phone
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;
      setUser(currentUser || null);

      if (currentUser) {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Failed to fetch profile:", error.message);
          }

          if (!profileData) {
            // Insert default profile including avatar_url and full_name
            const { data: insertedProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: currentUser.id,
                role: "user",
                email: currentUser.email,
                username: currentUser.user_metadata?.username || "User",
                full_name: currentUser.user_metadata?.full_name || "User",
                avatar_url: currentUser.user_metadata?.avatar_url || null,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Failed to insert profile:", insertError);
            } else {
              setRole(insertedProfile.role);
              setProfile(insertedProfile);
            }
          } else {
            setRole(profileData.role);
            setProfile(profileData);
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
        setRole(null);
        setProfile(null); // reset profile on logout
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = () => supabase.auth.signInWithOAuth({ provider: "google" });
  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
