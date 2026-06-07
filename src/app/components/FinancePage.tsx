import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TabScroller }  from "./TabScroller";
import { OverviewTab }  from "./finance/OverviewTab";
import { CashflowTab } from "./finance/CashflowTab";
import { AssetsTab }   from "./finance/AssetsTab";
import { InvestTab }   from "./finance/InvestTab";
import { GoalsTab }    from "./finance/GoalsTab";
import {
  INITIAL_INCOME, INITIAL_EXPENSE, INITIAL_ASSETS,
  INITIAL_LIABILITIES, INITIAL_INVESTMENTS, INITIAL_INSURANCE, INITIAL_GOALS,
} from "./finance/financeStore";
import type {
  IncomeItem, ExpenseItem, Asset, Liability,
  Investment, Insurance, Goal,
} from "./finance/financeStore";

type FinTab = "overview" | "cashflow" | "assets" | "invest" | "goals";

const TABS: { id: FinTab; label: string; emoji: string }[] = [
  { id: "overview",  label: "Tổng quan", emoji: "📊" },
  { id: "cashflow",  label: "Thu & Chi", emoji: "💸" },
  { id: "assets",    label: "Tài sản",   emoji: "🏦" },
  { id: "invest",    label: "Đầu tư",    emoji: "📈" },
  { id: "goals",     label: "Mục tiêu",  emoji: "🎯" },
];

/* Generic upsert helper */
function upsert<T extends { id: number }>(list: T[], item: T): T[] {
  const idx = list.findIndex((i) => i.id === item.id);
  return idx >= 0 ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];
}
function remove<T extends { id: number }>(list: T[], id: number): T[] {
  return list.filter((i) => i.id !== id);
}

export function FinancePage() {
  const [tab, setTab] = useState<FinTab>("overview");

  /* ── All finance state lives here ── */
  const [incomeItems,  setIncomeItems]  = useState<IncomeItem[]> (INITIAL_INCOME);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(INITIAL_EXPENSE);
  const [assets,       setAssets]       = useState<Asset[]>      (INITIAL_ASSETS);
  const [liabilities,  setLiabilities]  = useState<Liability[]>  (INITIAL_LIABILITIES);
  const [investments,  setInvestments]  = useState<Investment[]> (INITIAL_INVESTMENTS);
  const [insurance,    setInsurance]    = useState<Insurance[]>  (INITIAL_INSURANCE);
  const [goals,        setGoals]        = useState<Goal[]>       (INITIAL_GOALS);

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
              />
            )}

            {tab === "cashflow" && (
              <CashflowTab
                incomeItems={incomeItems}
                expenseItems={expenseItems}
                onSaveIncome={(item)  => setIncomeItems((p)  => upsert(p, item))}
                onSaveExpense={(item) => setExpenseItems((p) => upsert(p, item))}
                onDeleteIncome={(id)  => setIncomeItems((p)  => remove(p, id))}
                onDeleteExpense={(id) => setExpenseItems((p) => remove(p, id))}
              />
            )}

            {tab === "assets" && (
              <AssetsTab
                assets={assets}
                liabilities={liabilities}
                onSaveAsset={(item)      => setAssets((p)      => upsert(p, item))}
                onSaveLiability={(item)  => setLiabilities((p) => upsert(p, item))}
                onDeleteAsset={(id)     => setAssets((p)      => remove(p, id))}
                onDeleteLiability={(id) => setLiabilities((p) => remove(p, id))}
              />
            )}

            {tab === "invest" && (
              <InvestTab
                investments={investments}
                insurance={insurance}
                onSaveInvestment={(item) => setInvestments((p) => upsert(p, item))}
                onSaveInsurance={(item)  => setInsurance((p)   => upsert(p, item))}
                onDeleteInvestment={(id) => setInvestments((p) => remove(p, id))}
                onDeleteInsurance={(id)  => setInsurance((p)   => remove(p, id))}
              />
            )}

            {tab === "goals" && (
              <GoalsTab
                goals={goals}
                onSave={(item)   => setGoals((p) => upsert(p, item))}
                onDelete={(id)   => setGoals((p) => remove(p, id))}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
