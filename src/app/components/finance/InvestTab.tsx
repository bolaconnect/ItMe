import { useState } from "react";
import { Plus, TrendingUp, Shield, Calendar } from "lucide-react";
import { InvestmentSheet, InsuranceSheet } from "./FinanceForms";
import { fmt, fmtFull } from "./financeStore";
import type { Investment, Insurance } from "./financeStore";

interface InvestTabProps {
  investments: Investment[];
  insurance:   Insurance[];
  onSaveInvestment: (item: Investment) => void;
  onSaveInsurance:  (item: Insurance)  => void;
  onDeleteInvestment: (id: number) => void;
  onDeleteInsurance:  (id: number) => void;
}

export function InvestTab({
  investments, insurance,
  onSaveInvestment, onSaveInsurance,
  onDeleteInvestment, onDeleteInsurance,
}: InvestTabProps) {
  const [investSheet,    setInvestSheet]    = useState(false);
  const [insuranceSheet, setInsuranceSheet] = useState(false);
  const [editingInvest,  setEditingInvest]  = useState<Investment | null>(null);
  const [editingIns,     setEditingIns]     = useState<Insurance  | null>(null);

  const totalInvest = investments.reduce((s, i) => s + i.value, 0);

  function openAddInvest()  { setEditingInvest(null);  setInvestSheet(true); }
  function openEditInvest(i: Investment) { setEditingInvest(i); setInvestSheet(true); }
  function openAddIns()     { setEditingIns(null);     setInsuranceSheet(true); }
  function openEditIns(i: Insurance)     { setEditingIns(i);    setInsuranceSheet(true); }

  return (
    <>
      <div className="space-y-4">
        {/* Investment portfolio */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground">Danh mục đầu tư</p>
            <button onClick={openAddInvest} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Thêm
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Tổng: {fmtFull(totalInvest)}
          </p>

          {investments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có khoản đầu tư nào. Nhấn + để thêm.</p>
          )}

          <ul className="space-y-3">
            {investments.map((inv) => {
              const pct      = totalInvest > 0 ? Math.round((inv.value / totalInvest) * 100) : 0;
              const positive = inv.return_rate >= 0;
              return (
                <li key={inv.id} onClick={() => openEditInvest(inv)}
                  className="border border-border rounded-xl p-4 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: inv.color + "22" }}>
                      {inv.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{fmt(inv.value)}</p>
                      <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${positive ? "text-green-600" : "text-red-500"}`}>
                        <TrendingUp size={11} />
                        {positive ? "+" : ""}{inv.return_rate}% / năm
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

          <button onClick={openAddInvest}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
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
            <button onClick={openAddIns} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Thêm
            </button>
          </div>

          {insurance.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có bảo hiểm nào. Nhấn + để thêm.</p>
          )}

          <ul className="space-y-2">
            {insurance.map((ins) => {
              const renewDate = ins.renewal ? new Date(ins.renewal + "-01") : null;
              const soon = renewDate && renewDate < new Date(Date.now() + 60 * 86400000);
              return (
                <li key={ins.id} onClick={() => openEditIns(ins)}
                  className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                  <span className="text-xl">{ins.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{ins.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ins.coverage}</p>
                    {ins.renewal && (
                      <div className={`flex items-center gap-1 mt-1 text-[11px] ${soon ? "text-red-500" : "text-muted-foreground"}`}>
                        <Calendar size={10} />
                        Gia hạn: {ins.renewal}{soon && " · Sắp đến hạn"}
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

          <button onClick={openAddIns}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            <Plus size={14} /> Thêm bảo hiểm
          </button>
        </div>
      </div>

      <InvestmentSheet
        open={investSheet}
        editing={editingInvest}
        onClose={() => setInvestSheet(false)}
        onSave={onSaveInvestment}
        onDelete={onDeleteInvestment}
        items={investments}
      />
      <InsuranceSheet
        open={insuranceSheet}
        editing={editingIns}
        onClose={() => setInsuranceSheet(false)}
        onSave={onSaveInsurance}
        onDelete={onDeleteInsurance}
        items={insurance}
      />
    </>
  );
}
