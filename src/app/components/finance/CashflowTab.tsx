import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { TransactionSheet } from "./FinanceForms";
import { fmt, fmtFull } from "./financeStore";
import type { IncomeItem, ExpenseItem } from "./financeStore";

type View = "expense" | "income";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground mt-0.5">{fmtFull(payload[0].value)}</p>
    </div>
  );
};

interface CashflowTabProps {
  incomeItems:  IncomeItem[];
  expenseItems: ExpenseItem[];
  onSaveIncome:  (item: IncomeItem)  => void;
  onSaveExpense: (item: ExpenseItem) => void;
  onDeleteIncome:  (id: number) => void;
  onDeleteExpense: (id: number) => void;
}

export function CashflowTab({
  incomeItems, expenseItems,
  onSaveIncome, onSaveExpense,
  onDeleteIncome, onDeleteExpense,
}: CashflowTabProps) {
  const [view, setView] = useState<View>("expense");

  /* Sheet state */
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | ExpenseItem | null>(null);

  const items        = view === "expense" ? expenseItems : incomeItems;
  const total        = items.reduce((s, i) => s + i.amount, 0);
  const totalIncome  = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);
  const balance      = totalIncome - totalExpense;

  function openAdd()   { setEditingItem(null); setSheetOpen(true); }
  function openEdit(item: IncomeItem | ExpenseItem) { setEditingItem(item); setSheetOpen(true); }

  function handleSave(item: IncomeItem | ExpenseItem) {
    if (view === "income")  onSaveIncome(item as IncomeItem);
    else                     onSaveExpense(item as ExpenseItem);
  }
  function handleDelete(id: number) {
    if (view === "income")  onDeleteIncome(id);
    else                     onDeleteExpense(id);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Thu nhập" value={totalIncome}  color="text-primary" bg="bg-secondary"  icon={TrendingUp}   iconColor="text-primary" />
          <SummaryCard label="Chi tiêu"  value={totalExpense} color="text-accent"  bg="bg-orange-50"  icon={TrendingDown}  iconColor="text-accent" />
          <div className={`rounded-2xl p-3 flex flex-col gap-1 ${balance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-[10px] text-muted-foreground">Còn lại</p>
            <p className={`text-sm font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
              {balance >= 0 ? "+" : ""}{fmt(balance)}
            </p>
            <p className="text-[10px] text-muted-foreground">{balance >= 0 ? "Dư" : "Thiếu"}</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(["expense","income"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-sm transition-all duration-200 ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              {v === "expense" ? "Chi tiêu" : "Thu nhập"}
            </button>
          ))}
        </div>

        {/* Donut + legend */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <PieChart width={160} height={160}>
                <Pie data={items} dataKey="amount" nameKey="category"
                  cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                  strokeWidth={2} stroke="var(--card)"
                >
                  {items.map((item, idx) => (
                    <Cell key={`cf-cell-${idx}`} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-muted-foreground">{view === "expense" ? "Tổng chi" : "Tổng thu"}</p>
                <p className="text-sm font-bold text-foreground">{fmt(total)}</p>
              </div>
            </div>

            <ul className="flex-1 w-full space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => openEdit(item)}>
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground truncate group-hover:text-primary transition-colors">{item.category}</span>
                      <span className="text-muted-foreground shrink-0 ml-1">{Math.round((item.amount / total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(item.amount / total) * 100}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground shrink-0 w-14 text-right">{fmt(item.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">
              {view === "expense" ? "Khoản chi" : "Nguồn thu"} tháng 6
            </p>
            <button onClick={openAdd} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Thêm
            </button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chưa có dữ liệu. Nhấn + để thêm.
            </div>
          )}

          <ul className="space-y-0.5">
            {[...items].sort((a, b) => b.amount - a.amount).map((item, idx) => (
              <li key={idx}
                onClick={() => openEdit(item)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: item.color + "22" }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.category}</p>
                  <p className="text-xs text-muted-foreground">{Math.round((item.amount / total) * 100)}% tổng {view === "expense" ? "chi" : "thu"}</p>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${view === "expense" ? "text-red-500" : "text-green-600"}`}>
                  {view === "expense" ? "−" : "+"}{fmtFull(item.amount)}
                </p>
              </li>
            ))}
          </ul>

          <button onClick={openAdd}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            <Plus size={14} /> Thêm {view === "expense" ? "khoản chi" : "nguồn thu"}
          </button>
        </div>
      </div>

      <TransactionSheet
        type={view}
        open={sheetOpen}
        editing={editingItem}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        items={items}
      />
    </>
  );
}

function SummaryCard({ label, value, color, bg, icon: Icon, iconColor }: {
  label: string; value: number; color: string; bg: string;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-3 flex flex-col gap-1`}>
      <Icon size={14} className={iconColor} />
      <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
