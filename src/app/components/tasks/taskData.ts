export type Priority = "high" | "medium" | "low";
export type Filter   = "all" | "today" | "upcoming" | "overdue" | "done";

export interface Task {
  id:          number;
  title:       string;
  description: string;
  done:        boolean;
  priority:    Priority;
  category:    string;
  dueDate:     string;   // YYYY-MM-DD, empty = no date
  dueTime:     string;   // HH:mm, empty = no time
}

export const CATEGORIES = ["Công việc", "Cá nhân", "Học tập", "Sức khoẻ", "Tài chính", "Gia đình", "Khác"];

export const PRIORITY_LABEL: Record<Priority, string>  = { high: "Cao", medium: "Trung bình", low: "Thấp" };
export const PRIORITY_COLOR: Record<Priority, string>  = { high: "#E53935", medium: "#FFB347", low: "#4CAF50" };
export const PRIORITY_BG:    Record<Priority, string>  = { high: "bg-red-50 text-red-600", medium: "bg-yellow-50 text-yellow-700", low: "bg-green-50 text-green-600" };

const today = new Date();
const fmt   = (d: Date) => d.toISOString().slice(0, 10);
const add   = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

export const INITIAL_TASKS: Task[] = [
  { id:1,  title: "Hoàn thiện báo cáo Q2",         description: "Tổng hợp số liệu và gửi cho trưởng phòng",  done: true,  priority: "high",   category: "Công việc", dueDate: fmt(today), dueTime: "09:00" },
  { id:2,  title: "Đọc sách 30 phút",               description: "Đọc chương 5 sách Atomic Habits",           done: true,  priority: "low",    category: "Cá nhân",   dueDate: fmt(today), dueTime: "" },
  { id:3,  title: "Gọi điện khách hàng ABC",        description: "Trao đổi hợp đồng mới Q3",                  done: false, priority: "high",   category: "Công việc", dueDate: fmt(today), dueTime: "14:00" },
  { id:4,  title: "Tập thể dục buổi chiều",         description: "Chạy bộ 5km tại công viên",                 done: false, priority: "medium", category: "Sức khoẻ",  dueDate: fmt(today), dueTime: "17:30" },
  { id:5,  title: "Review pull request #47",        description: "",                                           done: false, priority: "medium", category: "Công việc", dueDate: fmt(today), dueTime: "" },
  { id:6,  title: "Họp team sprint planning",       description: "Sprint 24 — lên kế hoạch 2 tuần tới",       done: false, priority: "high",   category: "Công việc", dueDate: add(1),     dueTime: "09:30" },
  { id:7,  title: "Nộp thuế thu nhập cá nhân",      description: "Deadline cuối tháng",                       done: false, priority: "high",   category: "Tài chính", dueDate: add(2),     dueTime: "" },
  { id:8,  title: "Mua quà sinh nhật mẹ",           description: "Sinh nhật mẹ ngày 15",                      done: false, priority: "medium", category: "Gia đình",  dueDate: add(3),     dueTime: "" },
  { id:9,  title: "Học khoá React Advanced",        description: "Xem module 6: Performance",                 done: false, priority: "low",    category: "Học tập",   dueDate: add(5),     dueTime: "20:00" },
  { id:10, title: "Khám sức khoẻ định kỳ",          description: "Đặt lịch tại bệnh viện Vinmec",             done: false, priority: "medium", category: "Sức khoẻ",  dueDate: add(7),     dueTime: "" },
  { id:11, title: "Cập nhật CV",                    description: "Thêm dự án mới và kỹ năng",                 done: false, priority: "low",    category: "Cá nhân",   dueDate: "",         dueTime: "" },
  { id:12, title: "Dọn dẹp phòng làm việc",         description: "",                                           done: false, priority: "low",    category: "Cá nhân",   dueDate: "",         dueTime: "" },
  { id:13, title: "Thanh toán hoá đơn điện nước",   description: "Hạn 5 tháng trước",                         done: false, priority: "high",   category: "Tài chính", dueDate: add(-2),    dueTime: "" },
];

export function nextId(tasks: Task[]) {
  return tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
}

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
