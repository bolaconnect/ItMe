import { useState } from "react";
import {
  LayoutDashboard, CheckSquare, Target, Repeat2, StickyNote,
  Wallet, Calendar, CalendarDays, Menu, X, Settings, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Page } from "./MainApp";
import { useAppStore } from "../store/useAppStore";

interface BottomNavProps {
  activePage: Page;
  onNavigate: (p: Page) => void;
}

const ALL_PAGES: { id: Page; icon: React.ElementType; label: string }[] = [
  { id: "tasks",    icon: CheckSquare, label: "Việc làm" },
  { id: "goals",    icon: Target,      label: "Mục tiêu" },
  { id: "habits",   icon: Repeat2,     label: "Thói quen" },
  { id: "notes",    icon: StickyNote,  label: "Ghi chú" },
  { id: "finance",  icon: Wallet,      label: "Tài chính" },
  { id: "calendar", icon: Calendar,    label: "Lịch" },
  { id: "events",   icon: CalendarDays,label: "Sự kiện" },
];

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomNavTabs = useAppStore(state => state.bottomNavTabs);

  // Map 3 IDs from store to full page objects
  const tabItems = bottomNavTabs.map(id => ALL_PAGES.find(p => p.id === id)).filter(Boolean) as typeof ALL_PAGES;

  // Split tabs for left and right of Dashboard
  const leftItems = tabItems.slice(0, 2);
  const rightItems = tabItems.slice(2, 4);

  // The pages that are NOT pinned to the bottom nav
  const unpinnedPages = ALL_PAGES.filter(p => !bottomNavTabs.includes(p.id));

  function handleNav(id: Page) {
    onNavigate(id);
    setMenuOpen(false);
  }

  return (
    <>
      <nav className="lg:hidden flex items-center border-t border-border bg-card px-2 py-1 safe-area-pb z-40 relative">
        {/* Left */}
        <div className="flex flex-1 items-center justify-around">
          {leftItems.map(({ id, icon: Icon, label }) => {
            const active = activePage === id;
            return (
              <button key={id} onClick={() => handleNav(id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span className="truncate" style={{ fontSize: "9px", fontWeight: 500, maxWidth: "56px" }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Center — Dashboard */}
        <button
          onClick={() => handleNav("dashboard")}
          className={`flex flex-col items-center gap-0.5 mx-1 px-4 py-2 rounded-2xl transition-all ${
            activePage === "dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-foreground hover:bg-secondary"
          }`}
        >
          <LayoutDashboard size={22} strokeWidth={activePage === "dashboard" ? 2.2 : 1.8} />
          <span style={{ fontSize: "9px", fontWeight: 600 }}>Tổng quan</span>
        </button>

        {/* Right */}
        <div className="flex flex-1 items-center justify-around">
          {rightItems.map(({ id, icon: Icon, label }) => {
            const active = activePage === id;
            return (
              <button key={id} onClick={() => handleNav(id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span className="truncate" style={{ fontSize: "9px", fontWeight: 500, maxWidth: "56px" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Menu Button (Left) */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-20 left-4 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Menu Modal (BottomSheet) */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full bg-card rounded-t-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto my-3 shrink-0" />
              <div className="px-5 pb-2 flex items-center justify-between shrink-0">
                <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.125rem" }}>Tất cả tính năng</h3>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-8 space-y-2">
                <p className="text-muted-foreground pt-2 pb-1" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CÁC TAB ĐÃ ẨN</p>
                <div className="grid grid-cols-2 gap-2">
                  {unpinnedPages.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => handleNav(id)}
                      className="flex flex-col items-start p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <span className="text-foreground" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-border my-4" />

                <button onClick={() => handleNav("profile")}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Settings size={20} className="text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Cài đặt & Bản thân</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Tùy chỉnh thanh điều hướng ở đây</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
