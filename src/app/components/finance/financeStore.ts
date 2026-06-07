/* ── Types ── */
export interface IncomeItem  { id: number; category: string; amount: number; icon: string; color: string; }
export interface ExpenseItem { id: number; category: string; amount: number; icon: string; color: string; }
export interface Asset       { id: number; name: string; value: number; group: string; icon: string; liquid: boolean; }
export interface Liability   { id: number; name: string; remaining: number; total: number; monthly: number; due: string; icon: string; }
export interface Investment  { id: number; name: string; value: number; return_rate: number; type: string; icon: string; color: string; }
export interface Insurance   { id: number; name: string; premium: number; coverage: string; renewal: string; icon: string; }
export interface Goal        { id: number; name: string; target: number; saved: number; deadline: string; icon: string; color: string; }

/* ── Initial data ── */
export const INITIAL_INCOME: IncomeItem[] = [
  { id: 1, category: "Lương",                amount: 15000000, icon: "💼", color: "#5B4CF5" },
  { id: 2, category: "Làm thêm / Freelance", amount: 2500000,  icon: "💻", color: "#818CF8" },
  { id: 3, category: "Thu nhập đầu tư",      amount: 700000,   icon: "📈", color: "#A5B4FC" },
  { id: 4, category: "Thưởng",               amount: 300000,   icon: "🎁", color: "#C7D2FE" },
];

export const INITIAL_EXPENSE: ExpenseItem[] = [
  { id: 1, category: "Ăn uống",           amount: 4200000,  icon: "🍜", color: "#FF8A65" },
  { id: 2, category: "Nhà ở / Thuê nhà",  amount: 5000000,  icon: "🏠", color: "#FFA07A" },
  { id: 3, category: "Đi lại",            amount: 1800000,  icon: "🚗", color: "#FFB347" },
  { id: 4, category: "Điện / Nước / Net", amount: 650000,   icon: "💡", color: "#FFD700" },
  { id: 5, category: "Giải trí",          amount: 2100000,  icon: "🎮", color: "#98D8C8" },
  { id: 6, category: "Mua sắm",           amount: 3800000,  icon: "🛍️", color: "#87CEEB" },
  { id: 7, category: "Y tế",              amount: 350000,   icon: "💊", color: "#DDA0DD" },
  { id: 8, category: "Giáo dục",          amount: 3000000,  icon: "📚", color: "#F0E68C" },
];

export const INITIAL_ASSETS: Asset[] = [
  { id: 1, name: "Tiền mặt",           value: 5000000,  group: "Tiền & Ngân hàng",  icon: "💵", liquid: true  },
  { id: 2, name: "Techcombank",        value: 28000000, group: "Tiền & Ngân hàng",  icon: "🏦", liquid: true  },
  { id: 3, name: "Vàng SJC (2 chỉ)",  value: 14000000, group: "Vàng & Hàng hóa",   icon: "🪙", liquid: false },
  { id: 4, name: "Cổ phiếu VNM, FPT", value: 32000000, group: "Đầu tư",            icon: "📈", liquid: false },
  { id: 5, name: "Xe máy Honda",       value: 25000000, group: "Tài sản cố định",   icon: "🏍️", liquid: false },
  { id: 6, name: "Laptop MacBook",     value: 22000000, group: "Tài sản cố định",   icon: "💻", liquid: false },
  { id: 7, name: "iPhone 15",          value: 18000000, group: "Tài sản cố định",   icon: "📱", liquid: false },
];

export const INITIAL_LIABILITIES: Liability[] = [
  { id: 1, name: "Vay tiêu dùng MB Bank",      remaining: 12000000, total: 20000000, monthly: 1500000, due: "2025-12", icon: "🏦" },
  { id: 2, name: "Thẻ tín dụng Vietcombank",   remaining: 3500000,  total: 10000000, monthly: 3500000, due: "2024-07", icon: "💳" },
  { id: 3, name: "Nợ bạn bè",                  remaining: 2000000,  total: 2000000,  monthly: 0,       due: "",        icon: "🤝" },
];

