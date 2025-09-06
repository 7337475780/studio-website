"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import Cookies from "js-cookie";

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
  profile: Profile | null;
  role: string | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(
    () => Cookies.get("role") || null
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (currentUser: any) => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!isMounted) return;

      if (!profileData) {
        // Insert default profile
        const { data: insertedProfile } = await supabase
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
            avatar_url:
              currentUser.user_metadata?.avatar_url ||
              currentUser.user_metadata?.picture ||
              null,
          })
          .select()
          .single();

        setProfile(insertedProfile || null);
        setRole(insertedProfile?.role || "user");
        Cookies.set("role", insertedProfile?.role || "user");
      } else {
        setProfile({
          ...profileData,
          avatar_url:
            profileData.avatar_url ||
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            null,
        });
        setRole(profileData.role);
        Cookies.set("role", profileData.role);
      }
    };

    const initUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user || null;
      if (!isMounted) return;

      setUser(currentUser);
      if (currentUser) await fetchProfile(currentUser);
    };

    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const newUser = session?.user || null;
        setUser(newUser);

        if (newUser) await fetchProfile(newUser);
        else {
          setProfile(null);
          setRole(null);
          Cookies.remove("role");
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
    setUser(null);
    setProfile(null);
    setRole(null);
    Cookies.remove("role");
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
