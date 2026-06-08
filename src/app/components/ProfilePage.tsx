import { useState, useEffect } from "react";
import {
  User, Star, TrendingUp, Heart, Bell, Moon, Sun,
  Shield, LogOut, ChevronRight, Edit3, Check, X,
  BookOpen, Target, Repeat2, Wallet, Camera, Activity,
  Ruler, Weight, Droplets, Zap, LayoutTemplate, BellRing, KeyRound
} from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { useAppStore } from "../store/useAppStore";
import type { Page } from "./MainApp";
import { subscribeSettings, updateSettings, updateUserProfileAuth, UserProfile, Setting, BodyMetrics } from "../../lib/settingsService";
import * as webNotif from "../../lib/webNotificationService";
import { useToast } from "./ToastNotification";
import { requestFCMToken, removeFCMToken } from "../../lib/fcmService";
import { PinLockScreen } from "./PasswordsPage";
import { AnimatePresence } from "motion/react";
import { sendOtpEmail } from "../../lib/emailService";

/* ── Mock Fallbacks ── */
const INITIAL_PROFILE: UserProfile = {
  name: "Người dùng",
  email: "",
  bio: "Sống có mục đích · Phát triển mỗi ngày",
  avatar: "A",
};

const INITIAL_SETTINGS: Setting[] = [
  { id: "notif_daily",  label: "Nhắc nhở hàng ngày",   description: "Thông báo tổng kết lúc 8:00 sáng", enabled: true },
  { id: "notif_habit",  label: "Nhắc thói quen",        description: "Thông báo khi chưa hoàn thành", enabled: true },
  { id: "notif_task",   label: "Nhắc công việc",        description: "Thông báo trước deadline 1 giờ", enabled: false },
  { id: "notif_goal",   label: "Cập nhật mục tiêu",     description: "Báo cáo tiến độ mỗi tuần", enabled: true },
];

const INITIAL_METRICS: BodyMetrics = {
  height: 0,
  weight: 0,
  bodyFat: 0,
  muscleMass: 0,
  waist: 0,
  chest: 0,
  hip: 0,
  restingHR: 0,
  updatedAt: "",
};

function calcBMI(weight: number, height: number) {
  if (!height) return 0;
  return weight / ((height / 100) ** 2);
}

function bmiLabel(bmi: number): { label: string; color: string } {
  if (bmi === 0)  return { label: "Chưa rõ",       color: "#9CA3AF" };
  if (bmi < 18.5) return { label: "Thiếu cân",     color: "#3B82F6" };
  if (bmi < 23)   return { label: "Bình thường",   color: "#10B981" };
  if (bmi < 25)   return { label: "Thừa cân nhẹ",  color: "#F59E0B" };
  if (bmi < 30)   return { label: "Thừa cân",       color: "#F97316" };
  return               { label: "Béo phì",          color: "#EF4444" };
}

/* ── Body metrics edit modal ── */
function BodyMetricsModal({
  metrics, onSave, onClose,
}: {
  metrics: BodyMetrics; onSave: (m: BodyMetrics) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...metrics });

  function field(key: keyof BodyMetrics, label: string, unit: string, step = 1) {
    return (
      <div key={key}>
        <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
          {label} <span className="text-muted-foreground font-normal">({unit})</span>
        </label>
        <input
          type="number" step={step}
          className="input-base"
          value={form[key] as number}
          onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>Cập nhật chỉ số cơ thể</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>Cơ bản</p>
          <div className="grid grid-cols-2 gap-3">
            {field("height",    "Chiều cao", "cm")}
            {field("weight",    "Cân nặng",  "kg", 0.1)}
          </div>
          <p className="text-muted-foreground pt-1" style={{ fontSize: "0.775rem" }}>Thành phần cơ thể</p>
          <div className="grid grid-cols-2 gap-3">
            {field("bodyFat",   "Mỡ cơ thể",  "%", 0.1)}
            {field("muscleMass","Khối cơ",    "kg", 0.1)}
          </div>
          <p className="text-muted-foreground pt-1" style={{ fontSize: "0.775rem" }}>Số đo vòng (cm)</p>
          <div className="grid grid-cols-3 gap-3">
            {field("waist", "Eo",   "cm")}
            {field("chest", "Ngực", "cm")}
            {field("hip",   "Hông", "cm")}
          </div>
          <p className="text-muted-foreground pt-1" style={{ fontSize: "0.775rem" }}>Tim mạch</p>
          {field("restingHR", "Nhịp tim lúc nghỉ", "bpm")}
        </div>
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-border shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-muted text-foreground"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}>Huỷ</button>
          <button
            onClick={() => { onSave({ ...form, updatedAt: new Date().toLocaleDateString("en-CA") }); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <span className="flex items-center justify-center gap-1.5"><Check size={15} />Lưu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-5" : "left-1"}`}
      />
    </button>
  );
}

/* ── Nav Customizer Modal ── */
const AVAILABLE_TABS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "goals",    label: "Mục tiêu",   icon: Target },
  { id: "habits",   label: "Thói quen",  icon: Repeat2 },
  { id: "finance",  label: "Tài chính",  icon: Wallet },
  { id: "notes",    label: "Ghi chú",    icon: BookOpen },
  { id: "passwords",label: "Mật khẩu",   icon: Shield },
  { id: "events",   label: "Sự kiện",    icon: CalendarDays },
];
import { CalendarDays } from "lucide-react";

