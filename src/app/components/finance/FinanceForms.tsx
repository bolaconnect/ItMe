import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, FormField, FormInput, FormSelect, FormActions } from "../Sheet";
import type {
  IncomeItem, ExpenseItem, Asset, Liability,
  Investment, Insurance, Goal,
} from "./financeStore";
import {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, ASSET_GROUPS,
  INVEST_TYPES, GOAL_ICONS, GOAL_COLORS, nextId,
} from "./financeStore";

const now = new Date();
const CURRENT_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

/* ═══════════════════════════════════════════════
   TRANSACTION (Income / Expense)
═══════════════════════════════════════════════ */
interface TransactionSheetProps {
  type: "income" | "expense";
  open: boolean;
  editing?: IncomeItem | ExpenseItem | null;
  onClose: () => void;
  onSave: (item: IncomeItem | ExpenseItem) => void;
  onDelete?: (id: number) => void;
  items: (IncomeItem | ExpenseItem)[];
}

const CATEGORY_ICON: Record<string, string> = {
  "Lương": "💼", "Thưởng": "🎁", "Làm thêm / Freelance": "💻",
  "Thu nhập đầu tư": "📈", "Thu nhập kinh doanh": "🏪", "Khác": "💰",
  "Ăn uống": "🍜", "Nhà ở / Thuê nhà": "🏠", "Đi lại": "🚗",
  "Điện / Nước / Net": "💡", "Giải trí": "🎮", "Mua sắm": "🛍️",
  "Y tế": "💊", "Giáo dục": "📚",
};
const INCOME_COLORS  = ["#5B4CF5","#818CF8","#A5B4FC","#C7D2FE","#6366f1","#8B5CF6"];
const EXPENSE_COLORS = ["#FF8A65","#FFA07A","#FFB347","#FFD700","#98D8C8","#87CEEB","#DDA0DD","#F0E68C"];

