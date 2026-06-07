import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LunarCountdownBadge } from "./LunarCountdown";
import {
  Plus, Target, Trophy, Flame, TrendingUp, X, Check,
  ChevronRight, Calendar, MoreHorizontal, Pencil, Trash2,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { subscribeGoals, addGoal, updateGoal, deleteGoal as deleteGoalFromFirebase, Goal, GoalCategory } from "../../lib/goalsService";
import { useAppStore } from "../store/useAppStore";
import { Loader2 } from "lucide-react";

const CAT_COLOR: Record<GoalCategory, { text: string; bg: string }> = {
  "Sức khỏe": { text: "#10B981", bg: "#ECFDF5" },
  "Công việc": { text: "var(--primary)", bg: "var(--secondary)" },
  "Học tập":   { text: "#3B82F6", bg: "#EFF6FF" },
  "Tài chính": { text: "#F59E0B", bg: "#FFFBEB" },
  "Cá nhân":   { text: "#8B5CF6", bg: "#F5F3FF" },
};

const CATEGORIES: GoalCategory[] = ["Sức khỏe", "Công việc", "Học tập", "Tài chính", "Cá nhân"];

/* ── Progress ring (svg) ── */
function ProgressRing({ pct, size = 52, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function GoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<Goal> | null;
  onSave: (g: Partial<Goal> & Omit<Goal, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle]       = useState(initial?.title ?? "");
  const [desc, setDesc]         = useState(initial?.desc ?? "");
  const [category, setCategory] = useState<GoalCategory>(initial?.category ?? "Cá nhân");
  const [target, setTarget]     = useState(String(initial?.target ?? ""));
  const [current, setCurrent]   = useState(String(initial?.current ?? "0"));
  const [unit, setUnit]         = useState(initial?.unit ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? today);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !target) return;
    onSave({
      id: initial?.id, // Có thể undefined nếu là thêm mới
      title: title.trim(),
      desc: desc.trim(),
      category,
      target: Number(target),
      current: Math.min(Number(current), Number(target)),
      unit: unit.trim() || "đơn vị",
      deadline,
      status: initial?.status ?? "active",
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
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
            {initial?.id ? "Chỉnh sửa mục tiêu" : "Thêm mục tiêu mới"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tên mục tiêu *</label>
            <input
              className="input-base"
              placeholder="VD: Đọc 12 cuốn sách trong năm"
              value={title} onChange={e => setTitle(e.target.value)} required
            />
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Mô tả</label>
            <textarea
              className="input-base resize-none"
              rows={2}
              placeholder="Thêm chi tiết về mục tiêu này..."
              value={desc} onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Danh mục</label>
              <select
                className="input-base"
                value={category} onChange={e => setCategory(e.target.value as GoalCategory)}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Đơn vị</label>
              <input
                className="input-base"
                placeholder="km, cuốn, kg..."
                value={unit} onChange={e => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Mục tiêu *</label>
              <input
                className="input-base" type="number" min="1" required
                placeholder="100"
                value={target} onChange={e => setTarget(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Hiện tại</label>
              <input
                className="input-base" type="number" min="0"
                value={current} onChange={e => setCurrent(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Hạn chót</label>
            <input
              className="input-base" type="date"
              value={deadline} onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              Huỷ
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {initial?.id ? "Lưu thay đổi" : "Thêm mục tiêu"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, delta: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = Math.min(Math.floor((goal.current / goal.target) * 100), 100);
  const color = CAT_COLOR[goal.category].text;
  const isDone = goal.status === "done" || goal.current >= goal.target;

  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 relative"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <ProgressRing pct={pct} color={isDone ? "#10B981" : color} />
          <div className="absolute inset-0 flex items-center justify-center">
            {isDone
              ? <Check size={16} className="text-emerald-500" />
              : <span style={{ fontSize: "0.6rem", fontWeight: 700, color }}>{pct}%</span>
            }
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ fontSize: "0.7rem", fontWeight: 700, color, background: CAT_COLOR[goal.category].bg }}
            >
              {goal.category}
            </span>
            {isDone && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600" style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                Hoàn thành
              </span>
            )}
          </div>
          <p className="text-foreground truncate" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{goal.title}</p>
          {goal.desc && (
            <p className="text-muted-foreground truncate" style={{ fontSize: "0.8rem" }}>{goal.desc}</p>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden py-1 min-w-[130px]"
              >
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted text-foreground text-left"
                  style={{ fontSize: "0.8125rem" }}
                  onClick={() => { onEdit(goal); setMenuOpen(false); }}
                >
                  <Pencil size={13} /> Chỉnh sửa
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted text-destructive text-left"
                  style={{ fontSize: "0.8125rem" }}
                  onClick={() => { onDelete(goal.id); setMenuOpen(false); }}
                >
                  <Trash2 size={13} /> Xoá
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>
            {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.775rem" }}>
            <Calendar size={11} />
            {isDone ? "Đã xong" : daysLeft > 0 ? `${daysLeft} ngày còn lại` : "Đã hết hạn"}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: isDone ? "#10B981" : color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Quick update buttons */}
      {!isDone && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          <span className="text-muted-foreground" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Cập nhật:</span>
          {[1, 5, 10].map((delta) => (
            <button
              key={delta}
              onClick={() => onUpdateProgress(goal.id, delta)}
              className="px-2 py-1 rounded-lg bg-muted hover:bg-secondary hover:text-secondary-foreground transition-colors"
              style={{ fontSize: "0.72rem", fontWeight: 600 }}
            >
              +{delta}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Main page ── */
export function GoalsPage({ onModal }: { onModal?: (open: boolean) => void }) {
  const { goals, setGoals }     = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    const unsubscribe = subscribeGoals(uid, (data) => {
      setGoals(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [uid, setGoals]);

  function openModal()  { setFormOpen(true);  onModal?.(true);  }
  function closeModal() { setFormOpen(false); onModal?.(false); }
  const [filter, setFilter]     = useState<"all" | "active" | "done">("all");
  const [catFilter, setCatFilter] = useState<GoalCategory | "all">("all");

  const active  = goals.filter(g => g.status !== "done" && (g.current / g.target) < 1);
  const done    = goals.filter(g => g.status === "done" || g.current >= g.target);
  const streak  = 7; // mock streak

  const visible = goals.filter(g => {
    const statusOk =
      filter === "all" ? true :
      filter === "done" ? (g.status === "done" || g.current >= g.target) :
      g.status === "active" && g.current < g.target;
    const catOk = catFilter === "all" || g.category === catFilter;
    return statusOk && catOk;
  });

  async function saveGoal(g: Partial<Goal> & Omit<Goal, "id" | "createdAt">) {
    if (!uid) return;
    const { id, ...goalData } = g;
    
    if (id) {
      await updateGoal(uid, id, goalData);
    } else {
      await addGoal(uid, goalData as Omit<Goal, "id" | "createdAt">);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function deleteGoal(id: string) {
    if (!uid) return;
    if (confirm("Bạn có chắc chắn muốn xóa mục tiêu này?")) {
      await deleteGoalFromFirebase(uid, id);
    }
  }

  async function updateProgress(id: string, delta: number) {
    if (!uid) return;
    const goal = goals.find(x => x.id === id);
    if (!goal) return;
    const next = Math.min(goal.current + delta, goal.target);
    await updateGoal(uid, id, { 
      current: next, 
      status: next >= goal.target ? "done" : goal.status 
    });
  }

  function openAdd()           { setEditing(null); openModal(); }
  function openEdit(g: Goal)   { setEditing(g);    openModal(); }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* ── Stats header ── */}
        <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3 space-y-4">
          <LunarCountdownBadge />
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Target, label: "Đang làm",    value: active.length, color: "var(--primary)", bg: "var(--secondary)" },
              { icon: Trophy, label: "Hoàn thành",  value: done.length,   color: "#10B981",        bg: "#ECFDF5" },
              { icon: Flame,  label: "Streak",       value: `${streak}🔥`, color: "#F59E0B",        bg: "#FFFBEB" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="text-foreground" style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1 }}>{value}</p>
                <p className="text-muted-foreground w-full truncate" style={{ fontSize: "0.65rem" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          {goals.length > 0 && (
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Tiến độ tổng thể</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)" }}>
                    {Math.round((done.length / goals.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((done.length / goals.length) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <TrendingUp size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            </div>
          )}

          {/* Filters */}
          {/* Status filter */}
          <div className="flex gap-1.5">
            {(["all", "active", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
                style={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                {f === "all" ? "Tất cả" : f === "active" ? "Đang làm" : "Hoàn thành"}
              </button>
            ))}
          </div>
          {/* Category filter — scroll ngang */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 lg:-mx-6 px-4 lg:px-6">
            <button
              onClick={() => setCatFilter("all")}
              className={`px-3 py-1 rounded-lg flex-shrink-0 transition-all ${catFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              Tất cả
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
                className="px-3 py-1 rounded-lg flex-shrink-0 transition-all"
                style={{
                  fontSize: "0.75rem", fontWeight: 600,
                  background: catFilter === cat ? CAT_COLOR[cat].bg : "var(--muted)",
                  color: catFilter === cat ? CAT_COLOR[cat].text : "var(--muted-foreground)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Goal list ── */}
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
                    <Target size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-foreground" style={{ fontWeight: 600 }}>Chưa có mục tiêu nào</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                    Thêm mục tiêu đầu tiên để bắt đầu hành trình!
                  </p>
                  <button
                    onClick={openAdd}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground"
                    style={{ fontWeight: 600, fontSize: "0.875rem" }}
                  >
                    <Plus size={16} /> Thêm mục tiêu
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
                  <AnimatePresence>
                    {visible.map(goal => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={openEdit}
                        onDelete={deleteGoal}
                        onUpdateProgress={updateProgress}
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
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <GoalForm
            initial={editing}
            onSave={saveGoal}
            onClose={() => { closeModal(); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
