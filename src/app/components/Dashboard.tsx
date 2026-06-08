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
import { useAppStore, isHabitScheduledForToday } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeIncome, subscribeExpense, FinItem } from "../../lib/financeService";
import type { IncomeItem, ExpenseItem } from "./finance/financeStore";
import type { Priority } from "./tasks/taskData";

const TODAY = new Date().toLocaleDateString("en-CA");

const pColor: Record<Priority, string> = { high: "bg-red-400", medium: "bg-yellow-400", low: "bg-green-400" };

const GOAL_CAT_COLOR: Record<string, string> = {
  "Sức khỏe": "#10B981",
  "Công việc": "var(--primary)",
  "Học tập": "#3B82F6",
  "Tài chính": "#F59E0B",
  "Cá nhân": "#8B5CF6",
};

function getRemainingDaysText(dueDateStr?: string) {
  if (!dueDateStr) return "Không hạn";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [yr, mt, dy] = dueDateStr.split("-").map(Number);
  const due = new Date(yr, mt - 1, dy);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  return `Còn ${diffDays} ngày`;
}

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

  const [incomes, setIncomes] = useState<FinItem<IncomeItem>[]>([]);
  const [expenses, setExpenses] = useState<FinItem<ExpenseItem>[]>([]);

  useEffect(() => {
    if (!uid) return;
    const unsubInc = subscribeIncome(uid, setIncomes);
    const unsubExp = subscribeExpense(uid, setExpenses);
    return () => {
      unsubInc();
      unsubExp();
    };
  }, [uid]);

  // Compute Tasks (Upcoming undone tasks, sorted by due date)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => !t.done)
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks]);

  // Compute Habits (Top 4)
  const topHabits = useMemo(() => {
    return [...habits].sort((a, b) => b.streak - a.streak).slice(0, 4);
  }, [habits]);

  const scheduledHabits = habits.filter(h => isHabitScheduledForToday(h, TODAY));
  const totalScheduledHabits = scheduledHabits.length;
  const habitsDoneToday = scheduledHabits.filter(h => h.completedDates.includes(TODAY)).length;

  // Compute Goals (Top 3)
  const topGoals = useMemo(() => goals.filter(g => g.status === "active" && g.current < g.target).slice(0, 3), [goals]);
  const activeGoals = goals.filter(g => g.status === "active" && g.current < g.target).length;
  const totalGoals = goals.length;

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
      const ds = d.toLocaleDateString("en-CA");
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
          { label: "Việc sắp tới",     value: `${upcomingTasks.length}`,  sub: "Chưa hoàn thành",     icon: CheckSquare, color: "#3B82F6",        bg: "#EFF6FF",        page: "tasks" as Page },
          { label: "Mục tiêu active",  value: `${activeGoals}/${totalGoals}`,    sub: "Đang tiến triển",        icon: Target,      color: "var(--primary)", bg: "var(--secondary)", page: "goals" as Page },
          { label: "Thói quen hôm nay",value: `${habitsDoneToday}/${totalScheduledHabits}`,   sub: "Đã hoàn thành",icon: Flame,       color: "#F59E0B",        bg: "#FFFBEB",        page: "habits" as Page },
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

      {/* ── Upcoming Tasks & Goals & Habits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Column Left (3/5): Tasks and Goals */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Upcoming Tasks */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Công việc sắp tới</h2>
                {upcomingTasks.length > 2 && (
                  <span className="bg-primary/10 text-primary text-[0.7rem] font-bold px-1.5 py-0.5 rounded-full">
                    +{upcomingTasks.length - 2}
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate("tasks")}
                className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                style={{ fontSize: "0.775rem", fontWeight: 500 }}
              >
                Xem thêm <ChevronRight size={13} />
              </button>
            </div>
            <ul className="space-y-1.5">
              {upcomingTasks.slice(0, 2).map(t => (
                <li key={t.id}
                  onClick={() => onNavigate("tasks")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                  <Circle size={17} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                  <span className="flex-1 truncate text-foreground font-medium" style={{ fontSize: "0.875rem" }}>
                    {t.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2 py-1 rounded-lg">
                    {getRemainingDaysText(t.dueDate)}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pColor[t.priority]}`} />
                </li>
              ))}
              {upcomingTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-4" style={{ fontSize: "0.875rem" }}>
                  Không có công việc nào sắp tới.
                </p>
              )}
            </ul>
          </div>

          {/* Goals */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <SectionHeader title="Mục tiêu hàng đầu" onMore={() => onNavigate("goals")} />
            <div className="mt-4 space-y-4">
              {topGoals.map(g => {
                const prg = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                const color = GOAL_CAT_COLOR[g.category] || "var(--primary)";
                return (
                  <div key={g.id} onClick={() => onNavigate("goals")} className="cursor-pointer">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-foreground truncate mr-2" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{g.title}</span>
                      <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{prg}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${prg}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
              {topGoals.length === 0 && (
                <p className="text-muted-foreground text-center py-2" style={{ fontSize: "0.875rem" }}>
                  Chưa có mục tiêu nào.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Column Right (2/5): Habits */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 flex flex-col justify-between">
          <div>
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
              {topHabits.length === 0 && (
                <p className="text-muted-foreground text-center py-4" style={{ fontSize: "0.875rem" }}>
                  Bạn chưa có thói quen nào.
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Lunar countdown ── */}
      <LunarCountdownCard count={3} />

      {/* ── Finance Chart ── */}
      <div className="bg-card rounded-2xl border border-border p-5">
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
  );
}
