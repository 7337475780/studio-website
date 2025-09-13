"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Notification {
  id: string;
  type: string;
  booking_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  unreadCount: number;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  notifications: [],
  markAsRead: () => {},
  setNotifications: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return console.error("Fetch error:", error);

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    };

    fetchNotifications();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          if (!payload.new) return;

          const newNotif: Notification = {
            id: payload.new.id,
            type: payload.new.type,
            booking_id: payload.new.booking_id,
            message: payload.new.message,
            is_read: payload.new.is_read ?? false, // default if null
            created_at: payload.new.created_at,
          };

          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      );

    const subscription = channel.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  };

  return (
    <NotificationsContext.Provider
      value={{ unreadCount, notifications, markAsRead, setNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