export const INITIAL_INVESTMENTS: Investment[] = [
  { id: 1, name: "Gửi tiết kiệm 6 tháng", value: 20000000, return_rate: 5.5,  type: "Tiết kiệm",   icon: "🏦", color: "#5B4CF5" },
  { id: 2, name: "Quỹ mở DCDS",           value: 8000000,  return_rate: 12.3, type: "Quỹ đầu tư",  icon: "📊", color: "#818CF8" },
  { id: 3, name: "Cổ phiếu (VNM, FPT)",  value: 32000000, return_rate: 8.7,  type: "Chứng khoán", icon: "📈", color: "#FF8A65" },
];

export const INITIAL_INSURANCE: Insurance[] = [
  { id: 1, name: "BHYT Bắt buộc",      premium: 0,      coverage: "Khám chữa bệnh",         renewal: "2024-12", icon: "🏥" },
  { id: 2, name: "Manulife An Khang",  premium: 800000, coverage: "1 tỷ bảo hiểm nhân thọ", renewal: "2025-03", icon: "🛡️" },
  { id: 3, name: "BH xe máy bắt buộc",premium: 66000,  coverage: "Tai nạn bên thứ 3",      renewal: "2025-01", icon: "🏍️" },
];

export const INITIAL_GOALS: Goal[] = [
  { id: 1, name: "Mua xe ô tô",    target: 400000000,   saved: 32000000, deadline: "2026-12", icon: "🚗", color: "#5B4CF5" },
  { id: 2, name: "Quỹ khẩn cấp",  target: 30000000,    saved: 22000000, deadline: "2024-10", icon: "🛡️", color: "#22c55e" },
  { id: 3, name: "Cưới hỏi",       target: 150000000,   saved: 28000000, deadline: "2025-12", icon: "💍", color: "#FF8A65" },
  { id: 4, name: "Nghỉ hưu (55t)", target: 5000000000,  saved: 60000000, deadline: "2047-01", icon: "🌅", color: "#818CF8" },
];

export const MONTHLY_TREND = [
  { month: "T1", income: 18000000, expense: 14200000 },
  { month: "T2", income: 18000000, expense: 16800000 },
  { month: "T3", income: 20500000, expense: 15300000 },
  { month: "T4", income: 18000000, expense: 17900000 },
  { month: "T5", income: 21000000, expense: 18500000 },
  { month: "T6", income: 18500000, expense: 20900000 },
];

export const INCOME_CATEGORIES  = ["Lương","Thưởng","Làm thêm / Freelance","Thu nhập đầu tư","Thu nhập kinh doanh","Khác"];
export const EXPENSE_CATEGORIES = ["Ăn uống","Nhà ở / Thuê nhà","Đi lại","Điện / Nước / Net","Giải trí","Mua sắm","Y tế","Giáo dục","Khác"];
export const ASSET_GROUPS       = ["Tiền & Ngân hàng","Vàng & Hàng hóa","Đầu tư","Tài sản cố định","Khác"];
export const INVEST_TYPES       = ["Tiết kiệm","Chứng khoán","Quỹ đầu tư","Bất động sản","Kinh doanh","Khác"];
export const GOAL_ICONS         = ["🚗","🏠","💍","🎓","✈️","💻","📱","🛡️","🌅","🏋️","📚","💰"];
export const GOAL_COLORS        = ["#5B4CF5","#FF8A65","#22c55e","#818CF8","#FFD700","#FF6B6B","#4ECDC4"];

/* ── Formatters ── */
export function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "tr";
  return (n / 1000).toFixed(0) + "k";
}
export function fmtFull(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

/* ── ID generator ── */
export const nextId = (arr: { id: number }[]) =>
  arr.length ? Math.max(...arr.map((i) => i.id)) + 1 : 1;
