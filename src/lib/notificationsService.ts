import { useState, useEffect } from "react";
import { subscribeTasks } from "./tasksService";
import { subscribeEvents } from "./eventsService";
import { subscribeHabits } from "./habitsService";
import { AlertTriangle, Clock, Calendar, Flame } from "lucide-react";
import type { Task } from "../app/components/tasks/taskData";
import type { CalEvent, Habit } from "../app/store/useAppStore";

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
  targetPage: "tasks" | "events" | "habits";
}

export function useCalculatedNotifications(uid: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  
  const [readIds, setReadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("itme_read_notif_ids");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("itme_dismissed_notif_ids");
    return saved ? JSON.parse(saved) : [];
  });

  // Realtime listeners
  useEffect(() => {
    if (!uid) return;
    const unsubTasks = subscribeTasks(uid, setTasks);
    const unsubEvents = subscribeEvents(uid, setEvents);
    const unsubHabits = subscribeHabits(uid, setHabits);
    
    return () => {
      unsubTasks();
      unsubEvents();
      unsubHabits();
    };
  }, [uid]);

  // Persist read/dismissed states
  useEffect(() => {
    localStorage.setItem("itme_read_notif_ids", JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem("itme_dismissed_notif_ids", JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  // Calculate notifications list
  const notifs: CalculatedNotif[] = [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const nowMs = now.getTime();

  // 1. Process tasks
  tasks.forEach((task) => {
    if (task.done || !task.dueDate) return;
    
    const dueTimePart = task.dueTime || "23:59";
    const dueStr = `${task.dueDate}T${dueTimePart}:00`;
    const dueMs = Date.parse(dueStr);
    
    if (isNaN(dueMs)) return;
    
    const diffMs = dueMs - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue Task (Mức 1 - Đỏ / Khẩn cấp)
      const id = `task-overdue-${task.id}`;
      if (dismissedIds.includes(id)) return;
      
      const diffDays = Math.abs(Math.floor(diffHours / 24));
      const timeLabel = diffDays === 0 
        ? `${Math.abs(Math.round(diffHours))} giờ trước`
        : `${diffDays} ngày trước`;

      notifs.push({
        id,
        type: "overdue",
        icon: AlertTriangle,
        iconColor: "#EF4444",
        iconBg: "#FEF2F2",
        title: `Trễ hạn: ${task.title}`,
        body: `Công việc này đã trễ hạn ${timeLabel}! Vui lòng hoàn thành ngay.`,
        time: timeLabel,
        read: readIds.includes(id),
        timestamp: dueMs,
        targetPage: "tasks",
      });
    } else if (diffHours <= 24) {
      // Upcoming Task today (Mức 2 - Vàng / Quan trọng)
      const id = `task-upcoming-${task.id}`;
      if (dismissedIds.includes(id)) return;

      const timeLabel = `Còn ${Math.round(diffHours)} giờ`;
      notifs.push({
        id,
        type: "upcoming",
        icon: Clock,
        iconColor: "#F59E0B",
        iconBg: "#FFFBEB",
        title: `Sắp đến hạn: ${task.title}`,
        body: `Hạn chốt vào lúc ${task.dueTime || "cuối ngày"} hôm nay.`,
        time: timeLabel,
        read: readIds.includes(id),
        timestamp: dueMs,
        targetPage: "tasks",
      });
    }
  });

  // 2. Process events
  events.forEach((event) => {
    if (!event.date) return;
    
    const timePart = event.time || "00:00";
    const eventStr = `${event.date}T${timePart}:00`;
    const eventMs = Date.parse(eventStr);
    
    if (isNaN(eventMs)) return;
    
    const diffMs = eventMs - nowMs;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Only alert for events happening today (or in the next 12 hours)
    if (diffHours >= 0 && diffHours <= 12) {
      // Upcoming Event (Mức 3 - Xanh / Sự kiện)
      const id = `event-upcoming-${event.id}`;
      if (dismissedIds.includes(id)) return;

      const diffMins = Math.round(diffHours * 60);
      const timeLabel = diffMins < 60 ? `Còn ${diffMins} phút` : `Còn ${Math.round(diffHours)} giờ`;
      const locStr = event.location ? ` tại ${event.location}` : "";
      
      notifs.push({
        id,
        type: "event",
        icon: Calendar,
        iconColor: "#3B82F6",
        iconBg: "#EFF6FF",
        title: `Sắp diễn ra: ${event.title}`,
        body: `Sự kiện sẽ bắt đầu vào lúc ${event.time || "00:00"}${locStr}.`,
        time: timeLabel,
        read: readIds.includes(id),
        timestamp: eventMs,
        targetPage: "events",
      });
    }
  });

  // 3. Process habits
  habits.forEach((habit) => {
    const completedToday = habit.completedDates?.includes(todayStr);
    if (completedToday) return;

    const dayOfWeek = now.getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWeekday = !isWeekend;

    if (habit.frequency === "weekdays" && !isWeekday) return;
    if (habit.frequency === "weekends" && !isWeekend) return;

    // Habit check-in reminder (Mức 4 - Tím / Thói quen)
    const id = `habit-today-${habit.id}-${todayStr}`;
    if (dismissedIds.includes(id)) return;

    notifs.push({
      id,
      type: "habit",
      icon: Flame,
      iconColor: "#8B5CF6",
      iconBg: "#F5F3FF",
      title: `Thói quen: ${habit.name}`,
      body: `Đừng quên check-in thói quen hôm nay để duy trì streak nhé!`,
      time: "Hôm nay",
      read: readIds.includes(id),
      timestamp: nowMs - 1000 * 60,
      targetPage: "habits",
    });
  });

  // Sort: Overdue first, then by timestamp ascending (earliest first)
  notifs.sort((a, b) => {
    if (a.type === "overdue" && b.type !== "overdue") return -1;
    if (a.type !== "overdue" && b.type === "overdue") return 1;
    return a.timestamp - b.timestamp;
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setReadIds((prev) => Array.from(new Set([...prev, id])));
  };

  const markAllRead = () => {
    const allIds = notifs.map((n) => n.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const dismissNotif = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return {
    notifs,
    unreadCount,
    markRead,
    markAllRead,
    dismissNotif,
  };
}
