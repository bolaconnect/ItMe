import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Plus, ChevronRight, AlertCircle } from "lucide-react";
import { AssetSheet, LiabilitySheet } from "./FinanceForms";
import { fmt, fmtFull } from "./financeStore";
import type { Asset, Liability } from "./financeStore";

const GROUP_COLORS: Record<string, string> = {
  "Tiền & Ngân hàng":  "#5B4CF5",
  "Vàng & Hàng hóa":  "#FFD700",
  "Đầu tư":            "#FF8A65",
  "Tài sản cố định":   "#98D8C8",
  "Khác":              "#C7D2FE",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{fmtFull(payload[0].value)}</p>
    </div>
  );
};

interface AssetsTabProps {
  assets:      Asset[];
  liabilities: Liability[];
  onSaveAsset:     (item: Asset)     => void;
  onSaveLiability: (item: Liability) => void;
  onDeleteAsset:     (id: number) => void;
  onDeleteLiability: (id: number) => void;
}

export function AssetsTab({
  assets, liabilities,
  onSaveAsset, onSaveLiability,
  onDeleteAsset, onDeleteLiability,
}: AssetsTabProps) {
  const [section,       setSection]       = useState<"assets" | "liabilities">("assets");
  const [assetSheet,    setAssetSheet]    = useState(false);
  const [liabSheet,     setLiabSheet]     = useState(false);
  const [editingAsset,  setEditingAsset]  = useState<Asset     | null>(null);
  const [editingLiab,   setEditingLiab]   = useState<Liability | null>(null);

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiab   = liabilities.reduce((s, l) => s + l.remaining, 0);
  const netWorth    = totalAssets - totalLiab;

  const assetGroups = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.group] = (acc[a.group] ?? 0) + a.value;
    return acc;
  }, {});
  const pieData = Object.entries(assetGroups).map(([name, value]) => ({ name, value }));

  function openAddAsset()  { setEditingAsset(null);  setAssetSheet(true); }
  function openEditAsset(a: Asset) { setEditingAsset(a); setAssetSheet(true); }
  function openAddLiab()   { setEditingLiab(null);   setLiabSheet(true); }
  function openEditLiab(l: Liability) { setEditingLiab(l); setLiabSheet(true); }

  return (
    <>
      <div className="space-y-4">
        {/* Net worth */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground mb-1">Tài sản ròng (Net Worth)</p>
          <p className="text-foreground font-bold" style={{ fontSize: "1.6rem" }}>{fmtFull(netWorth)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setSection("assets")}
              className={`rounded-xl p-3 text-left border transition-all ${
                section === "assets" ? "border-primary bg-secondary" : "border-border bg-muted/40"
              }`}>
              <p className="text-xs text-muted-foreground">Tổng tài sản</p>
              <p className="text-sm font-semibold text-green-600 mt-0.5">{fmtFull(totalAssets)}</p>
            </button>
            <button onClick={() => setSection("liabilities")}
              className={`rounded-xl p-3 text-left border transition-all ${
                section === "liabilities" ? "border-destructive bg-red-50" : "border-border bg-muted/40"
              }`}>
              <p className="text-xs text-muted-foreground">Tổng nợ</p>
              <p className="text-sm font-semibold text-red-500 mt-0.5">−{fmtFull(totalLiab)}</p>
            </button>
          </div>
        </div>

        {section === "assets" ? (
          <>
            {/* Pie chart */}
            {assets.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-sm font-semibold text-foreground mb-4">Phân bổ tài sản</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <PieChart width={148} height={148}>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={46} outerRadius={70}
                        strokeWidth={2} stroke="var(--card)"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`asset-cell-${idx}`} fill={GROUP_COLORS[entry.name] ?? "#ccc"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-muted-foreground">Tổng</p>
                      <p className="text-xs font-bold text-foreground">{fmt(totalAssets)}</p>
                    </div>
                  </div>
                  <ul className="flex-1 w-full space-y-2.5">
                    {pieData.map((entry, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[entry.name] }} />
                        <span className="text-xs text-foreground flex-1 truncate">{entry.name}</span>
                        <span className="text-xs text-muted-foreground">{Math.round((entry.value / totalAssets) * 100)}%</span>
                        <span className="text-xs font-medium text-foreground w-16 text-right">{fmt(entry.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Asset list */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground">Danh sách tài sản</p>
                <button onClick={openAddAsset} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus size={12} /> Thêm
                </button>
              </div>

              {assets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Chưa có tài sản nào. Nhấn + để thêm.</p>
              )}

              {Object.entries(assetGroups).map(([group]) => (
                <div key={group} className="mb-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group}</p>
                  <ul className="space-y-0.5">
                    {assets.filter((a) => a.group === group).map((asset) => (
                      <li key={asset.id} onClick={() => openEditAsset(asset)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                        <span className="text-lg">{asset.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{asset.name}</p>
                          <p className="text-[11px] text-muted-foreground">{asset.liquid ? "Thanh khoản cao" : "Ít thanh khoản"}</p>
                        </div>
                        <p className="text-sm font-semibold text-green-600 shrink-0">{fmtFull(asset.value)}</p>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <button onClick={openAddAsset}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <Plus size={14} /> Thêm tài sản
              </button>
            </div>
          </>
        ) : (
          /* Liabilities */
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">Khoản nợ phải trả</p>
              <button onClick={openAddLiab} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus size={12} /> Thêm
              </button>
            </div>

            {liabilities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Không có khoản nợ 🎉</p>
            )}

            <ul className="space-y-3">
              {liabilities.map((liab) => {
                const paidPct = liab.total > 0 ? Math.round(((liab.total - liab.remaining) / liab.total) * 100) : 0;
                const urgent  = liab.due && new Date(liab.due + "-01") < new Date(Date.now() + 30 * 86400000);
                return (
                  <li key={liab.id} onClick={() => openEditLiab(liab)}
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

            <button onClick={openAddLiab}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              <Plus size={14} /> Thêm khoản nợ
            </button>
          </div>
        )}
      </div>

      <AssetSheet
        open={assetSheet}
        editing={editingAsset}
        onClose={() => setAssetSheet(false)}
        onSave={onSaveAsset}
        onDelete={onDeleteAsset}
        items={assets}
      />
      <LiabilitySheet
        open={liabSheet}
        editing={editingLiab}
        onClose={() => setLiabSheet(false)}
        onSave={onSaveLiability}
        onDelete={onDeleteLiability}
        items={liabilities}
      />
    </>
  );
}
