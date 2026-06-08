import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Clock, Calendar, Flame, Bell } from "lucide-react";

/* ── Types ── */
export type ToastType = "overdue" | "upcoming" | "event" | "habit" | "success" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  body: string;
  duration?: number; // ms, default 6000
  onClick?: () => void;
}

/* ── Visual Config ── */
const TOAST_CONFIG: Record<ToastType, { icon: any; color: string; bg: string; border: string }> = {
  overdue:  { icon: AlertTriangle, color: "#EF4444", bg: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", border: "#FECACA" },
  upcoming: { icon: Clock,         color: "#F59E0B", bg: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "#FDE68A" },
  event:    { icon: Calendar,      color: "#3B82F6", bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "#BFDBFE" },
  habit:    { icon: Flame,         color: "#8B5CF6", bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", border: "#DDD6FE" },
  success:  { icon: Bell,          color: "#10B981", bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "#A7F3D0" },
  info:     { icon: Bell,          color: "#6366F1", bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)", border: "#C7D2FE" },
};

/* ── Context ── */
interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  showToasts: (toasts: Omit<Toast, "id">[]) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showToasts: () => {},
});

export const useToast = () => useContext(ToastContext);

/* ── Provider Component ── */
let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${++toastCounter}`;
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => {
      const limited = prev.length >= 3 ? prev.slice(1) : prev;
      return [...limited, newToast];
    });
  }, []);

  const showToasts = useCallback((items: Omit<Toast, "id">[]) => {
    items.forEach((item, i) => {
      setTimeout(() => showToast(item), i * 300);
    });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showToasts }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          top: "env(safe-area-inset-top, 12px)",
          right: "12px",
          left: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
          paddingTop: "8px",
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
            const Icon = config.icon;
            const dur = toast.duration ?? (toast.type === "overdue" ? 10000 : 6000);
            return (
              <ToastCard
                key={toast.id}
                toast={toast}
                config={config}
                Icon={Icon}
                dur={dur}
                onDismiss={() => removeToast(toast.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ── Individual Toast Card ── */
function ToastCard({
  toast,
  config,
  Icon,
  dur,
  onDismiss,
}: {
  toast: Toast;
  config: { color: string; bg: string; border: string };
  Icon: any;
  dur: number;
  onDismiss: () => void;
}) {
  // Auto-dismiss
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, dur);
    return () => clearTimeout(timerRef.current);
  }, [dur, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        cursor: toast.onClick ? "pointer" : "default",
        backdropFilter: "blur(12px)",
      }}
      onClick={() => {
        toast.onClick?.();
        onDismiss();
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.color}18` }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#1F2937" }}
          >
            {toast.title}
          </p>
          <p
            className="mt-0.5 leading-snug"
            style={{
              fontSize: "0.75rem",
              color: "#6B7280",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {toast.body}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 mt-0.5 rounded-lg p-1 transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="h-[2px]"
        style={{ background: config.color, opacity: 0.4, transformOrigin: "left" }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: dur / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}
