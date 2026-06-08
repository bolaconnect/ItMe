import { useState, useEffect, useMemo } from "react";
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
import { useAppStore } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeNotes, Note } from "../../lib/notesService";
import { subscribeIncome, subscribeExpense, FinItem } from "../../lib/financeService";
import type { IncomeItem, ExpenseItem } from "./finance/financeStore";
import type { Priority } from "./tasks/taskData";

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = toISO(new Date());

const pColor: Record<Priority, string> = { high: "bg-red-400", medium: "bg-yellow-400", low: "bg-green-400" };

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
  const { tasks, habits, goals, events } = useAppStore();
  const uid = auth.currentUser?.uid;
  const username = auth.currentUser?.displayName?.split(" ")[0] || "bạn";

  const [notes, setNotes] = useState<Note[]>([]);
  const [incomes, setIncomes] = useState<FinItem<IncomeItem>[]>([]);
  const [expenses, setExpenses] = useState<FinItem<ExpenseItem>[]>([]);

  useEffect(() => {
    if (!uid) return;
    const unsubNotes = subscribeNotes(uid, setNotes);
    const unsubInc = subscribeIncome(uid, setIncomes);
    const unsubExp = subscribeExpense(uid, setExpenses);
    return () => {
      unsubNotes();
      unsubInc();
      unsubExp();
    };
  }, [uid]);

  // Compute Tasks
  const todayTasks = useMemo(() => tasks.filter(t => !t.done || t.dueDate === TODAY), [tasks]);
  const done = todayTasks.filter(t => t.done).length;
  const total = todayTasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Compute Events
  const todayEvents = useMemo(() => events.filter(e => e.date === TODAY).sort((a, b) => (a.time || "").localeCompare(b.time || "")), [events]);

  // Compute Habits (Top 4)
  const topHabits = useMemo(() => {
    return [...habits].sort((a, b) => b.streak - a.streak).slice(0, 4);
  }, [habits]);

  const activeHabits = habits.filter(h => !h.completedDates.includes(TODAY)).length;

  // Compute Goals (Top 3)
  const topGoals = useMemo(() => goals.slice(0, 3), [goals]);
  const activeGoals = goals.length;

  // Compute Notes (Top 2)
  const recentNotes = useMemo(() => notes.slice(0, 2), [notes]);

  // Compute Finance
  const financeData = useMemo(() => {
    const currentMonth = TODAY.substring(0, 7); // YYYY-MM
    let incSum = 0;
    let expSum = 0;
    incomes.forEach(i => { if (i.date?.startsWith(currentMonth)) incSum += i.amount; });
    expenses.forEach(e => { if (e.date?.startsWith(currentMonth)) expSum += e.amount; });

    // Weekly spending chart (last 7 days)
    const chartData = [];
    let weekTotal = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = toISO(d);
      const dayLabel = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
      let sum = 0;
      expenses.forEach(e => { if (e.date === ds) sum += e.amount; });
      chartData.push({ day: dayLabel, value: sum / 1000 }); // Value in k (nghìn)
      weekTotal += sum;
    }

    return { incSum, expSum, net: incSum - expSum, chartData, weekTotal };
  }, [incomes, expenses]);

  function formatMoney(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "tr";
    if (n >= 1000) return (n / 1000).toFixed(0) + "k";
    return n.toString();
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto pb-24 lg:pb-6">

      {/* ── Greeting + date ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {greeting()}, {username}! 👋
        </h1>
      </motion.div>

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Việc hôm nay",     value: `${done}/${total}`,  sub: `${pct}% hoàn thành`,     icon: CheckSquare, color: "#3B82F6",        bg: "#EFF6FF",        page: "tasks" as Page },
          { label: "Mục tiêu active",  value: `${activeGoals}`,    sub: "Đang tiến triển",        icon: Target,      color: "var(--primary)", bg: "var(--secondary)", page: "goals" as Page },
          { label: "Thói quen cần làm",value: `${activeHabits}`,   sub: "Chưa hoàn thành hôm nay",icon: Flame,       color: "#F59E0B",        bg: "#FFFBEB",        page: "habits" as Page },
          { label: "Thu chi tháng này",value: formatMoney(financeData.net), sub: financeData.net >= 0 ? "Dương" : "Âm", icon: Wallet, color: financeData.net >= 0 ? "#10B981" : "#EF4444", bg: financeData.net >= 0 ? "#ECFDF5" : "#FEF2F2", page: "finance" as Page },
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
            {todayTasks.slice(0, 5).map(t => (
              <li key={t.id}
                onClick={() => onNavigate("tasks")}
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
            {todayTasks.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: "0.875rem" }}>Bạn chưa có việc nào hôm nay.</p>}
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
              <li key={ev.id} onClick={() => onNavigate("events" as Page)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: ev.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{ev.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.775rem" }}>
                    <Clock size={10} />{ev.time || "Cả ngày"}
                  </p>
                </div>
              </li>
            ))}
            {todayEvents.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: "0.875rem" }}>Không có lịch trình nào.</p>}
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
          <SectionHeader title="Thói quen nổi bật" onMore={() => onNavigate("habits")} />
          <ul className="mt-4 space-y-3">
            {topHabits.map(h => {
              const doneToday = h.completedDates.includes(TODAY);
              return (
                <li key={h.id} onClick={() => onNavigate("habits")} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    doneToday ? "border-green-500 bg-green-50" : "border-border group-hover:border-muted-foreground"
                  }`}>
                    {doneToday && <CheckCircle2 size={14} className="text-green-500" />}
                  </div>
                  <p className={`flex-1 ${doneToday ? "text-muted-foreground line-through" : "text-foreground"}`}
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {h.name}
                  </p>
                  <span className="flex items-center gap-0.5 text-orange-500" style={{ fontSize: "0.775rem", fontWeight: 600 }}>
                    <Flame size={11} />{h.streak}
                  </span>
                </li>
              );
            })}
            {topHabits.length === 0 && <p className="text-muted-foreground text-center py-4" style={{ fontSize: "0.875rem" }}>Bạn chưa có thói quen nào.</p>}
          </ul>
        </div>

        {/* Spending mini chart */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Chi tiêu 7 ngày qua" onMore={() => onNavigate("finance")} />
          <div className="mt-1 mb-2 flex items-end justify-between">
            <div>
              <p className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {financeData.weekTotal.toLocaleString()}đ
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Thu tháng này", value: formatMoney(financeData.incSum), color: "#10B981" },
                { label: "Chi tháng này", value: formatMoney(financeData.expSum), color: "#EF4444" },
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
              <AreaChart data={financeData.chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
            {topGoals.map(g => {
              const prg = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
              return (
                <div key={g.id} onClick={() => onNavigate("goals")} className="cursor-pointer">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-foreground truncate mr-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{g.name}</span>
                    <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{prg}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: g.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prg}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
            {topGoals.length === 0 && <p className="text-muted-foreground text-center py-2" style={{ fontSize: "0.875rem" }}>Chưa có mục tiêu nào.</p>}
          </div>
        </div>

        {/* Recent notes */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <SectionHeader title="Ghi chú gần đây" onMore={() => onNavigate("notes")} />
          <div className="mt-4 space-y-2">
            {recentNotes.map(n => (
              <button key={n.id} onClick={() => onNavigate("notes")}
                className="w-full text-left p-3 rounded-xl hover:bg-muted transition-colors border border-border">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={14} style={{ color: n.color || "var(--primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{n.title || "Không có tiêu đề"}</p>
                    <p className="text-muted-foreground truncate" style={{ fontSize: "0.775rem" }}>{n.content.replace(/<[^>]*>?/gm, '')}</p>
                  </div>
                </div>
              </button>
            ))}
            {recentNotes.length === 0 && <p className="text-muted-foreground text-center py-2" style={{ fontSize: "0.875rem" }}>Chưa có ghi chú nào.</p>}
            <button onClick={() => onNavigate("notes")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              style={{ fontSize: "0.875rem", marginTop: recentNotes.length > 0 ? "8px" : "0" }}>
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
