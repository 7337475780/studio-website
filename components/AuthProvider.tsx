"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
};

type AuthContextType = {
  user: any | null;
  role: string | null;
  profile: Profile | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;

        if (!isMounted) return;
        setUser(currentUser || null);

        if (currentUser) {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("❌ Failed to fetch profile:", error.message);
          }

          if (!profileData) {
            // Insert default profile
            const { data: insertedProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: currentUser.id,
                role: "user",
                email: currentUser.email,
                username:
                  currentUser.user_metadata?.username ||
                  currentUser.email?.split("@")[0] ||
                  "User",
                full_name:
                  currentUser.user_metadata?.full_name ||
                  currentUser.email?.split("@")[0] ||
                  "User",
                avatar_url: currentUser.user_metadata?.avatar_url || null,
              })
              .select()
              .single();

            if (insertError) {
              console.error(
                "❌ Failed to insert profile:",
                insertError.message
              );
            } else {
              if (isMounted) {
                setRole(insertedProfile.role);
                setProfile(insertedProfile);
              }
            }
          } else {
            if (isMounted) {
              setRole(profileData.role);
              setProfile(profileData);
            }
          }
        }
      } catch (err) {
        console.error("❌ Unexpected error initializing profile:", err);
      }
    };

    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const newUser = session?.user || null;
        setUser(newUser);
        setRole(null);
        setProfile(null);

        if (newUser) {
          // refresh profile when user logs in
          await initUser();
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = () => supabase.auth.signInWithOAuth({ provider: "google" });
  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
