import React, { useEffect, useRef } from "react";
import { getUnreadCount, getNotifications } from "@/api/client";
import {
  publish,
  NOTIFICATION_UNREAD_EVENT,
  NOTIFICATION_LIST_EVENT,
} from "@/lib/pubsub";

/**
 * NotificationsProvider
 * Acts as a Subject in the Observer pattern. Periodically polls the backend
 * for unread count (and optionally the list) then publishes events consumed by
 * any Observer components (e.g., NotificationBell) without those components
 * managing their own polling timers.
 */
export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
  intervalMs?: number;
  fetchListOnInterval?: boolean;
}> = ({ children, intervalMs = 30000, fetchListOnInterval = false }) => {
  const timerRef = useRef<number | null>(null);
  const visibilityRef = useRef(document.visibilityState);

  const poll = async () => {
    try {
      const unread = await getUnreadCount();
      publish(NOTIFICATION_UNREAD_EVENT, unread.unread_count);

      if (fetchListOnInterval) {
        const list = await getNotifications(50);
        publish(NOTIFICATION_LIST_EVENT, list);
      }
    } catch (err) {
      console.error("NotificationsProvider poll error:", err);
    }
  };

  useEffect(() => {
    // Initial poll
    poll();

    const handleVisibility = () => {
      const state = document.visibilityState;
      visibilityRef.current = state;
      if (state === "visible") {
        poll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    timerRef.current = window.setInterval(() => {
      if (visibilityRef.current === "visible") {
        poll();
      }
    }, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [intervalMs, fetchListOnInterval]);

  return <>{children}</>;
};
