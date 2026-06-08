/**
 * notificationsService.ts
 * ───────────────────────
 * PURE DATA HOOK — tính toán danh sách thông báo từ tasks, events, habits.
 * Không có side-effect (không gửi web push, không hiện toast).
 */
import { useState, useEffect, useMemo } from "react";
import { subscribeTasks } from "./tasksService";
import { subscribeEvents } from "./eventsService";
import { subscribeHabits } from "./habitsService";
import { subscribeGoals } from "./goalsService";
import { getUpcomingLunarEvents } from "../app/utils/lunarCalendar";
import { AlertTriangle, Clock, Calendar, Flame, Target } from "lucide-react";
import type { Task } from "../app/components/tasks/taskData";
import type { CalEvent, Habit } from "../app/store/useAppStore";
import type { Goal } from "./goalsService";

/* ── Types ── */

export interface CalculatedNotif {
  id: string;
  type: "overdue" | "upcoming" | "event" | "habit";
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  timestamp: number;
  targetPage: "tasks" | "events" | "habits" | "goals";
}

/* ── Helpers ── */

/** Local date YYYY-MM-DD (đúng timezone người dùng) */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ── Hook ── */

export function useCalculatedNotifications(uid: string | undefined) {
  /* ─ Source data ─ */
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals]   = useState<Goal[]>([]);

  /* ─ Read / Dismissed state (persisted) ─ */
  const [readIds, setReadIds]         = useState<string[]>(() => safeJsonParse("itme_read_notif_ids", []));
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => safeJsonParse("itme_dismissed_notif_ids", []));

  /* ─ Ticking clock to trigger updates dynamically ─ */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Firestore realtime listeners
  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      subscribeTasks(uid, setTasks),
      subscribeEvents(uid, setEvents),
      subscribeHabits(uid, setHabits),
      subscribeGoals(uid, setGoals),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [uid]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem("itme_read_notif_ids", JSON.stringify(readIds)); }, [readIds]);
  useEffect(() => { localStorage.setItem("itme_dismissed_notif_ids", JSON.stringify(dismissedIds)); }, [dismissedIds]);

  /* ─ Computed notifications (memoized) ─ */
  const notifs = useMemo<CalculatedNotif[]>(() => {
    const list: CalculatedNotif[] = [];
    const now     = new Date();
    const today   = localToday();
    const nowMs   = now.getTime();

    // Debug: show raw data counts
    console.log(`[NotifService] Computing... tasks: ${tasks.length}, events: ${events.length}, habits: ${habits.length}`);
    console.log(`[NotifService] readIds: ${readIds.length}, dismissedIds: ${dismissedIds.length}`);

    // ── Tasks ──
    for (const task of tasks) {
      if (!task.title || task.done || !task.dueDate) continue;
      const dueMs = Date.parse(`${task.dueDate}T${task.dueTime || "23:59"}:00`);
      if (isNaN(dueMs)) continue;
      const diffH = (dueMs - nowMs) / 3_600_000;

      if (diffH < 0) {
        const id = `task-overdue-${task.id}-${task.dueDate}-${task.dueTime || "23:59"}`;
        if (dismissedIds.includes(id)) { console.log(`[NotifService] SKIP dismissed: ${id}`); continue; }
        
        const absDiffH = Math.abs(diffH);
        let time = "";
        if (absDiffH < 1) {
          const mins = Math.max(1, Math.round(absDiffH * 60));
          time = `${mins} phút trước`;
        } else if (absDiffH < 24) {
          const hours = Math.round(absDiffH);
          time = `${hours} giờ trước`;
        } else {
          const days = Math.floor(absDiffH / 24);
          time = `${days} ngày trước`;
        }

        list.push({
          id, type: "overdue", icon: AlertTriangle, iconColor: "#EF4444", iconBg: "#FEF2F2",
          title: `⏰ Chờ bạn hoàn thành: ${task.title}`,
          body: `Công việc này đã quá hạn ${time.replace(" trước", "")} rồi. Dành chút thời gian hoàn tất nhé, bạn sẽ làm được thôi!`,
          time, read: readIds.includes(id), timestamp: dueMs, targetPage: "tasks",
        });
      } else if (diffH <= 24) {
        const id = `task-upcoming-${task.id}-${task.dueDate}-${task.dueTime || "23:59"}`;
        if (dismissedIds.includes(id)) { console.log(`[NotifService] SKIP dismissed: ${id}`); continue; }
        
        let time = "";
        if (diffH < 1) {
          const mins = Math.max(1, Math.round(diffH * 60));
          time = `Còn ${mins} phút`;
        } else {
          const hours = Math.round(diffH);
          time = `Còn ${hours} giờ`;
        }

        list.push({
          id, type: "upcoming", icon: Clock, iconColor: "#F59E0B", iconBg: "#FFFBEB",
          title: `📌 Nhắc nhỏ: ${task.title}`,
          body: `Hạn chót là ${task.dueTime || "cuối ngày"} hôm nay. Cố gắng hoàn thành sớm để thảnh thơi nhé!`,
          time, read: readIds.includes(id), timestamp: dueMs, targetPage: "tasks",
        });
      }
    }

    // ── Events ──
    for (const event of events) {
      if (!event.title || !event.date) continue;
      const eventMs = Date.parse(`${event.date}T${event.time || "00:00"}:00`);
      if (isNaN(eventMs)) continue;
      const diffH = (eventMs - nowMs) / 3_600_000;
      if (diffH < 0 || diffH > 12) continue;

      const id = `event-upcoming-${event.id}-${event.date}-${event.time || "00:00"}`;
      if (dismissedIds.includes(id)) { console.log(`[NotifService] SKIP dismissed: ${id}`); continue; }
      const mins = Math.round(diffH * 60);
      const time = mins < 60 ? `Còn ${mins} phút` : `Còn ${Math.round(diffH)} giờ`;
      const loc = event.location ? ` tại ${event.location}` : "";
      list.push({
        id, type: "event", icon: Calendar, iconColor: "#3B82F6", iconBg: "#EFF6FF",
        title: `📅 Sự kiện sắp tới: ${event.title}`,
        body: `Sự kiện sẽ diễn ra vào lúc ${event.time || "00:00"}${loc}. Chúc bạn có những giây phút tuyệt vời!`,
        time, read: readIds.includes(id), timestamp: eventMs, targetPage: "events",
      });
    }

    // ── Habits ──
    const dow = now.getDay();
    const isWeekend = dow === 0 || dow === 6;
    for (const habit of habits) {
      if (!habit.name || habit.completedDates?.includes(today)) continue;
      if (habit.frequency === "weekdays" && isWeekend) continue;
      if (habit.frequency === "weekends" && !isWeekend) continue;

      const id = `habit-today-${habit.id}-${today}`;
      if (dismissedIds.includes(id)) { console.log(`[NotifService] SKIP dismissed: ${id}`); continue; }
      list.push({
        id, type: "habit", icon: Flame, iconColor: "#8B5CF6", iconBg: "#F5F3FF",
        title: `🌱 Giữ vững thói quen: ${habit.name}`,
        body: "Đừng quên check-in thói quen hôm nay nhé. Mỗi hành động nhỏ đều giúp bạn tiến gần hơn đến mục tiêu!",
        time: "Hôm nay", read: readIds.includes(id), timestamp: nowMs - 60_000, targetPage: "habits",
      });
    }

    // ── Goals ──
    for (const goal of goals) {
      if (!goal.title || goal.status !== "active" || !goal.deadline) continue;
      const dlMs = Date.parse(`${goal.deadline}T23:59:59`);
      if (isNaN(dlMs)) continue;
      const diffDays = Math.ceil((dlMs - nowMs) / 86_400_000);

      if (diffDays < 0) {
        const id = `goal-overdue-${goal.id}-${goal.deadline}`;
        if (dismissedIds.includes(id)) continue;
        list.push({
          id, type: "overdue", icon: Target, iconColor: "#EF4444", iconBg: "#FEF2F2",
          title: `🎯 Đang chờ hoàn thành: ${goal.title}`,
          body: `Mục tiêu này đã qua ngày hạn chót (${new Date(goal.deadline).toLocaleDateString("vi-VN")}). Đừng nản lòng, hãy cập nhật tiến trình hoặc gia hạn thêm thời gian nhé!`,
          time: `${Math.abs(diffDays)} ngày trước`, read: readIds.includes(id), timestamp: dlMs, targetPage: "goals",
        });
      } else if (diffDays <= 3) {
        const id = `goal-upcoming-${goal.id}-${goal.deadline}`;
        if (dismissedIds.includes(id)) continue;
        const timeText = diffDays === 0 ? "Hôm nay là hạn chót" : diffDays === 1 ? "Hạn chót vào ngày mai" : `Còn ${diffDays} ngày nữa`;
        list.push({
          id, type: "upcoming", icon: Target, iconColor: "#3B82F6", iconBg: "#EFF6FF",
          title: `🎯 Tăng tốc mục tiêu: ${goal.title}`,
          body: `${timeText} (${new Date(goal.deadline).toLocaleDateString("vi-VN")}). Bạn đã hoàn thành được ${goal.current}/${goal.target} ${goal.unit || ""} rồi, cố lên!`,
          time: diffDays === 0 ? "Hôm nay" : `${diffDays} ngày nữa`, read: readIds.includes(id), timestamp: dlMs, targetPage: "goals",
        });
      }
    }

    // ── Holidays ──
    const todayHolidays = getUpcomingLunarEvents(5).filter(h => h.daysLeft === 0);
    for (const h of todayHolidays) {
      const id = `holiday-today-${h.name}-${today}`;
      if (dismissedIds.includes(id)) continue;
      list.push({
        id, type: "event", icon: Calendar, iconColor: "#EF4444", iconBg: "#FFF1F2",
        title: `🎉 Chúc mừng ngày lễ: ${h.name}`,
        body: `Hôm nay là ${h.name} (${h.lunarDay}/${h.lunarMonth} Âm lịch). Chúc bạn và gia đình có một ngày thật vui vẻ, trọn vẹn và tràn đầy ấm áp!`,
        time: "Hôm nay", read: readIds.includes(id), timestamp: nowMs, targetPage: "events",
      });
    }

    // Sort: overdue → soonest first
    list.sort((a, b) => {
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (a.type !== "overdue" && b.type === "overdue") return 1;
      return a.timestamp - b.timestamp;
    });

    // Debug: show results
    console.log(`[NotifService] Generated ${list.length} notifs, ${list.filter(n => !n.read).length} unread`);
    list.forEach(n => console.log(`  → [${n.read ? "READ" : "UNREAD"}] ${n.type}: ${n.title} (${n.id})`));

    return list;
  }, [tasks, events, habits, goals, readIds, dismissedIds, tick]);

  /* ─ Derived values ─ */
  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);
  const unreadIds   = useMemo(() => notifs.filter((n) => !n.read).map((n) => n.id).join(","), [notifs]);

  /* ─ Actions ─ */
  const markRead    = (id: string) => setReadIds((p) => Array.from(new Set([...p, id])).slice(-200));
  const markAllRead = ()           => setReadIds((p) => Array.from(new Set([...p, ...notifs.map((n) => n.id)])).slice(-200));
  const dismissNotif = (id: string) => setDismissedIds((p) => [...p, id].slice(-200));

  return { notifs, unreadCount, unreadIds, markRead, markAllRead, dismissNotif };
}
