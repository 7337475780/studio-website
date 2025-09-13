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

      if (error) return console.error("Fetch notifications error:", error);

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    };

    fetchNotifications();
  }, []);

  // Real-time subscription
  useEffect(() => {
    let channel = supabase.channel("notifications_channel");

    const handleInsert = (payload: any) => {
      if (!payload.new) return;
      setNotifications((prev) => {
        const updated = [
          {
            id: payload.new.id,
            type: payload.new.type,
            booking_id: payload.new.booking_id,
            message: payload.new.message,
            is_read: payload.new.is_read ?? false,
            created_at: payload.new.created_at,
          },
          ...prev,
        ];
        setUnreadCount(updated.filter((n) => !n.is_read).length);
        return updated;
      });
    };

    const handleUpdate = (payload: any) => {
      if (!payload.new) return;
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === payload.new.id
            ? { ...n, is_read: payload.new.is_read ?? false }
            : n
        );
        setUnreadCount(updated.filter((n) => !n.is_read).length);
        return updated;
      });
    };

    const subscribe = () => {
      channel = supabase.channel("notifications_channel");

      // Listen for new notifications
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        handleInsert
      );

      // Listen for read updates
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        handleUpdate
      );

      // Subscribe with callback to handle status
      channel.subscribe((status) => {
        if (
          status === "TIMED_OUT" ||
          status === "CLOSED" ||
          status === "CHANNEL_ERROR"
        ) {
          console.warn("Notifications subscription closed:", status);
          // Retry automatically
          setTimeout(subscribe, 3000);
        }
      });
    };

    subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      setUnreadCount(updated.filter((n) => !n.is_read).length);
      return updated;
    });
  };

  return (
    <NotificationsContext.Provider
      value={{ unreadCount, notifications, markAsRead, setNotifications }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
