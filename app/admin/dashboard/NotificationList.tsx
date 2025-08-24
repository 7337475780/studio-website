"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";
import Modal from "@/components/NotificationModal";
type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Props = {
  initialNotifications: Notification[];
  fullScreen?: boolean;
};

export default function NotificationsList({
  initialNotifications,
  fullScreen,
}: Props) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [newNotifId, setNewNotifId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setNewNotifId(payload.new.id);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Animate new notification
  useEffect(() => {
    if (!newNotifId) return;
    const elem = document.getElementById(`notif-${newNotifId}`);
    if (elem) {
      gsap.fromTo(
        elem,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
    setNewNotifId(null);
  }, [newNotifId]);

  // Mark as read
  const handleMarkRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  return (
    <div
      className={`flex flex-col bg-gray-100 dark:bg-gray-900 shadow-lg p-4 sm:p-6
        ${
          fullScreen
            ? "w-full h-full sm:rounded-none"
            : "max-h-[80vh] sm:w-96 rounded-lg"
        }
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-white bg-red-500 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </h2>
      </div>

      {/* List */}
      {sortedNotifications.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-8">
          No notifications yet.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto pr-2 hide-scrollbar space-y-2">
          {sortedNotifications.map((notif) => (
            <li
              key={notif.id}
              id={`notif-${notif.id}`}
              onClick={() => {
                if (!notif.is_read) handleMarkRead(notif.id);
                setSelectedNotification(notif);
                
              }}
              className={`flex justify-between items-start p-2 rounded-md transition-all duration-150 cursor-pointer
                ${
                  notif.is_read
                    ? "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    : "bg-blue-50 text-gray-800 dark:bg-blue-900 dark:text-blue-200 font-medium hover:bg-blue-100 dark:hover:bg-blue-800"
                }`}
            >
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="truncate text-sm">{notif.message}</p>
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>
              {!notif.is_read && (
                <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full ml-2 animate-pulse dark:bg-blue-400" />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      >
        {selectedNotification && (
          <>
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
              Notification Details
            </h2>

            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {selectedNotification.message}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {new Date(selectedNotification.created_at).toLocaleString()}
            </p>

            {fullScreen && pathname !== "/admin/dashboard" && (
              <button
                onClick={() => {
                  router.push("/admin/dashboard");
                  setSelectedNotification(null);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View in Dashboard
              </button>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
