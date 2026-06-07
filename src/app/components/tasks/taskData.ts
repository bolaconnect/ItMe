export type Priority = "high" | "medium" | "low";
export type Filter   = "all" | "today" | "upcoming" | "overdue" | "done";

export interface Task {
  id:          string;
  title:       string;
  description: string;
  done:        boolean;
  priority:    Priority;
  category:    string;
  dueDate:     string;   // YYYY-MM-DD, empty = no date
  dueTime:     string;   // HH:mm, empty = no time
  createdAt?:  any;
}

export const CATEGORIES = ["Công việc", "Cá nhân", "Học tập", "Sức khoẻ", "Tài chính", "Gia đình", "Khác"];

export const PRIORITY_LABEL: Record<Priority, string>  = { high: "Cao", medium: "Trung bình", low: "Thấp" };
export const PRIORITY_COLOR: Record<Priority, string>  = { high: "#E53935", medium: "#FFB347", low: "#4CAF50" };
export const PRIORITY_BG:    Record<Priority, string>  = { high: "bg-red-50 text-red-600", medium: "bg-yellow-50 text-yellow-700", low: "bg-green-50 text-green-600" };

const today = new Date();
const fmt   = (d: Date) => d.toISOString().slice(0, 10);
const add   = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };


export function groupTasks(tasks: Task[], filter: Filter) {
  const todayStr = fmt(today);

  const filtered = tasks.filter((t) => {
    if (filter === "done")     return t.done;
    if (filter === "today")    return !t.done && t.dueDate === todayStr;
    if (filter === "overdue")  return !t.done && t.dueDate && t.dueDate < todayStr;
    if (filter === "upcoming") return !t.done && t.dueDate && t.dueDate > todayStr;
    return !t.done; // "all" shows undone
  });

  if (filter === "done") return [{ label: "Đã hoàn thành", tasks: filtered }];
  if (filter !== "all")  return [{ label: "", tasks: filtered }];

  // "all" → group by bucket
  const overdue  = filtered.filter((t) => t.dueDate && t.dueDate <  todayStr);
  const todayT   = filtered.filter((t) => t.dueDate === todayStr);
  const upcoming = filtered.filter((t) => t.dueDate && t.dueDate >  todayStr);
  const noDate   = filtered.filter((t) => !t.dueDate);

  return [
    overdue.length  && { label: "⚠️ Quá hạn",  tasks: overdue  },
    todayT.length   && { label: "📅 Hôm nay",   tasks: todayT   },
    upcoming.length && { label: "🗓 Sắp tới",   tasks: upcoming },
    noDate.length   && { label: "📋 Chưa có hạn", tasks: noDate },
  ].filter(Boolean) as { label: string; tasks: Task[] }[];
}
