import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  /* Lock body scroll when open */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel — slides up on mobile, fades in centered on desktop */}
          <motion.div
            className="relative z-10 w-full lg:w-[480px] bg-card rounded-t-3xl lg:rounded-2xl border border-border shadow-2xl max-h-[92dvh] lg:max-h-[85vh] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle bar (mobile) */}
            <div className="lg:hidden flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-foreground" style={{ fontSize: "1rem", fontWeight: 600 }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* Reusable form field wrapper */
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}

/* Reusable input */
export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`input-base ${props.className ?? ""}`}
    />
  );
}

/* Reusable select */
export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="input-base appearance-none cursor-pointer"
    />
  );
}

/* Submit row */
export function FormActions({ onCancel, submitLabel = "Lưu" }: { onCancel: () => void; submitLabel?: string }) {
  return (
    <div className="flex gap-3 pt-4 mt-2 border-t border-border">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        Huỷ
      </button>
      <button
        type="submit"
        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {submitLabel}
      </button>
    </div>
  );
}
