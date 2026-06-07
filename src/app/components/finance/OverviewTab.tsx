import { useId } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Shield, Wallet } from "lucide-react";
import { MONTHLY_TREND, fmt, fmtFull } from "./financeStore";
import type { IncomeItem, ExpenseItem, Goal, Asset, Liability } from "./financeStore";

interface OverviewTabProps {
  incomeItems:  IncomeItem[];
  expenseItems: ExpenseItem[];
  goals:        Goal[];
  assets:       Asset[];
  liabilities:  Liability[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-primary font-medium">Thu: {fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-accent font-medium">Chi: {fmt(payload[1]?.value ?? 0)}</p>
    </div>
  );
};

export function OverviewTab({ incomeItems, expenseItems, goals, assets, liabilities }: OverviewTabProps) {
  const uid = useId().replace(/:/g, "");
  const totalIncome  = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);
  const totalAssets  = assets.reduce((s, i) => s + i.value, 0);
  const totalLiab    = liabilities.reduce((s, i) => s + i.remaining, 0);
  const netWorth     = totalAssets - totalLiab;
  const savingRate   = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const emergencyGoal = goals.find((g) => g.name === "Quỹ khẩn cấp");
  const cashflow      = totalIncome - totalExpense;
  const cfPositive    = cashflow >= 0;

  return (
    <div className="space-y-4">
      {/* Net worth hero */}
      <div className="bg-primary rounded-2xl p-5 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <p className="text-primary-foreground/70 text-xs uppercase tracking-wide mb-1">Tài sản ròng</p>
        <p className="text-primary-foreground font-bold" style={{ fontSize: "1.9rem" }}>{fmt(netWorth)}</p>
        <p className="text-primary-foreground/60 text-xs mt-1">
          Tài sản {fmt(totalAssets)} − Nợ {fmt(totalLiab)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Thu tháng này", value: fmt(totalIncome),  icon: TrendingUp,   up: true },
            { label: "Chi tháng này", value: fmt(totalExpense), icon: TrendingDown,  up: false },
            { label: "Tiết kiệm",     value: `${savingRate}%`,  icon: Wallet,        up: savingRate > 0 },
          ].map(({ label, value, icon: Icon, up }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <Icon size={14} className={up ? "text-green-300" : "text-orange-300"} />
              <p className="text-primary-foreground font-semibold mt-1 text-sm">{value}</p>
              <p className="text-primary-foreground/60 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cash flow banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
        cfPositive ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"
      }`}>
        {cfPositive ? <TrendingUp size={18} className="shrink-0" /> : <TrendingDown size={18} className="shrink-0" />}
        <div>
          <p className="text-sm font-medium">
            {cfPositive ? `Còn dư ${fmt(Math.abs(cashflow))} tháng này` : `Chi vượt ${fmt(Math.abs(cashflow))} tháng này`}
          </p>
          <p className="text-xs opacity-70">
            {cfPositive ? "Tốt! Hãy để dành hoặc đầu tư phần dư." : "Xem lại các khoản chi để cân bằng."}
          </p>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Thu / Chi 6 tháng</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id={`${uid}inc`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B4CF5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#5B4CF5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${uid}exp`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF8A65" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FF8A65" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A7890" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#7A7890" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income"  stroke="#5B4CF5" strokeWidth={2} fill={`url(#${uid}inc)`} dot={false} />
            <Area type="monotone" dataKey="expense" stroke="#FF8A65" strokeWidth={2} fill={`url(#${uid}exp)`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Thu nhập
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-accent rounded-full inline-block" /> Chi tiêu
          </span>
        </div>
      </div>

      {/* Emergency fund */}
      {emergencyGoal && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-green-500" />
            <p className="text-sm font-semibold text-foreground">Quỹ khẩn cấp</p>
            <span className="ml-auto text-xs text-muted-foreground">
              {Math.round((emergencyGoal.saved / emergencyGoal.target) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(emergencyGoal.saved / emergencyGoal.target) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Đã có: {fmtFull(emergencyGoal.saved)}</span>
            <span>Mục tiêu: {fmtFull(emergencyGoal.target)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            ≈ {totalExpense > 0 ? Math.floor(emergencyGoal.saved / totalExpense) : 0} tháng chi tiêu. Mục tiêu 3–6 tháng.
          </p>
        </div>
      )}
    </div>
  );
}
