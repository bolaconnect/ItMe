import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { X, ShieldPlus, Flame, Target as TargetIcon } from "lucide-react";
import { useAppStore, Habit } from "../store/useAppStore";
import { Goal } from "../../lib/goalsService";
import { auth } from "../../lib/firebase";
import { updateSettings } from "../../lib/settingsService";
import { updateHabit } from "../../lib/habitsService";
import { updateGoal } from "../../lib/goalsService";

function getPast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i)); // Past 7 days excluding today
    return d.toISOString().slice(0, 10);
  }).reverse();
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface StreakRecoveryModalProps {
  onClose: () => void;
  filterType?: "habit" | "goal" | "all";
  filterItemId?: string;
}

export function StreakRecoveryModal({ onClose, filterType = "all", filterItemId }: StreakRecoveryModalProps) {
  const { habits, goals, settings } = useAppStore();
  const uid = auth.currentUser?.uid;

  // 1. Calculate limits
  const totalItems = habits.length + goals.length;
  const maxRecoveries = Math.ceil(totalItems / 3) * 5;

  const currentMonth = new Date().toISOString().slice(0, 7);
  let usedThisMonth = 0;
  if (settings?.streakRecovery?.month === currentMonth) {
    usedThisMonth = settings.streakRecovery.used;
  }
  const remaining = Math.max(0, maxRecoveries - usedThisMonth);

  // 2. Find missing days
  const past7 = getPast7Days();

  function getISODate(createdAt: any) {
    if (!createdAt) return "1970-01-01";
    try {
      if (createdAt.seconds) return new Date(createdAt.seconds * 1000).toISOString().slice(0, 10);
      if (createdAt.toDate) return createdAt.toDate().toISOString().slice(0, 10);
      return new Date(createdAt).toISOString().slice(0, 10);
    } catch {
      return "1970-01-01";
    }
  }

  const missingHabits = (filterType === "all" || filterType === "habit") ? habits.filter(h => !filterItemId || h.id === filterItemId).flatMap(h => {
    const createdDate = getISODate(h.createdAt);
    return past7
      .filter(date => date >= createdDate && !h.completedDates.includes(date))
      .map(date => ({ type: "habit" as const, item: h, date }));
  }) : [];

  const missingGoals = (filterType === "all" || filterType === "goal") ? goals.filter(g => !filterItemId || g.id === filterItemId).flatMap(g => {
    const createdDate = getISODate(g.createdAt);
    return past7
      .filter(date => date >= createdDate && !(g.completedDates || []).includes(date))
      .map(date => ({ type: "goal" as const, item: g as any, date }));
  }) : [];

  const allMissing = [...missingHabits, ...missingGoals].sort((a, b) => b.date.localeCompare(a.date));

  const [loading, setLoading] = useState(false);

  async function handleRecover(miss: typeof allMissing[0]) {
    if (!uid || remaining <= 0 || loading) return;
    setLoading(true);
    try {
      // Consume 1 recovery point
      await updateSettings(uid, {
        streakRecovery: {
          month: currentMonth,
          used: usedThisMonth + 1,
        }
      });

      // Update item
      if (miss.type === "habit") {
        const h = miss.item as Habit;
        const newDates = [...h.completedDates, miss.date].sort();
        // Recalculate streak naively (just increment for simplicity of recovery, or recalculate properly)
        // Here we just add the date and let the next check-in handle real streak math, but let's increment streak by 1 locally
        await updateHabit(uid, h.id, {
          completedDates: newDates,
          streak: h.streak + 1,
          best: Math.max(h.best, h.streak + 1)
        });
      } else {
        const g = miss.item as Goal;
        const newDates = [...(g.completedDates || []), miss.date].sort();
        await updateGoal(uid, g.id, {
          completedDates: newDates,
          streak: (g.streak || 0) + 1,
          best: Math.max(g.best || 0, (g.streak || 0) + 1)
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        initial={{ y: 24, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.95 }}
      >
        <div className="p-6 pb-4 bg-primary/10 border-b border-primary/20 shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <ShieldPlus size={24} />
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-background/50 hover:bg-background text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground">Khôi phục chuỗi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bạn có <strong className="text-primary">{remaining}</strong>/{maxRecoveries} lượt khôi phục trong tháng này.
          </p>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {allMissing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldPlus size={32} className="mx-auto mb-2 opacity-50" />
              <p>Bạn không bỏ lỡ ngày nào trong tuần qua!</p>
            </div>
          ) : (
            allMissing.map((miss, idx) => {
              const d = new Date(miss.date);
              const label = `${DAY_LABELS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: miss.item.color + "20", color: miss.item.color }}>
                      {miss.type === "habit" ? <Flame size={18} /> : <TargetIcon size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{miss.type === "habit" ? miss.item.name : miss.item.title}</p>
                      <p className="text-xs text-muted-foreground font-medium">Bỏ lỡ: {label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRecover(miss)}
                    disabled={remaining <= 0 || loading}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs disabled:opacity-50 transition-transform active:scale-95"
                  >
                    Cứu chuỗi
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