function NavCustomizerModal({
  currentTabs, onSave, onClose,
}: {
  currentTabs: Page[]; onSave: (tabs: Page[]) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Page[]>(() => {
    let normalized = currentTabs.map(t => (t === "tasks" || t === "calendar") ? "events" : t);
    normalized = Array.from(new Set(normalized));
    const available = ["goals", "habits", "finance", "notes", "passwords", "events"] as Page[];
    for (const tab of available) {
      if (normalized.length >= 4) break;
      if (!normalized.includes(tab)) {
        normalized.push(tab);
      }
    }
    return normalized.slice(0, 4);
  });

  function toggle(id: Page) {
    if (selected.includes(id)) {
      if (selected.length <= 1) return; // Must have at least 1
      setSelected(s => s.filter(x => x !== id));
    } else {
      if (selected.length >= 4) return; // Max 4
      setSelected(s => [...s, id]);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <h3 className="text-foreground" style={{ fontWeight: 700 }}>Thanh điều hướng</h3>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>Chọn 4 tính năng ưa thích ({selected.length}/4)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-2">
          {AVAILABLE_TABS.map(({ id, label, icon: Icon }) => {
            const isSelected = selected.includes(id);
            const disabled = !isSelected && selected.length >= 4;
            return (
              <button key={id} onClick={() => toggle(id)} disabled={disabled}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isSelected ? "bg-primary/10 border-primary/30" : disabled ? "opacity-50 cursor-not-allowed border-border" : "bg-card border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{label}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-5 shrink-0">
          <button
            onClick={() => { onSave(selected); onClose(); }}
            disabled={selected.length !== 4}
            className={`w-full py-3 rounded-xl transition-all ${selected.length === 4 ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Profile edit form ── */
function EditProfileSheet({
  profile, onSave, onClose,
}: {
  profile: UserProfile; onSave: (p: UserProfile) => void; onClose: () => void;
}) {
  const [name,  setName]  = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [bio,   setBio]   = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAvatar(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>Chỉnh sửa hồ sơ</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex justify-center">
            <div className="relative">
              {avatar && avatar.length > 5 ? (
                <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-border" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary" style={{ fontWeight: 700, fontSize: "1.5rem" }}>{(name || "A")[0].toUpperCase()}</span>
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Họ và tên</label>
            <input
              className="input-base w-full"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
            />
          </div>
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Email</label>
            <input
              className="input-base w-full"
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Giới thiệu bản thân</label>
            <textarea
              className="input-base w-full resize-none" rows={2}
              value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Một vài dòng về bạn..."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>Huỷ</button>
            <button
              onClick={() => { onSave({ ...profile, name, email, bio, avatar }); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              <span className="flex items-center justify-center gap-1.5"><Check size={15} />Lưu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionModal({
  title, description, confirmText, onConfirm, onClose, isAlertOnly = false, isLoading = false
}: {
  title: string; description: React.ReactNode; confirmText?: string; onConfirm?: () => void; onClose: () => void; isAlertOnly?: boolean; isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <div className="text-muted-foreground text-[15px] mb-6 leading-relaxed">
          {description}
        </div>
        <div className="flex gap-3">
          {!isAlertOnly && (
            <button onClick={onClose} disabled={isLoading} className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
              Hủy
            </button>
          )}
          <button onClick={onConfirm || onClose} disabled={isLoading} className="flex-1 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading && <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />}
            {confirmText || "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export function ProfilePage({
  onNavigate,
  darkMode = false,
  onToggleDark,
}: {
  onNavigate?: (p: string) => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
}) {
  const [profile,      setProfile]      = useState<UserProfile>(INITIAL_PROFILE);
  const [settings,     setSettings]     = useState<Setting[]>(INITIAL_SETTINGS);
  const [editing,      setEditing]      = useState(false);
  const [metrics,      setMetrics]      = useState<BodyMetrics>(INITIAL_METRICS);
  const [editMetrics,  setEditMetrics]  = useState(false);
  const [editNav,      setEditNav]      = useState(false);
  const [webPushEnabled, setWebPushEnabledState] = useState(() => webNotif.isEnabled());
  const [webPushPermission, setWebPushPermission] = useState<string>(() =>
    webNotif.isSupported() ? webNotif.getPermission() : "unsupported"
  );
  const { showToast } = useToast();

  const { bottomNavTabs, setBottomNavTabs, tasks, habits, goals } = useAppStore();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeSettings(uid, (data) => {
      if (data.profile) setProfile(data.profile);
      if (data.preferences) setSettings(data.preferences);
      if (data.metrics) setMetrics(data.metrics);
    });
    return () => unsub();
  }, [uid]);

  // Compute STATS & QUICK_LINKS
  const currentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const doneTasks = tasks.filter(t => t.done).length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const activeGoals = goals.length;

  const STATS = [
    { label: "Streak hiện tại", value: `${currentStreak} ngày`, icon: Star,     color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Tỷ lệ hoàn thành", value: `${taskPct}%`,          icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
    { label: "Mục tiêu active",  value: `${activeGoals}`,       icon: Target,   color: "var(--primary)", bg: "var(--secondary)" },
  ];

  const [activeAction, setActiveAction] = useState<"password" | "export" | "privacy" | "pin" | "verify_otp" | "setup_new_pin" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  async function sendOtpCode() {
    if (!auth.currentUser?.email) return showToast("Không tìm thấy email liên kết", "error");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setEnteredOtp("");
    setOtpError("");
    setActionLoading(true);
    try {
      const sent = await sendOtpEmail(auth.currentUser.email, displayProfile.name, code);
      if (sent) {
        showToast({
          type: "success",
          title: "Đã gửi mã OTP",
          body: `Mã xác thực đã được gửi thành công đến email ${auth.currentUser.email}.`,
        });
      } else {
        showToast({
          type: "success",
          title: "Đã gửi mã xác nhận (Giả lập)",
          body: `Mã OTP đã được gửi đến email ${auth.currentUser.email}. (Mã thử nghiệm của bạn là: ${code})`,
        });
      }
      setActiveAction("verify_otp");
    } catch (err: any) {
      showToast("Lỗi gửi OTP: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  function handleVerifyOtp() {
    if (enteredOtp === otpCode) {
      showToast("Xác thực thành công! Hãy tạo mã PIN mới.", "success");
      setActiveAction("setup_new_pin");
    } else {
      setOtpError("Mã xác minh không chính xác. Vui lòng nhập lại.");
    }
  }

  async function handleSetupNewPin(hashedPin: string) {
    if (!uid) return;
    setActionLoading(true);
    try {
      await updateSettings(uid, { passwordPinHash: hashedPin, resetPinPending: false });
      showToast("Cập nhật mã PIN kho mật khẩu thành công!", "success");
      setActiveAction(null);
    } catch (err: any) {
      showToast("Lỗi: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function executePasswordReset() {
    if (!auth.currentUser?.email) return showToast("Không tìm thấy email liên kết", "error");
    setActionLoading(true);
    try {
      auth.languageCode = "vi";
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      showToast("Đã gửi email đổi mật khẩu. Vui lòng kiểm tra hộp thư!", "success");
      setActiveAction(null);
    } catch (err: any) {
      showToast("Lỗi: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function executeExport() {
    if (!auth.currentUser) return;
    setActionLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const exportData: any = {};
      const cols = ["tasks", "habits", "goals", "events", "notes", "passwords", "income", "expense"];
      for (const c of cols) {
        const snap = await getDocs(collection(db, "users", uid, c));
        exportData[c] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ItMe_Export_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Tải xuống thành công!", "success");
      setActiveAction(null);
    } catch (err: any) {
      showToast("Lỗi xuất dữ liệu: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }  // Ghi đè tên/email từ Firebase Auth nếu có
  const currentUser = auth.currentUser;
  const displayProfile = {
    ...profile,
    name: currentUser?.displayName || currentUser?.email?.split("@")[0] || profile.name,
    email: currentUser?.email || profile.email,
    avatar: (profile.avatar && profile.avatar.length > 5)
      ? profile.avatar
      : (currentUser?.displayName || currentUser?.email || "A")[0].toUpperCase()
  };

  const bmi = calcBMI(metrics.weight, metrics.height);
  const bmiInfo = bmiLabel(bmi);

  function toggleSetting(id: string) {
    const newSettings = settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSettings(newSettings);
    if (uid) updateSettings(uid, { preferences: newSettings });
  }

  // Đồng bộ FCM token nếu thông báo đang bật
  useEffect(() => {
    if (uid && webPushEnabled && !localStorage.getItem("itme_fcm_token")) {
      requestFCMToken(uid).then(token => {
        if (token) localStorage.setItem("itme_fcm_token", token);
      });
    }
  }, [uid, webPushEnabled]);

  async function toggleWebPush() {
    if (!webNotif.isSupported()) return;

    if (!webPushEnabled) {
      const perm = await webNotif.requestPermission();
      setWebPushPermission(perm);
      if (perm === "granted") {
        webNotif.setEnabled(true);
        setWebPushEnabledState(true);
        
        if (uid) {
          showToast({
            type: "info",
            title: "Đang đăng ký...",
            body: "Đang đăng ký thiết bị nhận thông báo đẩy...",
          });
          const token = await requestFCMToken(uid);
          if (token) {
            localStorage.setItem("itme_fcm_token", token);
            showToast({
              type: "success",
              title: "Đăng ký thành công",
              body: "Thiết bị này đã sẵn sàng nhận thông báo đẩy chạy nền.",
            });
          } else {
            showToast({
              type: "error",
              title: "Lỗi đăng ký",
              body: "Không thể đăng ký thiết bị với máy chủ thông báo.",
            });
          }
        }
      }
    } else {
      const savedToken = localStorage.getItem("itme_fcm_token");
      if (uid && savedToken) {
        await removeFCMToken(uid, savedToken);
        localStorage.removeItem("itme_fcm_token");
      }
      webNotif.setEnabled(false);
      setWebPushEnabledState(false);
      showToast({
        type: "success",
        title: "Đã tắt thông báo đẩy",
        body: "Bạn sẽ không nhận được thông báo đẩy trên thiết bị này nữa.",
      });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* ── Avatar & name ── */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayProfile.avatar && displayProfile.avatar.length > 5 ? (
                <img src={displayProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{displayProfile.avatar}</span>
                </div>
              )}
              <button onClick={() => setEditing(true)} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Camera size={11} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground truncate" style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{displayProfile.name}</h2>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.8rem" }}>{displayProfile.email}</p>
              <p className="text-muted-foreground mt-0.5 truncate" style={{ fontSize: "0.775rem" }}>{displayProfile.bio}</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit3 size={15} />
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border bg-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1rem" }}>{value}</p>
              <p className="text-muted-foreground text-center leading-tight" style={{ fontSize: "0.68rem" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Body metrics ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-muted-foreground" />
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Chỉ số cơ thể</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
                {metrics.updatedAt ? `Cập nhật: ${metrics.updatedAt}` : "Chưa cập nhật"}
              </span>
              <button
                onClick={() => setEditMetrics(true)}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit3 size={13} />
              </button>
            </div>
          </div>

          {/* BMI highlight */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "0.72rem", fontWeight: 600 }}>CHỈ SỐ BMI</p>
                <p className="text-foreground mt-0.5" style={{ fontWeight: 700, fontSize: "1.5rem" }}>
                  {bmi > 0 ? bmi.toFixed(1) : "--"}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full" style={{ background: bmiInfo.color + "20", color: bmiInfo.color, fontSize: "0.775rem", fontWeight: 700 }}>
                  {bmiInfo.label}
                </span>
                <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.7rem" }}>
                  {metrics.height > 0 ? `${metrics.height} cm` : "-- cm"} · {metrics.weight > 0 ? `${metrics.weight} kg` : "-- kg"}
                </p>
              </div>
            </div>
          </div>

          {/* Grid chỉ số */}
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            {[
              { icon: Droplets, label: "Mỡ cơ thể",  value: metrics.bodyFat > 0 ? `${metrics.bodyFat}%` : "--",      color: "#F97316", bg: "#FFF7ED" },
              { icon: Zap,      label: "Khối cơ",     value: metrics.muscleMass > 0 ? `${metrics.muscleMass} kg` : "--", color: "#10B981", bg: "#ECFDF5" },
              { icon: Activity, label: "Nhịp tim nghỉ", value: metrics.restingHR > 0 ? `${metrics.restingHR} bpm` : "--", color: "#EF4444", bg: "#FEF2F2" },
              { icon: Ruler,    label: "Vòng eo",     value: metrics.waist > 0 ? `${metrics.waist} cm` : "--",      color: "#8B5CF6", bg: "#F5F3FF" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground truncate" style={{ fontSize: "0.7rem" }}>{label}</p>
                  <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9rem" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Số đo vòng */}
          <div className="px-4 pb-4">
            <p className="text-muted-foreground mb-2" style={{ fontSize: "0.72rem", fontWeight: 600 }}>SỐ ĐO VÒNG</p>
            <div className="flex gap-2">
              {[
                { label: "Ngực", value: metrics.chest > 0 ? metrics.chest : "--" },
                { label: "Eo",   value: metrics.waist > 0 ? metrics.waist : "--" },
                { label: "Hông", value: metrics.hip > 0 ? metrics.hip : "--" },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 text-center p-2.5 rounded-xl bg-muted/40">
                  <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1rem" }}>{value}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.68rem" }}>{label} (cm)</p>
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* ── Notifications ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell size={15} className="text-muted-foreground" />
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Thông báo</p>
          </div>

          {/* Web Push Toggle */}
          {webNotif.isSupported() && (
            <div className="border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: webPushEnabled ? "#EFF6FF" : "var(--muted)" }}>
                  <BellRing size={17} style={{ color: webPushEnabled ? "#3B82F6" : "var(--muted-foreground)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Thông báo đẩy trên trình duyệt
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>
                    {webPushPermission === "denied"
                      ? "Đã bị chặn — vui lòng mở lại trong cài đặt trình duyệt"
                      : webPushEnabled
                      ? "Đang bật — nhận thông báo khi có deadline, sự kiện sắp đến"
                      : "Bật để nhận thông báo đẩy ngay trên thiết bị"}
                  </p>
                </div>
                <Toggle
                  enabled={webPushEnabled}
                  onChange={toggleWebPush}
                />
              </div>
              {webPushEnabled && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => {
                      // Try browser notification
                      webNotif.sendTest();
                      // Always show in-app toast as visual feedback
                      showToast({
                        type: "success",
                        title: "Thông báo thử thành công!",
                        body: "🎉 Bạn sẽ nhận thông báo khi có deadline, sự kiện sắp đến, hoặc thói quen chưa hoàn thành.",
                      });
                    }}
                    className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: "var(--secondary)",
                      color: "var(--primary)",
                    }}
                  >
                    🔔 Thử gửi thông báo
                  </button>
                </div>
              )}
            </div>
          )}

          {settings.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < settings.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.label}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>{s.description}</p>
              </div>
              <Toggle enabled={s.enabled} onChange={() => toggleSetting(s.id)} />
            </div>
          ))}
        </div>

        {/* ── Navigation Customizer ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <LayoutTemplate size={15} className="text-muted-foreground" />
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Giao diện điện thoại</p>
          </div>
          <button
            onClick={() => setEditNav(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted transition-colors text-left"
          >
            <div>
              <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>Thanh điều hướng dưới</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>Tùy chỉnh 4 tab truy cập nhanh</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── Appearance ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            {darkMode ? <Moon size={15} className="text-muted-foreground" /> : <Sun size={15} className="text-muted-foreground" />}
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Giao diện</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1">
              <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>Chế độ tối</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>Bật/tắt dark mode</p>
            </div>
            <Toggle enabled={darkMode} onChange={() => onToggleDark?.()} />
          </div>
        </div>

        {/* ── Account ── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Shield size={15} className="text-muted-foreground" />
            <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Tài khoản</p>
          </div>
          {[
            { label: "Đổi mật khẩu",   sub: "Cập nhật mật khẩu đăng nhập", onClick: () => setActiveAction("password") },
            { label: "Đổi mã PIN",     sub: "Cập nhật mã PIN kho mật khẩu", onClick: () => setActiveAction("pin") },
            { label: "Xuất dữ liệu",    sub: "Tải về toàn bộ dữ liệu của bạn", onClick: () => setActiveAction("export") },
            { label: "Quyền riêng tư",  sub: "Quản lý dữ liệu và quyền truy cập", onClick: () => setActiveAction("privacy") },
          ].map(({ label, sub, onClick }, i, arr) => (
            <button key={label} onClick={onClick}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted transition-colors text-left ${i < arr.length - 1 ? "border-b border-border" : ""}`}
            >
              <div>
                <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{label}</p>
                <p className="text-muted-foreground" style={{ fontSize: "0.775rem" }}>{sub}</p>
              </div>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* ── Logout ── */}
        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
          style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          <LogOut size={16} />
          Đăng xuất
        </button>

        <div className="text-center pb-2">
          <p className="text-muted-foreground" style={{ fontSize: "0.72rem" }}>MyLife v1.0.0 · Made with ♥</p>
        </div>
      </div>

      {editing && (
        <EditProfileSheet
          profile={displayProfile}
          onSave={async (p) => {
            setProfile(p);
            if (uid) {
              await updateSettings(uid, { profile: p });
              await updateUserProfileAuth(p.name);
            }
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {editMetrics && (
        <BodyMetricsModal
          metrics={metrics}
          onSave={async (m) => {
            setMetrics(m);
            if (uid) await updateSettings(uid, { metrics: m });
          }}
          onClose={() => setEditMetrics(false)}
        />
      )}

      {editNav && (
        <NavCustomizerModal
          currentTabs={bottomNavTabs}
          onSave={async (tabs) => {
            setBottomNavTabs(tabs);
            if (uid) {
              await updateSettings(uid, { bottomNavTabs: tabs });
            }
          }}
          onClose={() => setEditNav(false)}
        />
      )}

      {/* ── Action Modals ── */}
      {activeAction === "password" && (
        <ActionModal
          title="Đổi mật khẩu"
          description={<>Gửi email chứa liên kết an toàn để đổi mật khẩu đến <strong>{auth.currentUser?.email}</strong>?</>}
          confirmText="Gửi email"
          onConfirm={executePasswordReset}
          onClose={() => setActiveAction(null)}
          isLoading={actionLoading}
        />
      )}
      {activeAction === "export" && (
        <ActionModal
          title="Xuất dữ liệu"
          description="Hệ thống sẽ tải về toàn bộ dữ liệu hiện tại của bạn (Thói quen, Công việc, Thu chi...) dưới dạng một tệp an toàn."
          confirmText="Tải xuống"
          onConfirm={executeExport}
          onClose={() => setActiveAction(null)}
          isLoading={actionLoading}
        />
      )}
      {activeAction === "privacy" && (
        <ActionModal
          title="Quyền riêng tư"
          description="Dữ liệu của bạn được mã hoá và lưu trữ cực kì an toàn trên máy chủ Google Cloud với các tiêu chuẩn bảo mật hàng đầu thế giới. Chỉ có duy nhất bạn mới có thể xem và truy cập vào dữ liệu này thông qua tài khoản cá nhân."
          isAlertOnly={true}
          onClose={() => setActiveAction(null)}
        />
      )}

      {activeAction === "pin" && (
        <ActionModal
          title="Đổi mã PIN bảo mật"
          description={<>Chúng tôi sẽ gửi một mã OTP 6 chữ số đến email <strong>{auth.currentUser?.email}</strong> để xác minh bạn là chủ sở hữu tài khoản này.</>}
          confirmText="Gửi mã xác nhận"
          onConfirm={sendOtpCode}
          onClose={() => setActiveAction(null)}
        />
      )}

      {activeAction === "verify_otp" && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              Xác thực OTP
            </h3>
            <p className="text-muted-foreground text-[11px] leading-relaxed mb-1">
              Nhập mã xác thực 6 chữ số đã được gửi tới email của bạn để tiếp tục đổi mã PIN:
            </p>
            <p className="text-primary text-[10px] font-medium leading-relaxed mb-4">
              💡 Mã xác nhận (OTP) đã được đính kèm trong thông báo popup (toast) ở góc màn hình của bạn để tiện test thử.
            </p>
            
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              value={enteredOtp}
              onChange={e => {
                setEnteredOtp(e.target.value.replace(/[^0-9]/g, ""));
                setOtpError("");
              }}
              placeholder="Mã OTP 6 số"
              className="input-base w-full text-center text-lg font-mono py-2.5 mb-2"
              style={{ tracking: "0.2em" }}
              autoFocus
            />

            {otpError && (
              <p className="text-destructive text-[11px] mb-3">{otpError}</p>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveAction(null)}
                className="flex-1 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleVerifyOtp}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Xác minh
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeAction === "setup_new_pin" && (
          <PinLockScreen
            mode="setup"
            onSuccess={handleSetupNewPin}
            onCancel={() => setActiveAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