export function TransactionSheet({ type, open, editing, onClose, onSave, onDelete, items }: TransactionSheetProps) {
  const cats   = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const colors = type === "income" ? INCOME_COLORS : EXPENSE_COLORS;

  const [category, setCategory] = useState(editing?.category ?? cats[0]);
  const [amount,   setAmount]   = useState(editing ? String(editing.amount) : "");
  const [error,    setError]    = useState("");

  /* reset when sheet reopens */
  useEffect(() => {
    if (open) {
      setCategory(editing?.category ?? cats[0]);
      setAmount(editing ? String(editing.amount) : "");
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount.replace(/\D/g, ""), 10);
    if (!n || n <= 0) { setError("Nhập số tiền hợp lệ"); return; }

    const colorIdx = items.length % colors.length;
    onSave({
      id:       editing?.id ?? nextId(items),
      category,
      amount:   n,
      icon:     CATEGORY_ICON[category] ?? "💰",
      color:    editing?.color ?? colors[colorIdx],
      date:     (editing as any)?.date ?? new Date().toLocaleDateString("en-CA"),
    } as any);
    onClose();
  }

  const isIncome = type === "income";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing
        ? `Sửa ${isIncome ? "thu nhập" : "khoản chi"}`
        : `Thêm ${isIncome ? "thu nhập" : "khoản chi"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={isIncome ? "Nguồn thu" : "Danh mục"}>
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((c) => <option key={c} value={c}>{CATEGORY_ICON[c] ?? "💰"} {c}</option>)}
          </FormSelect>
        </FormField>

        <FormField label="Số tiền (đ)">
          <FormInput
            type="text"
            inputMode="numeric"
            placeholder="VD: 5000000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          {amount && !error && (
            <p className="text-xs text-muted-foreground mt-1">
              = {parseInt(amount || "0").toLocaleString("vi-VN")}đ
            </p>
          )}
        </FormField>

        {editing && onDelete && (
          <button
            type="button"
            onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 size={14} /> Xoá khoản này
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   ASSET
═══════════════════════════════════════════════ */
interface AssetSheetProps {
  open: boolean;
  editing?: Asset | null;
  onClose: () => void;
  onSave: (item: Asset) => void;
  onDelete?: (id: number) => void;
  items: Asset[];
}

const ASSET_ICONS: Record<string, string> = {
  "Tiền & Ngân hàng": "🏦", "Vàng & Hàng hóa": "🪙",
  "Đầu tư": "📈", "Tài sản cố định": "💻", "Khác": "📦",
};

export function AssetSheet({ open, editing, onClose, onSave, onDelete, items }: AssetSheetProps) {
  const [name,    setName]    = useState(editing?.name    ?? "");
  const [group,   setGroup]   = useState(editing?.group   ?? ASSET_GROUPS[0]);
  const [value,   setValue]   = useState(editing ? String(editing.value) : "");
  const [liquid,  setLiquid]  = useState(editing?.liquid  ?? true);
  const [nameErr, setNameErr] = useState("");
  const [valErr,  setValErr]  = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let ok = true;
    if (!name.trim()) { setNameErr("Nhập tên tài sản"); ok = false; }
    const n = parseInt(value.replace(/\D/g, ""), 10);
    if (!n || n <= 0) { setValErr("Nhập giá trị hợp lệ"); ok = false; }
    if (!ok) return;

    onSave({
      id:     editing?.id ?? nextId(items),
      name:   name.trim(),
      group,
      value:  n,
      icon:   editing?.icon ?? ASSET_ICONS[group] ?? "📦",
      liquid,
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa tài sản" : "Thêm tài sản"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên tài sản">
          <FormInput
            placeholder="VD: Tiền gửi VPBank"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameErr(""); }}
          />
          {nameErr && <p className="text-xs text-destructive mt-1">{nameErr}</p>}
        </FormField>

        <FormField label="Nhóm tài sản">
          <FormSelect value={group} onChange={(e) => setGroup(e.target.value)}>
            {ASSET_GROUPS.map((g) => <option key={g} value={g}>{ASSET_ICONS[g]} {g}</option>)}
          </FormSelect>
        </FormField>

        <FormField label="Giá trị hiện tại (đ)">
          <FormInput
            type="text"
            inputMode="numeric"
            placeholder="VD: 10000000"
            value={value}
            onChange={(e) => { setValue(e.target.value.replace(/\D/g, "")); setValErr(""); }}
          />
          {valErr && <p className="text-xs text-destructive mt-1">{valErr}</p>}
          {value && !valErr && (
            <p className="text-xs text-muted-foreground mt-1">= {parseInt(value||"0").toLocaleString("vi-VN")}đ</p>
          )}
        </FormField>

        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
          <div>
            <p className="text-sm text-foreground">Thanh khoản cao</p>
            <p className="text-xs text-muted-foreground">Có thể chuyển thành tiền mặt nhanh</p>
          </div>
          <button
            type="button"
            onClick={() => setLiquid(!liquid)}
            className={`relative w-11 h-6 rounded-full transition-colors ${liquid ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${liquid ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {editing && onDelete && (
          <button type="button" onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors">
            <Trash2 size={14} /> Xoá tài sản
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   LIABILITY
═══════════════════════════════════════════════ */
interface LiabilitySheetProps {
  open: boolean;
  editing?: Liability | null;
  onClose: () => void;
  onSave: (item: Liability) => void;
  onDelete?: (id: number) => void;
  items: Liability[];
}

export function LiabilitySheet({ open, editing, onClose, onSave, onDelete, items }: LiabilitySheetProps) {
  const [name,      setName]      = useState(editing?.name      ?? "");
  const [remaining, setRemaining] = useState(editing ? String(editing.remaining) : "");
  const [total,     setTotal]     = useState(editing ? String(editing.total)     : "");
  const [monthly,   setMonthly]   = useState(editing ? String(editing.monthly)   : "");
  const [due,       setDue]       = useState(editing?.due ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const rem = parseInt(remaining.replace(/\D/g,""),10) || 0;
    const tot = parseInt(total.replace(/\D/g,""),10)     || rem;
    const mon = parseInt(monthly.replace(/\D/g,""),10)   || 0;

    onSave({
      id:        editing?.id ?? nextId(items),
      name:      name.trim(),
      remaining: rem,
      total:     tot,
      monthly:   mon,
      due,
      icon:      editing?.icon ?? "💳",
    });
    onClose();
  }

  /* AmountField moved outside component – see bottom of file */

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa khoản nợ" : "Thêm khoản nợ"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên khoản nợ">
          <FormInput placeholder="VD: Vay ngân hàng ACB" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <AmountField label="Số tiền còn nợ (đ)" value={remaining} onChange={setRemaining} placeholder="VD: 15000000" />
        <AmountField label="Tổng nợ gốc (đ)"    value={total}     onChange={setTotal}     placeholder="VD: 20000000" />
        <AmountField label="Trả hàng tháng (đ)" value={monthly}   onChange={setMonthly}   placeholder="VD: 1500000" />

        <FormField label="Hạn trả (YYYY-MM)">
          <FormInput type="month" value={due} onChange={(e) => setDue(e.target.value)} min={CURRENT_MONTH} />
        </FormField>

        {editing && onDelete && (
          <button type="button" onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors">
            <Trash2 size={14} /> Xoá khoản nợ
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   INVESTMENT
═══════════════════════════════════════════════ */
interface InvestmentSheetProps {
  open: boolean;
  editing?: Investment | null;
  onClose: () => void;
  onSave: (item: Investment) => void;
  onDelete?: (id: number) => void;
  items: Investment[];
}

const INVEST_ICON: Record<string, string> = {
  "Tiết kiệm": "🏦", "Chứng khoán": "📈",
  "Quỹ đầu tư": "📊", "Bất động sản": "🏘️",
  "Kinh doanh": "🏪", "Khác": "💰",
};
const INVEST_COLORS = ["#5B4CF5","#818CF8","#FF8A65","#22c55e","#FFD700","#4ECDC4"];

export function InvestmentSheet({ open, editing, onClose, onSave, onDelete, items }: InvestmentSheetProps) {
  const [name,   setName]   = useState(editing?.name   ?? "");
  const [type,   setType]   = useState(editing?.type   ?? INVEST_TYPES[0]);
  const [value,  setValue]  = useState(editing ? String(editing.value) : "");
  const [rate,   setRate]   = useState(editing ? String(editing.return_rate) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const v = parseInt(value.replace(/\D/g,""),10) || 0;
    const r = parseFloat(rate) || 0;
    const colorIdx = items.length % INVEST_COLORS.length;

    onSave({
      id:          editing?.id ?? nextId(items),
      name:        name.trim(),
      type,
      value:       v,
      return_rate: r,
      icon:        editing?.icon ?? INVEST_ICON[type] ?? "💰",
      color:       editing?.color ?? INVEST_COLORS[colorIdx],
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa đầu tư" : "Thêm đầu tư"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên kênh đầu tư">
          <FormInput placeholder="VD: Cổ phiếu VNM" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Loại hình">
          <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
            {INVEST_TYPES.map((t) => <option key={t} value={t}>{INVEST_ICON[t]} {t}</option>)}
          </FormSelect>
        </FormField>

        <FormField label="Giá trị hiện tại (đ)">
          <FormInput
            type="text" inputMode="numeric" placeholder="VD: 10000000"
            value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g,""))}
          />
          {value && <p className="text-xs text-muted-foreground mt-1">= {parseInt(value||"0").toLocaleString("vi-VN")}đ</p>}
        </FormField>

        <FormField label="Lợi suất ước tính (% / năm)">
          <FormInput
            type="number" step="0.1" placeholder="VD: 7.5"
            value={rate} onChange={(e) => setRate(e.target.value)}
          />
        </FormField>

        {editing && onDelete && (
          <button type="button" onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors">
            <Trash2 size={14} /> Xoá khoản đầu tư
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   INSURANCE
═══════════════════════════════════════════════ */
interface InsuranceSheetProps {
  open: boolean;
  editing?: Insurance | null;
  onClose: () => void;
  onSave: (item: Insurance) => void;
  onDelete?: (id: number) => void;
  items: Insurance[];
}

export function InsuranceSheet({ open, editing, onClose, onSave, onDelete, items }: InsuranceSheetProps) {
  const [name,     setName]     = useState(editing?.name     ?? "");
  const [coverage, setCoverage] = useState(editing?.coverage ?? "");
  const [premium,  setPremium]  = useState(editing ? String(editing.premium) : "");
  const [renewal,  setRenewal]  = useState(editing?.renewal  ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id:       editing?.id ?? nextId(items),
      name:     name.trim(),
      coverage: coverage.trim(),
      premium:  parseInt(premium.replace(/\D/g,""),10) || 0,
      renewal,
      icon:     editing?.icon ?? "🛡️",
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa bảo hiểm" : "Thêm bảo hiểm"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tên bảo hiểm">
          <FormInput placeholder="VD: Bảo hiểm sức khoẻ PTI" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Quyền lợi bảo hiểm">
          <FormInput placeholder="VD: Hỗ trợ viện phí tới 100tr/năm" value={coverage} onChange={(e) => setCoverage(e.target.value)} />
        </FormField>

        <FormField label="Phí hàng tháng (đ)">
          <FormInput
            type="text" inputMode="numeric" placeholder="0 nếu miễn phí"
            value={premium} onChange={(e) => setPremium(e.target.value.replace(/\D/g,""))}
          />
          {premium && <p className="text-xs text-muted-foreground mt-1">= {parseInt(premium||"0").toLocaleString("vi-VN")}đ</p>}
        </FormField>

        <FormField label="Ngày gia hạn">
          <FormInput type="month" value={renewal} onChange={(e) => setRenewal(e.target.value)} min={CURRENT_MONTH} />
        </FormField>

        {editing && onDelete && (
          <button type="button" onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors">
            <Trash2 size={14} /> Xoá bảo hiểm
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   GOAL
═══════════════════════════════════════════════ */
interface GoalSheetProps {
  open: boolean;
  editing?: Goal | null;
  onClose: () => void;
  onSave: (item: Goal) => void;
  onDelete?: (id: number) => void;
  items: Goal[];
}

export function GoalSheet({ open, editing, onClose, onSave, onDelete, items }: GoalSheetProps) {
  const [name,     setName]     = useState(editing?.name     ?? "");
  const [target,   setTarget]   = useState(editing ? String(editing.target)   : "");
  const [saved,    setSaved]    = useState(editing ? String(editing.saved)     : "");
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [icon,     setIcon]     = useState(editing?.icon     ?? "🎯");
  const [color,    setColor]    = useState(editing?.color    ?? GOAL_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id:       editing?.id ?? nextId(items),
      name:     name.trim(),
      target:   parseInt(target.replace(/\D/g,""),10) || 0,
      saved:    parseInt(saved.replace(/\D/g,""),10)  || 0,
      deadline,
      icon,
      color,
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa mục tiêu" : "Thêm mục tiêu tài chính"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon picker */}
        <FormField label="Biểu tượng">
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl">
            {GOAL_ICONS.map((em) => (
              <button
                key={em} type="button"
                onClick={() => setIcon(em)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                  icon === em ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-muted"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Tên mục tiêu">
          <FormInput placeholder="VD: Mua nhà riêng" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Số tiền mục tiêu (đ)">
          <FormInput
            type="text" inputMode="numeric" placeholder="VD: 500000000"
            value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g,""))}
          />
          {target && <p className="text-xs text-muted-foreground mt-1">= {parseInt(target||"0").toLocaleString("vi-VN")}đ</p>}
        </FormField>

        <FormField label="Đã tích lũy được (đ)">
          <FormInput
            type="text" inputMode="numeric" placeholder="VD: 50000000"
            value={saved} onChange={(e) => setSaved(e.target.value.replace(/\D/g,""))}
          />
          {saved && <p className="text-xs text-muted-foreground mt-1">= {parseInt(saved||"0").toLocaleString("vi-VN")}đ</p>}
        </FormField>

        <FormField label="Hạn chót (YYYY-MM)">
          <FormInput type="month" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={CURRENT_MONTH} />
        </FormField>

        {/* Color picker */}
        <FormField label="Màu sắc">
          <div className="flex gap-2 p-3 bg-muted/50 rounded-xl">
            {GOAL_COLORS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-current" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </FormField>

        {editing && onDelete && (
          <button type="button" onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors">
            <Trash2 size={14} /> Xoá mục tiêu
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm mục tiêu"} />
      </form>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════
   HELPERS & COMMON FIELDS
   ═══════════════════════════════════════════════ */
interface AmountFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

function AmountField({ label, value, onChange, placeholder }: AmountFieldProps) {
  return (
    <FormField label={label}>
      <FormInput
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
      {value && (
        <p className="text-xs text-muted-foreground mt-1">
          = {parseInt(value || "0").toLocaleString("vi-VN")}đ
        </p>
      )}
    </FormField>
  );
}

