import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Tooltip as PieTooltip,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Shield, Plus, X,
  ChevronDown, ChevronUp, ChevronRight, AlertCircle, Calendar, Target,
  Loader2, SlidersHorizontal,
} from "lucide-react";
import {
  TransactionSheet, AssetSheet, LiabilitySheet,
  InvestmentSheet, InsuranceSheet, GoalSheet,
} from "./finance/FinanceForms";
import { MONTHLY_TREND, fmt, fmtFull } from "./finance/financeStore";
import type {
  IncomeItem, ExpenseItem, Asset, Liability,
  Investment, Insurance, Goal,
} from "./finance/financeStore";
import { auth } from "../../lib/firebase";
import { subscribeSettings, updateSettings } from "../../lib/settingsService";
import {
  subscribeIncome, subscribeExpense, subscribeAssets, subscribeLiabilities,
  subscribeInvestments, subscribeInsurance, subscribeGoals,
  addIncome, addExpense, addAsset, addLiability,
  addInvestment, addInsuranceItem, addGoal,
  updateIncome, updateExpense, updateAsset, updateLiability,
  updateInvestment, updateInsuranceItem, updateGoal,
  deleteIncome, deleteExpense, deleteAsset, deleteLiability,
  deleteInvestment, deleteInsuranceItem, deleteGoal,
} from "../../lib/financeService";

/* ── ID helpers ── */
type WithFid<T> = T & { _fid: string };
let _counter = 1;
const _fidToNum = new Map<string, number>();
function toNumId(fid: string): number {
  if (!_fidToNum.has(fid)) _fidToNum.set(fid, _counter++);
  return _fidToNum.get(fid)!;
}
function attachNumId<T extends Record<string, any>>(item: T & { id: string }): T & { _fid: string; id: number } {
  const { id: fid, ...rest } = item;
  return { ...rest as any, id: toNumId(fid), _fid: fid };
}
function mapItems<T extends Record<string, any>>(items: (T & { id: string })[]): (T & { _fid: string; id: number })[] {
  return items.map(attachNumId);
}
function getFid<T extends { id: number; _fid: string }>(list: T[], numId: number): string | undefined {
  return list.find(i => i.id === numId)?._fid;
}

/* ── Section config ── */
type SectionId = "overview" | "cashflow" | "assets" | "invest" | "goals";
const SECTIONS: { id: SectionId; label: string; emoji: string }[] = [
  { id: "overview",  label: "Tổng quan", emoji: "📊" },
  { id: "cashflow",  label: "Thu & Chi",  emoji: "💸" },
  { id: "assets",    label: "Tài sản",    emoji: "🏦" },
  { id: "invest",    label: "Đầu tư",     emoji: "📈" },
  { id: "goals",     label: "Mục tiêu",   emoji: "🎯" },
];

/* ── Custom tooltips ── */
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-primary font-medium">Thu: {fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-accent font-medium">Chi: {fmt(payload[1]?.value ?? 0)}</p>
    </div>
  );
};
const PieCustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground mt-0.5">{fmtFull(payload[0].value)}</p>
    </div>
  );
};

