import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LunarCountdownBadge } from "./LunarCountdown";
import { StreakRecoveryModal } from "./StreakRecoveryModal";
import {
  Plus, Flame, CheckCircle2, Circle, MoreHorizontal,
  Pencil, Trash2, X, Trophy, TrendingUp, Zap, RotateCcw, ShieldPlus,
  Sun, Moon, Coffee, Dumbbell, Book, Heart, Droplets, Music,
} from "lucide-react";

import { useAppStore, getRecoveryInfo } from "../store/useAppStore";
import type { Habit, HabitIcon, Frequency } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeHabits, addHabit, updateHabit, deleteHabit as deleteHabitFromFirebase } from "../../lib/habitsService";
import { Loader2 } from "lucide-react";

/* ── Constants ── */
const TODAY = new Date().toISOString().slice(0, 10);

function getPast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const FREQ_LABEL: Record<Frequency, string> = {
  daily: "Hàng ngày",
  weekdays: "Ngày thường",
  weekends: "Cuối tuần",
};

const ICON_OPTIONS: { id: HabitIcon; El: React.ElementType }[] = [
  { id: "sun",      El: Sun },
  { id: "moon",     El: Moon },
  { id: "coffee",   El: Coffee },
  { id: "dumbbell", El: Dumbbell },
  { id: "book",     El: Book },
  { id: "heart",    El: Heart },
  { id: "droplets", El: Droplets },
  { id: "music",    El: Music },
  { id: "zap",      El: Zap },
  { id: "flame",    El: Flame },
];

