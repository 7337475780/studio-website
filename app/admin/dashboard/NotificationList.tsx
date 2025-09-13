"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  useNotifications,
  Notification,
} from "@/components/NotificationProvider";
import { gsap } from "gsap";
import Modal from "@/components/NotificationModal";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  fullScreen?: boolean;
};

export default function NotificationsList({ fullScreen }: Props) {
  const { notifications, markAsRead } = useNotifications();
  const [newNotifId, setNewNotifId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Animate new notification
  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0];
    if (latest.id === newNotifId) return;
    setNewNotifId(latest.id);

    const elem = document.getElementById(`notif-${latest.id}`);
    if (elem) {
      gsap.fromTo(
        elem,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [notifications]);

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
        }`}
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
        <ul className="flex-1 overflow-y-auto max-h-[70vh] pr-2 hide-scrollbar space-y-2">
          {sortedNotifications.map((notif) => (
            <li
              key={notif.id}
              id={`notif-${notif.id}`}
              onClick={() => {
                if (!notif.is_read) markAsRead(notif.id);
                setSelectedNotification(notif);
              }}
              className={`flex justify-between items-start p-2 rounded-md transition-all duration-150 cursor-pointer border-l-4
                ${
                  notif.is_read
                    ? "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-l-transparent"
                    : "bg-blue-50 text-gray-800 dark:bg-blue-900 dark:text-blue-200 font-medium hover:bg-blue-100 dark:hover:bg-blue-800 border-l-blue-500"
                }`}
            >
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="truncate text-sm">{notif.message}</p>
                <span className="text-xs text-gray-400 dark:text-gray-400 sm:text-sm">
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