/* ── Section wrapper with collapse ── */
function Section({
  id, emoji, label, extra, children, collapsible = false
}: {
  id: string; emoji: string; label: string;
  extra?: React.ReactNode; children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={`section-${id}`} className="scroll-mt-16">
      <div
        className={`flex items-center gap-2 mb-3 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <span className="text-base">{emoji}</span>
        <p className="text-sm font-semibold text-foreground flex-1">{label}</p>
        {extra}
        {collapsible && (
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        )}
      </div>
      <AnimatePresence initial={false}>
        {(!collapsible || open) && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export function FinancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const TOTAL_COLLS = 7;

  const [incomeItems,  setIncomeItems]  = useState<WithFid<IncomeItem>[]>([]);
  const [expenseItems, setExpenseItems] = useState<WithFid<ExpenseItem>[]>([]);
  const [assets,       setAssets]       = useState<WithFid<Asset>[]>([]);
  const [liabilities,  setLiabilities]  = useState<WithFid<Liability>[]>([]);
  const [investments,  setInvestments]  = useState<WithFid<Investment>[]>([]);
  const [insurance,    setInsurance]    = useState<WithFid<Insurance>[]>([]);
  const [goals,        setGoals]        = useState<WithFid<Goal>[]>([]);

  /* Section order config */
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(
    SECTIONS.map(s => s.id)
  );
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  /* FAB state */
  const [fabOpen, setFabOpen] = useState(false);

  /* Sheet states */
  const [txSheet,    setTxSheet]    = useState<{ type: "income"|"expense"; editing: any|null }|null>(null);
  const [assetSheet, setAssetSheet] = useState<{ editing: Asset|null }|null>(null);
  const [liabSheet,  setLiabSheet]  = useState<{ editing: Liability|null }|null>(null);
  const [invSheet,   setInvSheet]   = useState<{ editing: Investment|null }|null>(null);
  const [insSheet,   setInsSheet]   = useState<{ editing: Insurance|null }|null>(null);
  const [goalSheet,  setGoalSheet]  = useState<{ editing: Goal|null }|null>(null);

  /* Cashflow view toggle */
  const [cfView, setCfView] = useState<"expense"|"income">("expense");

  /* Assets expand */
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [liabExpanded,   setLiabExpanded]   = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    setLoadedCount(0);
    const loaded = () => setLoadedCount(c => c + 1);
    const subs = [
      subscribeIncome(uid,      (d) => { setIncomeItems(mapItems(d)  as any); loaded(); }),
      subscribeExpense(uid,     (d) => { setExpenseItems(mapItems(d) as any); loaded(); }),
      subscribeAssets(uid,      (d) => { setAssets(mapItems(d)       as any); loaded(); }),
      subscribeLiabilities(uid, (d) => { setLiabilities(mapItems(d) as any); loaded(); }),
      subscribeInvestments(uid, (d) => { setInvestments(mapItems(d) as any); loaded(); }),
      subscribeInsurance(uid,   (d) => { setInsurance(mapItems(d)   as any); loaded(); }),
      subscribeGoals(uid,       (d) => { setGoals(mapItems(d)       as any); loaded(); }),
      subscribeSettings(uid, (data) => {
        if (data.financeSectionOrder && data.financeSectionOrder.length > 0) {
          const savedOrder = data.financeSectionOrder as SectionId[];
          const allSectionIds = SECTIONS.map(s => s.id);
          const validOrder = savedOrder.filter(id => allSectionIds.includes(id));
          const missing = allSectionIds.filter(id => !validOrder.includes(id));
          setSectionOrder([...validOrder, ...missing]);
        }
      }),
    ];
    return () => subs.forEach(u => u());
  }, [uid]);

  useEffect(() => { if (loadedCount >= TOTAL_COLLS) setIsLoading(false); }, [loadedCount]);

  /* ── Save helpers ── */
  async function handleSaveIncome(item: IncomeItem) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateIncome(uid, _fid, data); else await addIncome(uid, data);
  }
  async function handleSaveExpense(item: ExpenseItem) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateExpense(uid, _fid, data); else await addExpense(uid, data);
  }
  async function handleSaveAsset(item: Asset) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateAsset(uid, _fid, data); else await addAsset(uid, data);
  }
  async function handleSaveLiability(item: Liability) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateLiability(uid, _fid, data); else await addLiability(uid, data);
  }
  async function handleSaveInvestment(item: Investment) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateInvestment(uid, _fid, data); else await addInvestment(uid, data);
  }
  async function handleSaveInsurance(item: Insurance) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateInsuranceItem(uid, _fid, data); else await addInsuranceItem(uid, data);
  }
  async function handleSaveGoal(item: Goal) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateGoal(uid, _fid, data); else await addGoal(uid, data);
  }

  /* ── Delete helpers ── */
  async function handleDeleteIncome(numId: number)     { const f = getFid(incomeItems, numId);  if (uid && f) await deleteIncome(uid, f); }
  async function handleDeleteExpense(numId: number)    { const f = getFid(expenseItems, numId); if (uid && f) await deleteExpense(uid, f); }
  async function handleDeleteAsset(numId: number)      { const f = getFid(assets, numId);       if (uid && f) await deleteAsset(uid, f); }
  async function handleDeleteLiability(numId: number)  { const f = getFid(liabilities, numId); if (uid && f) await deleteLiability(uid, f); }
  async function handleDeleteInvestment(numId: number) { const f = getFid(investments, numId);  if (uid && f) await deleteInvestment(uid, f); }
  async function handleDeleteInsurance(numId: number)  { const f = getFid(insurance, numId);    if (uid && f) await deleteInsuranceItem(uid, f); }
  async function handleDeleteGoal(numId: number)       { const f = getFid(goals, numId);        if (uid && f) await deleteGoal(uid, f); }

  /* ── Computed values ── */
  const totalIncome  = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);
  const totalAssets  = assets.reduce((s, a) => s + a.value, 0);
  const totalLiab    = liabilities.reduce((s, l) => s + l.remaining, 0);
  const netWorth     = totalAssets - totalLiab;
  const savingRate   = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const cashflow     = totalIncome - totalExpense;
  const cfPositive   = cashflow >= 0;
  const cfItems      = cfView === "expense" ? expenseItems : incomeItems;
  const cfTotal      = cfItems.reduce((s, i) => s + i.amount, 0);
  const totalInvest  = investments.reduce((s, i) => s + i.value, 0);
  const emergencyGoal = goals.find(g => g.name === "Quỹ khẩn cấp");
  const assetGroups  = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.group] = (acc[a.group] ?? 0) + a.value; return acc;
  }, {});
  const assetPieData = Object.entries(assetGroups).map(([name, value]) => ({ name, value }));

  const GROUP_COLORS: Record<string, string> = {
    "Tiền & Ngân hàng": "#5B4CF5", "Vàng & Hàng hóa": "#FFD700",
    "Đầu tư": "#FF8A65", "Tài sản cố định": "#98D8C8", "Khác": "#C7D2FE",
  };

  /* ── Scroll to section ── */
  function scrollTo(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="text-muted-foreground text-sm">Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }

  /* ── Section renderers ── */
  function renderSection(id: SectionId, dragIdx: number) {
    const meta = SECTIONS.find(s => s.id === id)!;
    switch (id) {
      /* ── OVERVIEW ── */
      case "overview": return (
        <Section key={id} id={id} emoji={meta.emoji} label={meta.label}>
          {/* Hero net worth */}
          <div className="bg-primary rounded-2xl p-5 text-primary-foreground relative overflow-hidden mb-3">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
            <p className="text-primary-foreground/70 text-xs uppercase tracking-wide mb-1">Tài sản ròng</p>
            <p className="text-primary-foreground font-bold" style={{ fontSize: "1.9rem" }}>{fmt(netWorth)}</p>
            <p className="text-primary-foreground/60 text-xs mt-1">
              Tài sản {fmt(totalAssets)} − Nợ {fmt(totalLiab)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Thu tháng này", value: fmt(totalIncome),  icon: TrendingUp,  up: true  },
                { label: "Chi tháng này", value: fmt(totalExpense), icon: TrendingDown, up: false },
                { label: "Tiết kiệm",    value: `${savingRate}%`,  icon: Wallet,       up: savingRate > 0 },
              ].map(({ label, value, icon: Icon, up }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3">
                  <Icon size={14} className={up ? "text-green-300" : "text-orange-300"} />
                  <p className="text-primary-foreground font-semibold mt-1 text-sm">{value}</p>
                  <p className="text-primary-foreground/60 text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cashflow banner */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-3 ${
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

          {/* Area chart */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-3">
            <p className="text-sm font-semibold text-foreground mb-4">Thu / Chi 6 tháng</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="finInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5B4CF5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#5B4CF5" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="finExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF8A65" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF8A65" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A7890" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#7A7890" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                <RechartTooltip content={<AreaTooltip />} />
                <Area type="monotone" dataKey="income"  stroke="#5B4CF5" strokeWidth={2} fill="url(#finInc)" dot={false} />
                <Area type="monotone" dataKey="expense" stroke="#FF8A65" strokeWidth={2} fill="url(#finExp)" dot={false} />
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
                <div className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100,(emergencyGoal.saved / emergencyGoal.target) * 100)}%` }} />
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
        </Section>
      );

      /* ── CASHFLOW ── */
      case "cashflow": return (
        <Section key={id} id={id} emoji={meta.emoji} label={meta.label}
          extra={
            <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
              {(["expense","income"] as const).map(v => (
                <button key={v} onClick={e => { e.stopPropagation(); setCfView(v); }}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${
                    cfView === v ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground"
                  }`}>
                  {v === "expense" ? "Chi" : "Thu"}
                </button>
              ))}
            </div>
          }
        >
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-secondary rounded-2xl p-3 flex flex-col gap-1">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-sm font-bold text-primary">{fmt(totalIncome)}</p>
              <p className="text-[10px] text-muted-foreground">Thu nhập</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 flex flex-col gap-1">
              <TrendingDown size={14} className="text-accent" />
              <p className="text-sm font-bold text-accent">{fmt(totalExpense)}</p>
              <p className="text-[10px] text-muted-foreground">Chi tiêu</p>
            </div>
            <div className={`rounded-2xl p-3 flex flex-col gap-1 ${cashflow >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <p className="text-[10px] text-muted-foreground">Còn lại</p>
              <p className={`text-sm font-bold ${cashflow >= 0 ? "text-green-600" : "text-red-500"}`}>
                {cashflow >= 0 ? "+" : ""}{fmt(cashflow)}
              </p>
              <p className="text-[10px] text-muted-foreground">{cashflow >= 0 ? "Dư" : "Thiếu"}</p>
            </div>
          </div>

          {/* Donut + list */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <PieChart width={160} height={160}>
                  <Pie data={cfItems} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                    strokeWidth={2} stroke="var(--card)">
                    {cfItems.map((item, idx) => (
                      <Cell key={`cf-${idx}`} fill={item.color} />
                    ))}
                  </Pie>
                  <PieTooltip content={<PieCustomTooltip />} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-muted-foreground">{cfView === "expense" ? "Tổng chi" : "Tổng thu"}</p>
                  <p className="text-sm font-bold text-foreground">{fmt(cfTotal)}</p>
                </div>
              </div>
              <ul className="flex-1 w-full space-y-2">
                {cfItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => setTxSheet({ type: cfView, editing: item })}>
                    <span className="text-base">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground truncate group-hover:text-primary transition-colors">{item.category}</span>
                        <span className="text-muted-foreground shrink-0 ml-1">
                          {cfTotal > 0 ? Math.round((item.amount / cfTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: cfTotal > 0 ? `${(item.amount / cfTotal) * 100}%` : "0%",
                          backgroundColor: item.color
                        }} />
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
                {cfView === "expense" ? "Khoản chi" : "Nguồn thu"} tháng {new Date().getMonth() + 1}
              </p>
              <button onClick={() => setTxSheet({ type: cfView, editing: null })}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> Thêm
              </button>
            </div>
            {cfItems.length === 0 && (
              <p className="text-center py-8 text-sm text-muted-foreground">Chưa có dữ liệu. Nhấn + để thêm.</p>
            )}
            <ul className="space-y-0.5">
              {[...cfItems].sort((a, b) => b.amount - a.amount).map((item, idx) => (
                <li key={idx} onClick={() => setTxSheet({ type: cfView, editing: item })}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: item.color + "22" }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {cfTotal > 0 ? Math.round((item.amount / cfTotal) * 100) : 0}% tổng {cfView === "expense" ? "chi" : "thu"}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${cfView === "expense" ? "text-red-500" : "text-green-600"}`}>
                    {cfView === "expense" ? "−" : "+"}{fmtFull(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
            <button onClick={() => setTxSheet({ type: cfView, editing: null })}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              <Plus size={14} /> Thêm {cfView === "expense" ? "khoản chi" : "nguồn thu"}
            </button>
          </div>
        </Section>
      );

      /* ── ASSETS ── */
      case "assets": return (
        <Section key={id} id={id} emoji={meta.emoji} label={meta.label}>
          {/* Net worth summary + toggle */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-3">
            <p className="text-xs text-muted-foreground mb-1">Tài sản ròng (Net Worth)</p>
            <p className="text-foreground font-bold" style={{ fontSize: "1.6rem" }}>{fmtFull(netWorth)}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={() => setAssetsExpanded(o => !o)}
                className={`rounded-xl p-3 text-left border transition-all ${
                  assetsExpanded ? "border-primary bg-secondary" : "border-border bg-muted/40"
                }`}>
                <p className="text-xs text-muted-foreground">Tổng tài sản</p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">{fmtFull(totalAssets)}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                  {assetsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  {assetsExpanded ? "Ẩn bớt" : "Xem chi tiết"}
                </p>
              </button>
              <button onClick={() => setLiabExpanded(o => !o)}
                className={`rounded-xl p-3 text-left border transition-all ${
                  liabExpanded ? "border-destructive bg-red-50" : "border-border bg-muted/40"
                }`}>
                <p className="text-xs text-muted-foreground">Tổng nợ</p>
                <p className="text-sm font-semibold text-red-500 mt-0.5">−{fmtFull(totalLiab)}</p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                  {liabExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  {liabExpanded ? "Ẩn bớt" : "Xem chi tiết"}
                </p>
              </button>
            </div>
          </div>

          {/* Expanded assets detail */}
          <AnimatePresence initial={false}>
            {assetsExpanded && (
              <motion.div key="assets-detail"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}>
                <div className="bg-card rounded-2xl border border-border p-5 mb-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-foreground">Danh sách tài sản</p>
                    <button onClick={() => setAssetSheet({ editing: null })}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus size={12} /> Thêm
                    </button>
                  </div>

                  {/* Mini pie */}
                  {assets.length > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative shrink-0">
                        <PieChart width={120} height={120}>
                          <Pie data={assetPieData} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" innerRadius={38} outerRadius={56}
                            strokeWidth={2} stroke="var(--card)">
                            {assetPieData.map((entry, idx) => (
                              <Cell key={`ap-${idx}`} fill={GROUP_COLORS[entry.name] ?? "#ccc"} />
                            ))}
                          </Pie>
                          <PieTooltip content={<PieCustomTooltip />} />
                        </PieChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-[9px] text-muted-foreground">Tổng</p>
                          <p className="text-[10px] font-bold text-foreground">{fmt(totalAssets)}</p>
                        </div>
                      </div>
                      <ul className="flex-1 space-y-1.5">
                        {assetPieData.map((entry, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[entry.name] }} />
                            <span className="text-xs text-foreground flex-1 truncate">{entry.name}</span>
                            <span className="text-xs font-medium text-foreground">{fmt(entry.value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có tài sản nào.</p>
                  )}
                  {Object.entries(assetGroups).map(([group]) => (
                    <div key={group} className="mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{group}</p>
                      <ul className="space-y-0.5">
                        {assets.filter(a => a.group === group).map(asset => (
                          <li key={asset.id} onClick={() => setAssetSheet({ editing: asset })}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                            <span className="text-lg">{asset.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{asset.name}</p>
                              <p className="text-[11px] text-muted-foreground">{asset.liquid ? "Thanh khoản cao" : "Ít thanh khoản"}</p>
                            </div>
                            <p className="text-sm font-semibold text-green-600 shrink-0">{fmtFull(asset.value)}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <button onClick={() => setAssetSheet({ editing: null })}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={14} /> Thêm tài sản
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded liabilities detail */}
          <AnimatePresence initial={false}>
            {liabExpanded && (
              <motion.div key="liab-detail"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}>
                <div className="bg-card rounded-2xl border border-border p-5 mb-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-foreground">Khoản nợ phải trả</p>
                    <button onClick={() => setLiabSheet({ editing: null })}
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus size={12} /> Thêm
                    </button>
                  </div>
                  {liabilities.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Không có khoản nợ 🎉</p>}
                  <ul className="space-y-3">
                    {liabilities.map(liab => {
                      const paidPct = liab.total > 0 ? Math.round(((liab.total - liab.remaining) / liab.total) * 100) : 0;
                      const urgent = liab.due && new Date(liab.due + "-01") < new Date(Date.now() + 30 * 86400000);
                      return (
                        <li key={liab.id} onClick={() => setLiabSheet({ editing: liab })}
                          className="border border-border rounded-xl p-4 space-y-3 hover:bg-muted/40 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{liab.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-foreground font-medium truncate">{liab.name}</p>
                                {urgent && (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                                    <AlertCircle size={10} /> Sắp đến hạn
                                  </span>
                                )}
                              </div>
                              {liab.due && <p className="text-xs text-muted-foreground mt-0.5">Đến hạn: {liab.due}</p>}
                            </div>
                            <p className="text-sm font-semibold text-red-500 shrink-0">−{fmtFull(liab.remaining)}</p>
                          </div>
                          {liab.total > 0 && (
                            <div>
                              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                                <span>Đã trả {paidPct}%</span>
                                <span>Tổng: {fmtFull(liab.total)}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                              </div>
                            </div>
                          )}
                          {liab.monthly > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Trả hàng tháng: <span className="text-foreground font-medium">{fmtFull(liab.monthly)}</span>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <button onClick={() => setLiabSheet({ editing: null })}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={14} /> Thêm khoản nợ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
      );

      /* ── INVEST ── */
      case "invest": return (
        <Section key={id} id={id} emoji={meta.emoji} label={meta.label}>
          {/* Investments */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">Danh mục đầu tư</p>
              <button onClick={() => setInvSheet({ editing: null })}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> Thêm
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Tổng: {fmtFull(totalInvest)}</p>
            {investments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có khoản đầu tư nào.</p>}
            <ul className="space-y-3">
              {investments.map(inv => {
                const pct = totalInvest > 0 ? Math.round((inv.value / totalInvest) * 100) : 0;
                const pos = inv.return_rate >= 0;
                return (
                  <li key={inv.id} onClick={() => setInvSheet({ editing: inv })}
                    className="border border-border rounded-xl p-4 hover:bg-muted/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: inv.color + "22" }}>{inv.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{fmt(inv.value)}</p>
                        <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${pos ? "text-green-600" : "text-red-500"}`}>
                          <TrendingUp size={11} /> {pos ? "+" : ""}{inv.return_rate}%/năm
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{pct}% danh mục</span>
                        <span>{fmtFull(inv.value)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: inv.color }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button onClick={() => setInvSheet({ editing: null })}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={14} /> Thêm kênh đầu tư
            </button>
          </div>

          {/* Insurance */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Bảo hiểm</p>
              </div>
              <button onClick={() => setInsSheet({ editing: null })}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> Thêm
              </button>
            </div>
            {insurance.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có bảo hiểm nào.</p>}
            <ul className="space-y-2">
              {insurance.map(ins => {
                const renewDate = ins.renewal ? new Date(ins.renewal + "-01") : null;
                const soon = renewDate && renewDate < new Date(Date.now() + 60 * 86400000);
                return (
                  <li key={ins.id} onClick={() => setInsSheet({ editing: ins })}
                    className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                    <span className="text-xl">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{ins.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ins.coverage}</p>
                      {ins.renewal && (
                        <div className={`flex items-center gap-1 mt-1 text-[11px] ${soon ? "text-red-500" : "text-muted-foreground"}`}>
                          <Calendar size={10} /> Gia hạn: {ins.renewal}{soon && " · Sắp đến hạn"}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {ins.premium > 0 ? (
                        <>
                          <p className="text-xs font-semibold text-foreground">{fmtFull(ins.premium)}</p>
                          <p className="text-[11px] text-muted-foreground">/tháng</p>
                        </>
                      ) : (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Miễn phí</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {insurance.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Tổng phí bảo hiểm / tháng</span>
                <span className="font-semibold text-foreground">{fmtFull(insurance.reduce((s, i) => s + i.premium, 0))}</span>
              </div>
            )}
            <button onClick={() => setInsSheet({ editing: null })}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={14} /> Thêm bảo hiểm
            </button>
          </div>
        </Section>
      );

      /* ── GOALS ── */
      case "goals": return (
        <Section key={id} id={id} emoji={meta.emoji} label={meta.label}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-secondary rounded-2xl p-4">
              <Target size={16} className="text-primary mb-2" />
              <p className="text-sm font-bold text-foreground">{goals.length} mục tiêu</p>
              <p className="text-xs text-muted-foreground mt-0.5">đang theo dõi</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Đã tích lũy</p>
              <p className="text-sm font-bold text-green-600">{fmt(goals.reduce((s,g)=>s+g.saved,0))}</p>
              <p className="text-xs text-muted-foreground mt-0.5">/ {fmt(goals.reduce((s,g)=>s+g.target,0))} mục tiêu</p>
            </div>
          </div>

          {goals.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Chưa có mục tiêu nào. 🎯</div>
          )}

          <div className="space-y-3">
            {goals.map(goal => {
              const pct     = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              const months  = (() => {
                const t = new Date(goal.deadline + "-01");
                const n = new Date();
                return Math.max(0, (t.getFullYear() - n.getFullYear()) * 12 + (t.getMonth() - n.getMonth()));
              })();
              const monthly = months > 0 ? Math.ceil((goal.target - goal.saved) / months) : 0;
              const done    = pct >= 100;
              return (
                <div key={goal.id} onClick={() => setGoalSheet({ editing: goal })}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: goal.color + "18" }}>{goal.icon}</div>
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
                  <div className="mb-3">
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Đã có",    value: fmt(goal.saved) },
                      { label: "Còn thiếu", value: fmt(Math.max(0, goal.target - goal.saved)) },
                      { label: "Mục tiêu", value: fmt(goal.target) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/50 rounded-xl px-3 py-2 text-center">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className="text-xs font-semibold mt-0.5 text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
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

          <button onClick={() => setGoalSheet({ editing: null })}
            className="mt-3 w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            <Plus size={16} /> Thêm mục tiêu tài chính
          </button>
        </Section>
      );

      default: return null;
    }
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full relative">

      {/* ── Sticky quick-nav ── */}
      <div className="shrink-0 px-4 lg:px-6 pt-3 pb-2 bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {sectionOrder.map((id) => {
            const meta = SECTIONS.find(s => s.id === id)!;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                title={meta.label}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span>{meta.emoji}</span>
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setOrderModalOpen(true)}
            className="ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <SlidersHorizontal size={12} />
            <span>Sắp xếp</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pb-24 space-y-6">
        {/* Section list */}
        {sectionOrder.map((id, idx) => (
          <div key={id}>
            {renderSection(id, idx)}
          </div>
        ))}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-20 right-[72px] lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-2">
        <AnimatePresence>
          {fabOpen && (
            <>
              {[
                { label: "Thêm thu nhập",    emoji: "💰", action: () => { setTxSheet({ type: "income",  editing: null }); setFabOpen(false); } },
                { label: "Thêm chi tiêu",    emoji: "💸", action: () => { setTxSheet({ type: "expense", editing: null }); setFabOpen(false); } },
                { label: "Thêm tài sản",     emoji: "🏦", action: () => { setAssetSheet({ editing: null }); setFabOpen(false); } },
                { label: "Thêm mục tiêu",    emoji: "🎯", action: () => { setGoalSheet({ editing: null }); setFabOpen(false); } },
                { label: "Thêm đầu tư",      emoji: "📈", action: () => { setInvSheet({ editing: null }); setFabOpen(false); } },
              ].map(({ label, emoji, action }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ duration: 0.15, delay: i * 0.04 }}
                  onClick={action}
                  className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-2xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </motion.button>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={() => setFabOpen(o => !o)}
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {fabOpen ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </div>

      {/* ── Sheets ── */}
      {txSheet && (
        <TransactionSheet
          type={txSheet.type}
          open={true}
          editing={txSheet.editing}
          onClose={() => setTxSheet(null)}
          onSave={txSheet.type === "income" ? handleSaveIncome : handleSaveExpense}
          onDelete={txSheet.type === "income" ? handleDeleteIncome : handleDeleteExpense}
          items={txSheet.type === "income" ? incomeItems : expenseItems}
        />
      )}
      {assetSheet && (
        <AssetSheet
          open={true}
          editing={assetSheet.editing}
          onClose={() => setAssetSheet(null)}
          onSave={handleSaveAsset}
          onDelete={handleDeleteAsset}
          items={assets}
        />
      )}
      {liabSheet && (
        <LiabilitySheet
          open={true}
          editing={liabSheet.editing}
          onClose={() => setLiabSheet(null)}
          onSave={handleSaveLiability}
          onDelete={handleDeleteLiability}
          items={liabilities}
        />
      )}
      {invSheet && (
        <InvestmentSheet
          open={true}
          editing={invSheet.editing}
          onClose={() => setInvSheet(null)}
          onSave={handleSaveInvestment}
          onDelete={handleDeleteInvestment}
          items={investments}
        />
      )}
      {insSheet && (
        <InsuranceSheet
          open={true}
          editing={insSheet.editing}
          onClose={() => setInsSheet(null)}
          onSave={handleSaveInsurance}
          onDelete={handleDeleteInsurance}
          items={insurance}
        />
      )}
      {goalSheet && (
        <GoalSheet
          open={true}
          editing={goalSheet.editing}
          onClose={() => setGoalSheet(null)}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
          items={goals}
        />
      )}

      {/* ── Section Order Modal ── */}
      <AnimatePresence>
        {orderModalOpen && (
          <SectionOrderModal
            currentOrder={sectionOrder}
            onSave={async (newOrder) => {
              setSectionOrder(newOrder);
              if (uid) {
                await updateSettings(uid, { financeSectionOrder: newOrder });
              }
            }}
            onClose={() => setOrderModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Section Order Modal Component ── */
function SectionOrderModal({
  currentOrder, onSave, onClose
}: {
  currentOrder: SectionId[]; onSave: (order: SectionId[]) => void; onClose: () => void;
}) {
  const [order, setOrder] = useState<SectionId[]>(currentOrder);

  function moveUp(idx: number) {
    if (idx === 0) return;
    setOrder(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === order.length - 1) return;
    setOrder(prev => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <h3 className="text-foreground text-base" style={{ fontWeight: 700 }}>Sắp xếp danh mục</h3>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>Thay đổi thứ tự hiển thị các phần</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-2">
          {order.map((id, idx) => {
            const meta = SECTIONS.find(s => s.id === id)!;
            return (
              <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.9rem" }}>{meta.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveUp(idx)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    disabled={idx === order.length - 1}
                    onClick={() => moveDown(idx)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-5 shrink-0">
          <button
            onClick={() => { onSave(order); onClose(); }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold text-sm"
          >
            Lưu thứ tự
          </button>
        </div>
      </div>
    </div>
  );
}
