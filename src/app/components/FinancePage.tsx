import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TabScroller }  from "./TabScroller";
import { OverviewTab }  from "./finance/OverviewTab";
import { CashflowTab } from "./finance/CashflowTab";
import { AssetsTab }   from "./finance/AssetsTab";
import { InvestTab }   from "./finance/InvestTab";
import { GoalsTab }    from "./finance/GoalsTab";
import type {
  IncomeItem, ExpenseItem, Asset, Liability,
  Investment, Insurance, Goal,
} from "./finance/financeStore";
import { auth } from "../../lib/firebase";
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
import { Loader2 } from "lucide-react";

type FinTab = "overview" | "cashflow" | "assets" | "invest" | "goals";

const TABS: { id: FinTab; label: string; emoji: string }[] = [
  { id: "overview",  label: "Tổng quan", emoji: "📊" },
  { id: "cashflow",  label: "Thu & Chi", emoji: "💸" },
  { id: "assets",    label: "Tài sản",   emoji: "🏦" },
  { id: "invest",    label: "Đầu tư",    emoji: "📈" },
  { id: "goals",     label: "Mục tiêu",  emoji: "🎯" },
];

/* ── Firestore uses string IDs; local tabs use number IDs
   We store firestoreId in a sidecar Map and generate a numeric hash for local use ── */
type WithFirestoreId<T> = T & { _fid: string };

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

/* Get the Firestore string ID from numeric local id */
function getFid<T extends { id: number; _fid: string }>(list: T[], numId: number): string | undefined {
  return list.find(i => i.id === numId)?._fid;
}

export function FinancePage() {
  const [tab, setTab] = useState<FinTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const TOTAL_COLLS = 7;

  const [incomeItems,  setIncomeItems]  = useState<(IncomeItem  & { _fid: string })[]>([]);
  const [expenseItems, setExpenseItems] = useState<(ExpenseItem & { _fid: string })[]>([]);
  const [assets,       setAssets]       = useState<(Asset       & { _fid: string })[]>([]);
  const [liabilities,  setLiabilities]  = useState<(Liability   & { _fid: string })[]>([]);
  const [investments,  setInvestments]  = useState<(Investment  & { _fid: string })[]>([]);
  const [insurance,    setInsurance]    = useState<(Insurance   & { _fid: string })[]>([]);
  const [goals,        setGoals]        = useState<(Goal        & { _fid: string })[]>([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    setLoadedCount(0);

    const loaded = () => setLoadedCount(c => c + 1);

    const subs = [
      subscribeIncome(uid,       (d) => { setIncomeItems(mapItems(d)  as any); loaded(); }),
      subscribeExpense(uid,      (d) => { setExpenseItems(mapItems(d) as any); loaded(); }),
      subscribeAssets(uid,       (d) => { setAssets(mapItems(d)       as any); loaded(); }),
      subscribeLiabilities(uid,  (d) => { setLiabilities(mapItems(d) as any); loaded(); }),
      subscribeInvestments(uid,  (d) => { setInvestments(mapItems(d) as any); loaded(); }),
      subscribeInsurance(uid,    (d) => { setInsurance(mapItems(d)   as any); loaded(); }),
      subscribeGoals(uid,        (d) => { setGoals(mapItems(d)       as any); loaded(); }),
    ];

    return () => subs.forEach(u => u());
  }, [uid]);

  useEffect(() => {
    if (loadedCount >= TOTAL_COLLS) setIsLoading(false);
  }, [loadedCount]);

  /* ── Save handlers ── */
  async function handleSaveIncome(item: IncomeItem) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateIncome(uid, _fid, data);
    else      await addIncome(uid, data);
  }
  async function handleSaveExpense(item: ExpenseItem) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateExpense(uid, _fid, data);
    else      await addExpense(uid, data);
  }
  async function handleSaveAsset(item: Asset) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateAsset(uid, _fid, data);
    else      await addAsset(uid, data);
  }
  async function handleSaveLiability(item: Liability) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateLiability(uid, _fid, data);
    else      await addLiability(uid, data);
  }
  async function handleSaveInvestment(item: Investment) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateInvestment(uid, _fid, data);
    else      await addInvestment(uid, data);
  }
  async function handleSaveInsurance(item: Insurance) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateInsuranceItem(uid, _fid, data);
    else      await addInsuranceItem(uid, data);
  }
  async function handleSaveGoal(item: Goal) {
    if (!uid) return;
    const { _fid, id, ...data } = item as any;
    if (_fid) await updateGoal(uid, _fid, data);
    else      await addGoal(uid, data);
  }

  /* ── Delete handlers ── */
  async function handleDeleteIncome(numId: number) {
    if (!uid) return;
    const fid = getFid(incomeItems, numId);
    if (fid) await deleteIncome(uid, fid);
  }
  async function handleDeleteExpense(numId: number) {
    if (!uid) return;
    const fid = getFid(expenseItems, numId);
    if (fid) await deleteExpense(uid, fid);
  }
  async function handleDeleteAsset(numId: number) {
    if (!uid) return;
    const fid = getFid(assets, numId);
    if (fid) await deleteAsset(uid, fid);
  }
  async function handleDeleteLiability(numId: number) {
    if (!uid) return;
    const fid = getFid(liabilities, numId);
    if (fid) await deleteLiability(uid, fid);
  }
  async function handleDeleteInvestment(numId: number) {
    if (!uid) return;
    const fid = getFid(investments, numId);
    if (fid) await deleteInvestment(uid, fid);
  }
  async function handleDeleteInsurance(numId: number) {
    if (!uid) return;
    const fid = getFid(insurance, numId);
    if (fid) await deleteInsuranceItem(uid, fid);
  }
  async function handleDeleteGoal(numId: number) {
    if (!uid) return;
    const fid = getFid(goals, numId);
    if (fid) await deleteGoal(uid, fid);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="text-muted-foreground text-sm">Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="shrink-0 px-4 lg:px-6 pt-4">
        <TabScroller>
          {TABS.map(({ id, label, emoji }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{emoji}</span>
                <span className={active ? "font-medium" : ""}>{label}</span>
              </button>
            );
          })}
        </TabScroller>
        <div className="h-px bg-border mt-3" />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "overview" && (
              <OverviewTab
                incomeItems={incomeItems}
                expenseItems={expenseItems}
                goals={goals}
                assets={assets}
                liabilities={liabilities}
              />
            )}

            {tab === "cashflow" && (
              <CashflowTab
                incomeItems={incomeItems}
                expenseItems={expenseItems}
                onSaveIncome={handleSaveIncome}
                onSaveExpense={handleSaveExpense}
                onDeleteIncome={handleDeleteIncome}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {tab === "assets" && (
              <AssetsTab
                assets={assets}
                liabilities={liabilities}
                onSaveAsset={handleSaveAsset}
                onSaveLiability={handleSaveLiability}
                onDeleteAsset={handleDeleteAsset}
                onDeleteLiability={handleDeleteLiability}
              />
            )}

            {tab === "invest" && (
              <InvestTab
                investments={investments}
                insurance={insurance}
                onSaveInvestment={handleSaveInvestment}
                onSaveInsurance={handleSaveInsurance}
                onDeleteInvestment={handleDeleteInvestment}
                onDeleteInsurance={handleDeleteInsurance}
              />
            )}

            {tab === "goals" && (
              <GoalsTab
                goals={goals}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
