import React, { useState, useEffect } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function OfflineBadge() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[100] flex items-center gap-2 px-3 py-2 bg-red-500 text-white font-semibold text-xs rounded-xl shadow-xl border border-red-400 select-none pointer-events-none"
        >
          <WifiOff size={14} className="animate-bounce" />
          <span>Đang ngoại tuyến (Offline)</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
