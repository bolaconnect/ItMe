/**
 * useNotificationAlerts.ts
 * ────────────────────────
 * Side-effect hook: lắng nghe thay đổi unread notifications,
 * tự động gửi in-app toast + browser web push.
 *
 * Dùng DUY NHẤT 1 LẦN trong TopBar.
 */
import { useEffect, useRef } from "react";
import type { CalculatedNotif } from "../../lib/notificationsService";
import { useToast } from "./ToastNotification";
import * as webNotif from "../../lib/webNotificationService";
import type { Page } from "./MainApp";

export function useNotificationAlerts(
  notifs: CalculatedNotif[],
  unreadIds: string,
  markRead: (id: string) => void,
  onNavigate: (p: Page) => void,
) {
  const { showToast } = useToast();
  const alertedRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    // Debug log
    console.log("[Alerts] Effect fired. unreadIds:", unreadIds ? unreadIds.split(",").length + " items" : "(empty)");
    console.log("[Alerts] alertedRef size:", alertedRef.current.size);

    if (!unreadIds) {
      console.log("[Alerts] No unread IDs, skipping.");
      return;
    }

    const unread = notifs.filter((n) => !n.read);
    const fresh  = unread.filter((n) => !alertedRef.current.has(n.id));

    console.log("[Alerts] Total unread:", unread.length, "| Fresh (not alerted yet):", fresh.length);
    if (fresh.length > 0) {
      console.log("[Alerts] Fresh IDs:", fresh.map(n => n.id));
    }

    // On first load, mark all existing as "alerted" but STILL show them
    // (they are new to this session)
    if (!initializedRef.current) {
      initializedRef.current = true;
      console.log("[Alerts] First load — will alert all", fresh.length, "notifications");
    }

    if (fresh.length === 0) return;

    // Mark all as alerted immediately (prevent duplicates)
    fresh.forEach((n) => alertedRef.current.add(n.id));

    // 1. In-app toasts (staggered, max 3)
    const toastBatch = fresh.slice(0, 3);
    toastBatch.forEach((n, i) => {
      setTimeout(() => {
        console.log("[Alerts] Showing toast for:", n.title);
        showToast({
          type: n.type,
          title: n.title,
          body: n.body,
          onClick: () => { markRead(n.id); onNavigate(n.targetPage); },
        });
      }, 600 + i * 400);
    });

    // 2. Browser web push (delayed)
    if (webNotif.isEnabled()) {
      setTimeout(() => {
        const count = webNotif.sendBatch(
          fresh.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body }))
        );
        console.log("[Alerts] Web push sent:", count, "/", fresh.length);
      }, 1500);
    } else {
      console.log("[Alerts] Web push disabled, skipping browser notifications");
    }
  }, [unreadIds]); // eslint-disable-line react-hooks/exhaustive-deps
}
