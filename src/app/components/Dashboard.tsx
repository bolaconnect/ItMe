import { useState } from "react";
import {
  CheckSquare, Target, Repeat2, Wallet,
  ArrowRight, CheckCircle2, Circle, Flame,
  TrendingUp, TrendingDown, Plus, ChevronRight,
  Calendar, FileText, Clock, Star,
} from "lucide-react";
import { LunarCountdownCard } from "./LunarCountdown";
import { motion } from "motion/react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import type { Page } from "./MainApp";

/* ── Static data ── */
const tasks = [
  { id: 1, title: "Hoàn thiện báo cáo Q2",      done: true,  priority: "high" },
  { id: 2, title: "Đọc sách 30 phút",            done: true,  priority: "low" },
  { id: 3, title: "Gọi điện cho khách hàng ABC", done: false, priority: "high" },
  { id: 4, title: "Tập thể dục buổi chiều",      done: false, priority: "medium" },
  { id: 5, title: "Review pull request #47",     done: false, priority: "medium" },
];

const habits = [
  { id: 1, name: "Uống đủ 2L nước", streak: 12, done: true },
  { id: 2, name: "Thiền 10 phút",   streak: 7,  done: true },
  { id: 3, name: "Tập thể dục",     streak: 3,  done: false },
  { id: 4, name: "Đọc sách",        streak: 12, done: false },
];

const goals = [
  { name: "Học tiếng Anh B2",    progress: 72, color: "#5B4CF5" },
  { name: "Chạy bộ 100km/tháng", progress: 45, color: "#FF8A65" },
  { name: "Tiết kiệm 50 triệu",  progress: 88, color: "#22c55e" },
];

const finance = [
  { label: "Thu nhập",  value: "18,500,000đ", trend: "up",   note: "+5% so tháng trước" },
  { label: "Chi tiêu",  value: "20,900,000đ", trend: "down", note: "+12% so tháng trước" },
  { label: "Tiết kiệm", value: "3,200,000đ",  trend: "up",   note: "Mục tiêu: 5,000,000đ" },
];

const spendingData = [
  { day: "T2", value: 450 }, { day: "T3", value: 820 }, { day: "T4", value: 320 },
  { day: "T5", value: 1100 }, { day: "T6", value: 670 }, { day: "T7", value: 950 }, { day: "CN", value: 430 },
];

const recentNotes = [
  { id: 1, title: "Ý tưởng cho dự án mới", preview: "Xây dựng app quản lý tài chính cá nhân...", time: "5 phút trước" },
  { id: 2, title: "Lịch học tiếng Anh",    preview: "Grammar: Past perfect, Vocabulary 20 từ...", time: "2 giờ trước" },
];

const todayEvents = (() => {
  const d = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
  return [
    { id: 1, title: "Họp team weekly",     time: "09:00", color: "var(--primary)" },
    { id: 2, title: "Review code sprint",  time: "14:00", color: "#10B981" },
    { id: 3, title: "Tập thể dục",         time: "18:00", color: "#F59E0B" },
  ];
})();

const pColor: Record<string, string> = { high: "bg-red-400", medium: "bg-yellow-400", low: "bg-green-400" };

/* ── Greeting ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/* ── Reusable section header ── */
function SectionHeader({ title, onMore }: { title: string; onMore: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-foreground" style={{ fontSize: "0.95rem", fontWeight: 700 }}>{title}</h2>
      <button
        onClick={onMore}
        className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
        style={{ fontSize: "0.775rem", fontWeight: 500 }}
      >
        Xem thêm <ChevronRight size={13} />
      </button>
    </div>
  );
}

/* ── Main ── */
interface DashboardProps { onNavigate: (p: Page) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto pb-24 lg:pb-6">

