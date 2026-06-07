import { useState } from "react";
import { Plus, Calendar, Target } from "lucide-react";
import { GoalSheet } from "./FinanceForms";
import { fmt, fmtFull } from "./financeStore";
import type { Goal } from "./financeStore";

function monthsUntil(dateStr: string) {
  const target = new Date(dateStr + "-01");
  const now    = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

function monthlyNeeded(goal: Goal) {
  const months = monthsUntil(goal.deadline);
  if (months <= 0) return 0;
  return Math.ceil((goal.target - goal.saved) / months);
}

interface GoalsTabProps {
  goals: Goal[];
  onSave:   (item: Goal)   => void;
  onDelete: (id: number)   => void;
}

export function GoalsTab({ goals, onSave, onDelete }: GoalsTabProps) {
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editingGoal,  setEditingGoal]  = useState<Goal | null>(null);

  const totalTargets = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved   = goals.reduce((s, g) => s + g.saved,  0);

  function openAdd()  { setEditingGoal(null);  setSheetOpen(true); }
  function openEdit(g: Goal) { setEditingGoal(g); setSheetOpen(true); }

  return (
    <>
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-2xl p-4">
            <Target size={16} className="text-primary mb-2" />
            <p className="text-sm font-bold text-foreground">{goals.length} mục tiêu</p>
            <p className="text-xs text-muted-foreground mt-0.5">đang theo dõi</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Đã tích lũy</p>
            <p className="text-sm font-bold text-green-600">{fmt(totalSaved)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">/ {fmt(totalTargets)} tổng mục tiêu</p>
          </div>
        </div>

        {/* Goal cards */}
        {goals.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Chưa có mục tiêu nào. Hãy thêm mục tiêu đầu tiên! 🎯
          </div>
        )}

        <div className="space-y-3">
          {goals.map((goal) => {
            const pct     = Math.min(100, Math.round((goal.saved / goal.target) * 100));
            const months  = monthsUntil(goal.deadline);
            const monthly = monthlyNeeded(goal);
            const done    = pct >= 100;

            return (
              <div key={goal.id}
                onClick={() => openEdit(goal)}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: goal.color + "18" }}>
                    {goal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{goal.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Calendar size={11} />
                      <span>Mục tiêu: {goal.deadline}</span>
                      {months > 0 && <span>· còn {months} tháng</span>}
                    </div>
                  </div>
                  {done ? (
                    <span className="shrink-0 text-[11px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">Đạt! 🎉</span>
                  ) : (
                    <span className="shrink-0 text-[11px] bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">{pct}%</span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                  </div>
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Đã có"    value={fmt(goal.saved)}                            color="text-foreground" />
                  <Stat label="Còn thiếu" value={fmt(Math.max(0, goal.target - goal.saved))} color="text-muted-foreground" />
                  <Stat label="Mục tiêu" value={fmt(goal.target)}                            color="text-foreground" />
                </div>

                {/* Monthly suggestion */}
                {!done && monthly > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Cần để dành thêm{" "}
                      <span className="font-semibold" style={{ color: goal.color }}>{fmtFull(monthly)}/tháng</span>
                      {" "}để đạt mục tiêu đúng hạn.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add button */}
        <button onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
          <Plus size={16} /> Thêm mục tiêu tài chính
        </button>
      </div>

      <GoalSheet
        open={sheetOpen}
        editing={editingGoal}
        onClose={() => setSheetOpen(false)}
        onSave={onSave}
        onDelete={onDelete}
        items={goals}
      />
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-muted/50 rounded-xl px-3 py-2 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