const COLOR_OPTIONS = [
  "var(--primary)", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

const COLOR_BG: Record<string, string> = {
  "var(--primary)": "var(--secondary)",
  "#10B981": "#ECFDF5",
  "#F59E0B": "#FFFBEB",
  "#EF4444": "#FEF2F2",
  "#3B82F6": "#EFF6FF",
  "#8B5CF6": "#F5F3FF",
  "#EC4899": "#FDF2F8",
  "#14B8A6": "#F0FDFA",
};


/* ── Icon renderer ── */
function HabitIconEl({ icon, size = 18 }: { icon: HabitIcon; size?: number }) {
  const map: Record<HabitIcon, React.ElementType> = {
    sun: Sun, moon: Moon, coffee: Coffee, dumbbell: Dumbbell,
    book: Book, heart: Heart, droplets: Droplets, music: Music,
    zap: Zap, flame: Flame,
  };
  const El = map[icon];
  return <El size={size} />;
}

/* ── Week heatmap dots ── */
function WeekDots({ habit }: { habit: Habit }) {
  const past7 = getPast7Days();
  return (
    <div className="flex items-center gap-1">
      {past7.map((date, i) => {
        const done = habit.completedDates.includes(date);
        const isToday = date === TODAY;
        return (
          <div key={date} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-md transition-all ${isToday ? "ring-1 ring-offset-1" : ""}`}
              style={{
                background: done ? habit.color : "var(--muted)",
                opacity: done ? 1 : 0.4,
                ringColor: habit.color,
              }}
            />
            <span style={{ fontSize: "0.6rem", color: "var(--muted-foreground)" }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Habit Form ── */
function HabitForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<Habit> | null;
  onSave: (h: Partial<Habit> & Omit<Habit, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [desc, setDesc]         = useState(initial?.desc ?? "");
  const [icon, setIcon]         = useState<HabitIcon>(initial?.icon ?? "sun");
  const [color, setColor]       = useState(initial?.color ?? "var(--primary)");
  const [frequency, setFreq]    = useState<Frequency>(initial?.frequency ?? "daily");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      desc: desc.trim(),
      icon,
      color,
      frequency,
      streak: initial?.streak ?? 0,
      best: initial?.best ?? 0,
      completedDates: initial?.completedDates ?? [],
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>
            {initial?.id ? "Chỉnh sửa thói quen" : "Thêm thói quen mới"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: COLOR_BG[color] ?? "var(--secondary)", color }}>
              <HabitIconEl icon={icon} size={20} />
            </div>
            <div>
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                {name || "Tên thói quen"}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                {desc || "Mô tả ngắn..."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tên thói quen *</label>
            <input className="input-base" placeholder="VD: Uống đủ nước" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Mô tả</label>
            <input className="input-base" placeholder="VD: 2 lít nước mỗi ngày"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(({ id, El }) => (
                <button key={id} type="button"
                  onClick={() => setIcon(id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === id ? "ring-2 ring-offset-1" : "bg-muted hover:bg-secondary"}`}
                  style={icon === id ? { background: COLOR_BG[color] ?? "var(--secondary)", color, ringColor: color } : {}}
                >
                  <El size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Màu sắc</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                  style={{ background: c, ringColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tần suất</label>
            <div className="flex gap-2">
              {(["daily", "weekdays", "weekends"] as Frequency[]).map(f => (
                <button key={f} type="button"
                  onClick={() => setFreq(f)}
                  className={`flex-1 py-2 rounded-xl transition-all ${frequency === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              Huỷ
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {initial?.id ? "Lưu thay đổi" : "Thêm thói quen"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Habit Card ── */
function HabitCard({
  habit,
  onToggleToday,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  onToggleToday: (id: string) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  onRecover: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const doneToday = habit.completedDates.includes(TODAY);
  const bg = COLOR_BG[habit.color] ?? "var(--secondary)";
  const weekRate = Math.round(
    (getPast7Days().filter(d => habit.completedDates.includes(d)).length / 7) * 100
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-card border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
        doneToday ? "border-transparent" : "border-border"
      }`}
      style={doneToday ? { borderColor: habit.color + "40", boxShadow: `0 0 0 1px ${habit.color}30` } : {}}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg, color: habit.color }}
        >
          <HabitIconEl icon={habit.icon} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-foreground truncate" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            {habit.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>
              {FREQ_LABEL[habit.frequency]}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="flex items-center gap-0.5" style={{ fontSize: "0.775rem", color: habit.color, fontWeight: 600 }}>
              <Flame size={11} />
              {habit.streak} ngày
            </span>
          </div>
        </div>

        {/* Check button */}
        <button
          onClick={() => onToggleToday(habit.id)}
          className="transition-all active:scale-90"
        >
          {doneToday
            ? <CheckCircle2 size={28} style={{ color: habit.color }} />
            : <Circle size={28} className="text-muted-foreground/40 hover:text-muted-foreground" />
          }
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <MoreHorizontal size={15} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 py-1 min-w-[130px]"
              >
                <button className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted text-foreground"
                  style={{ fontSize: "0.8125rem" }}
                  onClick={() => { onEdit(habit); setMenuOpen(false); }}>
                  <Pencil size={13} /> Chỉnh sửa
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted text-destructive"
                  style={{ fontSize: "0.8125rem" }}
                  onClick={() => { onDelete(habit.id); setMenuOpen(false); }}>
                  <Trash2 size={13} /> Xoá
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 7-day heatmap */}
      <WeekDots habit={habit} />

      {/* Stats row */}
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: habit.color }}
            initial={{ width: 0 }}
            animate={{ width: `${weekRate}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
        <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.775rem", fontWeight: 600 }}>
          {weekRate}% tuần này
        </span>
        <span className="flex items-center gap-1 text-muted-foreground flex-shrink-0" style={{ fontSize: "0.775rem" }}>
          <Trophy size={11} className="text-amber-400" />
          Tốt nhất: {habit.best}
        </span>
        <button
          onClick={() => onRecover(habit.id)}
          className="ml-auto flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          title="Cứu chuỗi"
        >
          <ShieldPlus size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */
export function HabitsPage({ onModal }: { onModal?: (open: boolean) => void }) {
  const { habits, setHabits, goals, settings }   = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]     = useState<"all" | "done" | "pending">("all");
  const [recoveryItemId, setRecoveryItemId] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    const unsubscribe = subscribeHabits(uid, (data) => {
      setHabits(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [uid, setHabits]);

  function openModal()  { setFormOpen(true);  onModal?.(true);  }
  function closeModal() { setFormOpen(false); onModal?.(false); }


  const todayDone  = habits.filter(h => h.completedDates.includes(TODAY)).length;
  const totalToday = habits.length;
  const overallStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const pct = totalToday > 0 ? Math.round((todayDone / totalToday) * 100) : 0;

  const visible = useMemo(() => habits.filter(h => {
    if (filter === "done")    return h.completedDates.includes(TODAY);
    if (filter === "pending") return !h.completedDates.includes(TODAY);
    return true;
  }), [habits, filter]);

  async function toggleToday(id: string) {
    if (!uid) return;
    const h = habits.find(x => x.id === id);
    if (!h) return;
    const done = h.completedDates.includes(TODAY);
    const dates = done
      ? h.completedDates.filter(d => d !== TODAY)
      : [...h.completedDates, TODAY];
    const newStreak = done ? Math.max(h.streak - 1, 0) : h.streak + 1;
    await updateHabit(uid, id, { 
      completedDates: dates, 
      streak: newStreak, 
      best: Math.max(h.best, newStreak) 
    });
  }

  async function saveHabit(h: Partial<Habit> & Omit<Habit, "id" | "createdAt">) {
    if (!uid) return;
    const { id, ...habitData } = h;
    if (id) {
      await updateHabit(uid, id, habitData);
    } else {
      await addHabit(uid, habitData as Omit<Habit, "id" | "createdAt">);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteHabit(id: string) {
    if (!uid) return;
    if (confirm("Bạn có chắc chắn muốn xoá thói quen này?")) {
      await deleteHabitFromFirebase(uid, id);
    }
  }

  function openAdd()            { setEditing(null); openModal(); }
  function openEdit(h: Habit)   { setEditing(h);    openModal(); }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* ── Stats header ── */}
        <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3 space-y-4">
          <div className="flex items-center justify-between">
            <LunarCountdownBadge />
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-medium text-sm">
              <ShieldPlus size={16} />
              Cứu chuỗi: {getRecoveryInfo(habits, goals, settings).remaining}/{getRecoveryInfo(habits, goals, settings).maxRecoveries}
            </div>
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: CheckCircle2, label: "Hôm nay xong", value: `${todayDone}/${totalToday}`, color: "#10B981", bg: "#ECFDF5" },
              { icon: Flame,        label: "Streak dài nhất", value: `${overallStreak}🔥`,       color: "#F59E0B", bg: "#FFFBEB" },
              { icon: TrendingUp,   label: "Hoàn thành",     value: `${pct}%`,                  color: "var(--primary)", bg: "var(--secondary)" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground" style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1 }}>{value}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: "0.68rem", marginTop: "2px" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Daily progress bar */}
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <div className="flex justify-between mb-2">
              <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Tiến độ hôm nay</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: pct === 100 ? "#10B981" : "var(--primary)" }}>
                {pct === 100 ? "🎉 Hoàn hảo!" : `${todayDone} / ${totalToday} thói quen`}
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: pct === 100 ? "#10B981" : "var(--primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {([
              { id: "all",     label: "Tất cả",     count: habits.length },
              { id: "pending", label: "Chưa xong",  count: habits.filter(h => !h.completedDates.includes(TODAY)).length },
              { id: "done",    label: "Đã xong",    count: todayDone },
            ] as const).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  filter === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {label}
                <span
                  className={`px-1.5 py-0.5 rounded-full ${filter === id ? "bg-white/20" : "bg-background"}`}
                  style={{ fontSize: "0.7rem", fontWeight: 700 }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Habit list ── */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <AnimatePresence>
            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-3 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <RotateCcw size={24} className="text-muted-foreground" />
                </div>
                <p className="text-foreground" style={{ fontWeight: 600 }}>
                  {filter === "done" ? "Chưa hoàn thành thói quen nào hôm nay" : "Không có thói quen nào"}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  {filter === "all" ? "Thêm thói quen đầu tiên để bắt đầu!" : "Hãy tiếp tục cố gắng nhé!"}
                </p>
                {filter === "all" && (
                  <button
                    onClick={openAdd}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground"
                    style={{ fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    <Plus size={16} /> Thêm thói quen
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                <AnimatePresence>
                  {visible.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggleToday={toggleToday}
                      onEdit={openEdit}
                      onDelete={deleteHabit}
                      onRecover={setRecoveryItemId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-[72px] lg:bottom-6 lg:right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <HabitForm
            initial={editing}
            onSave={saveHabit}
            onClose={() => { closeModal(); setEditing(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recoveryItemId && (
          <StreakRecoveryModal onClose={() => setRecoveryItemId(null)} filterType="habit" filterItemId={recoveryItemId} />
        )}
      </AnimatePresence>
    </>
  );
}