      {/* ── Greeting + date ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {greeting()}, Minh! 👋
        </h1>
      </motion.div>

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Việc hôm nay",     value: `${done}/${total}`,  sub: `${pct}% hoàn thành`,     icon: CheckSquare, color: "#3B82F6",        bg: "#EFF6FF",        page: "tasks" as Page },
          { label: "Mục tiêu active",  value: "4",                  sub: "2 sắp hoàn thành",       icon: Target,      color: "var(--primary)", bg: "var(--secondary)", page: "goals" as Page },
          { label: "Chuỗi thói quen",  value: "12 🔥",              sub: "Kỷ lục: 21 ngày",        icon: Flame,       color: "#F59E0B",        bg: "#FFFBEB",        page: "habits" as Page },
          { label: "Tháng này",        value: "−2.4tr",             sub: "Chi nhiều hơn thu",      icon: Wallet,      color: "#EF4444",        bg: "#FEF2F2",        page: "finance" as Page },
        ].map(({ label, value, sub, icon: Icon, color, bg, page }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => onNavigate(page)}
            className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full group"
          >
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.775rem" }}>{label}</p>
              <p className="text-foreground" style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px" }}>{value}</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem", marginTop: "2px" }}>{sub}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground/0 group-hover:text-muted-foreground transition-colors mt-1 flex-shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* ── Tasks + Today's Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Tasks */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Việc hôm nay" onMore={() => onNavigate("tasks")} />
          {/* Daily progress */}
          <div className="mt-3 mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>{done}/{total} hoàn thành</span>
              <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--primary)" }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          <ul className="space-y-1">
            {tasks.map(t => (
              <li key={t.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                {t.done
                  ? <CheckCircle2 size={17} className="text-green-500 shrink-0" />
                  : <Circle size={17} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                }
                <span className={`flex-1 truncate ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                  style={{ fontSize: "0.875rem" }}>
                  {t.title}
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${pColor[t.priority]}`} />
              </li>
            ))}
          </ul>
          <button onClick={() => onNavigate("tasks")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            style={{ fontSize: "0.875rem" }}>
            <Plus size={14} /> Thêm việc mới
          </button>
        </div>

        {/* Today's events */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Lịch hôm nay" onMore={() => onNavigate("calendar" as Page)} />
          <ul className="mt-4 space-y-2">
            {todayEvents.map(ev => (
              <li key={ev.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{ev.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.775rem" }}>
                    <Clock size={10} />{ev.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => onNavigate("calendar" as Page)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            style={{ fontSize: "0.875rem" }}>
            <Calendar size={14} /> Xem lịch đầy đủ
          </button>
        </div>
      </div>

      {/* ── Habits + Spending chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Habits */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Thói quen" onMore={() => onNavigate("habits")} />
          <ul className="mt-4 space-y-3">
            {habits.map(h => (
              <li key={h.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  h.done ? "border-green-500 bg-green-50" : "border-border group-hover:border-muted-foreground"
                }`}>
                  {h.done && <CheckCircle2 size={14} className="text-green-500" />}
                </div>
                <p className={`flex-1 ${h.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  style={{ fontSize: "0.875rem" }}>
                  {h.name}
                </p>
                <span className="flex items-center gap-0.5 text-orange-500" style={{ fontSize: "0.775rem", fontWeight: 600 }}>
                  <Flame size={11} />{h.streak}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Spending mini chart */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Chi tiêu tuần này" onMore={() => onNavigate("finance")} />
          <div className="mt-1 mb-2 flex items-end justify-between">
            <div>
              <p className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em" }}>4,740,000đ</p>
              <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.8rem" }}>
                <TrendingUp size={12} className="text-red-500" />
                <span className="text-red-500 font-medium">+12%</span> so tuần trước
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Thu", value: "18.5tr", color: "#10B981" },
                { label: "Chi", value: "20.9tr", color: "#EF4444" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>{label}</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: "80px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.75rem" }}
                  formatter={(v: number) => [`${v}k đ`, "Chi tiêu"]}
                  labelStyle={{ color: "var(--muted-foreground)", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2}
                  fill="url(#spendGrad)" dot={false} activeDot={{ r: 4, fill: "var(--primary)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Lunar countdown ── */}
      <LunarCountdownCard count={3} />

      {/* ── Goals + Notes + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Goals */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Mục tiêu" onMore={() => onNavigate("goals")} />
          <div className="mt-4 space-y-4">
            {goals.map(g => (
              <div key={g.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-foreground truncate mr-2" style={{ fontSize: "0.875rem" }}>{g.name}</span>
                  <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{g.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: g.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${g.progress}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent notes */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Ghi chú gần đây" onMore={() => onNavigate("notes")} />
          <div className="mt-4 space-y-2">
            {recentNotes.map(n => (
              <button key={n.id} onClick={() => onNavigate("notes")}
                className="w-full text-left p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={14} style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{n.title}</p>
                    <p className="text-muted-foreground truncate" style={{ fontSize: "0.775rem" }}>{n.preview}</p>
                    <p className="text-muted-foreground/60" style={{ fontSize: "0.7rem", marginTop: "2px" }}>{n.time}</p>
                  </div>
                </div>
              </button>
            ))}
            <button onClick={() => onNavigate("notes")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              style={{ fontSize: "0.875rem" }}>
              <Plus size={14} /> Thêm ghi chú
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-foreground mb-4" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Truy cập nhanh</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Thêm việc",     icon: CheckSquare, page: "tasks" as Page,   color: "#3B82F6",        bg: "#EFF6FF" },
              { label: "Thêm mục tiêu", icon: Target,      page: "goals" as Page,   color: "var(--primary)", bg: "var(--secondary)" },
              { label: "Ghi chú mới",   icon: FileText,    page: "notes" as Page,   color: "#8B5CF6",        bg: "#F5F3FF" },
              { label: "Xem lịch",      icon: Calendar,    page: "calendar" as Page,color: "#10B981",        bg: "#ECFDF5" },
              { label: "Thói quen",     icon: Repeat2,     page: "habits" as Page,  color: "#F59E0B",        bg: "#FFFBEB" },
              { label: "Tài chính",     icon: Wallet,      page: "finance" as Page, color: "#EF4444",        bg: "#FEF2F2" },
            ].map(({ label, icon: Icon, page, color, bg }) => (
              <button key={label}
                onClick={() => onNavigate(page)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all border border-border"
                style={{ background: bg }}
              >
                <Icon size={20} style={{ color }} />
                <span style={{ fontSize: "0.775rem", fontWeight: 600, color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
