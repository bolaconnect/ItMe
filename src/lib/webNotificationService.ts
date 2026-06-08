/**
 * webNotificationService.ts
 * ─────────────────────────
 * Browser Notification API wrapper.
 * Chỉ chịu trách nhiệm: gửi notification qua browser, quản lý permission, dedup.
 */

const PREF_KEY  = "itme_web_notif_enabled";
const SENT_KEY  = "itme_web_notif_sent";
const CLEAR_KEY = "itme_web_notif_last_clear";

/* ── Helpers ── */

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSentIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SENT_KEY) || "[]"); }
  catch { return []; }
}

function addSentId(id: string) {
  const ids = [...getSentIds(), id].slice(-200);
  localStorage.setItem(SENT_KEY, JSON.stringify(ids));
}

/** Reset sent log mỗi ngày mới */
function resetSentIdsDaily() {
  const today = localToday();
  if (localStorage.getItem(CLEAR_KEY) !== today) {
    localStorage.removeItem(SENT_KEY);
    localStorage.setItem(CLEAR_KEY, today);
  }
}

/* ── Public: Support check ── */

export function isSupported(): boolean {
  return "Notification" in window;
}

/* ── Public: Permission ── */

export function getPermission(): NotificationPermission | "unsupported" {
  return isSupported() ? Notification.permission : "unsupported";
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return "denied";
  return Notification.requestPermission();
}

/* ── Public: User preference ── */

export function isEnabled(): boolean {
  return localStorage.getItem(PREF_KEY) === "true";
}

export function setEnabled(on: boolean) {
  localStorage.setItem(PREF_KEY, String(on));
  if (on) localStorage.removeItem(SENT_KEY); // fresh start
}

/* ── Public: Send notification ── */

const URGENCY: Record<string, string> = {
  overdue:  "🔴 Khẩn cấp",
  upcoming: "🟡 Quan trọng",
  event:    "🔵 Sự kiện",
  habit:    "🟣 Thói quen",
};

export interface NotifPayload {
  id: string;
  type: string;
  title: string;
  body: string;
}

/**
 * Gửi 1 browser notification. Trả `true` nếu thực sự gửi được.
 * Tự bỏ qua nếu: không hỗ trợ, chưa cho phép, đã gửi rồi.
 */
export function send(notif: NotifPayload): boolean {
  if (!isSupported() || !isEnabled() || Notification.permission !== "granted") return false;
  if (getSentIds().includes(notif.id)) return false;

  try {
    const tag = URGENCY[notif.type] || "";
    const n = new Notification(notif.title, {
      body: `${tag}\n${notif.body}`,
      icon: "/ItMe/icon.png",
      tag: notif.id,
      requireInteraction: notif.type === "overdue",
    });
    if (notif.type !== "overdue") setTimeout(() => n.close(), 8000);
    n.onclick = () => { window.focus(); n.close(); };
    addSentId(notif.id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gửi hàng loạt. Reset daily trước khi gửi.
 * Trả số lượng notification đã thực sự gửi.
 */
export function sendBatch(notifs: NotifPayload[]): number {
  if (!isSupported() || !isEnabled() || Notification.permission !== "granted") return 0;
  resetSentIdsDaily();
  let count = 0;
  for (const n of notifs) { if (send(n)) count++; }
  return count;
}

/** Gửi notification test (luôn unique tag) */
export function sendTest(): boolean {
  if (!isSupported() || Notification.permission !== "granted") return false;
  try {
    const n = new Notification("ItMe — Thông báo thử", {
      body: "🎉 Thông báo đẩy hoạt động tốt!",
      icon: "/ItMe/icon.png",
      tag: `test-${Date.now()}`,
    });
    setTimeout(() => n.close(), 6000);
    n.onclick = () => { window.focus(); n.close(); };
    return true;
  } catch { return false; }
}
