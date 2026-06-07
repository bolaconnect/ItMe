import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { Dashboard } from "./Dashboard";
import { FinancePage } from "./FinancePage";
import { TasksPage } from "./TasksPage";
import { GoalsPage } from "./GoalsPage";
import { HabitsPage } from "./HabitsPage";
import { NotesPage } from "./NotesPage";
import { CalendarPage } from "./CalendarPage";
import { ProfilePage } from "./ProfilePage";
import { EventsPage } from "./EventsPage";
import { PasswordsPage } from "./PasswordsPage";

export type Page = "dashboard" | "tasks" | "goals" | "habits" | "finance" | "notes" | "passwords" | "calendar" | "events" | "profile";

const CAL_TOGGLE_PAGES: Page[] = ["dashboard", "tasks", "goals", "habits", "notes", "events"];

export function MainApp() {
  const [page, setPage]                 = useState<Page>("dashboard");
  const [calendarView, setCalendarView] = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [darkMode, setDarkMode]         = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  function navigate(p: Page) {
    setPage(p);
    setCalendarView(false);
    setModalOpen(false);
  }

  const showCalToggle = CAL_TOGGLE_PAGES.includes(page) && !modalOpen;

  return (
    <div className="size-full flex bg-background overflow-hidden">
      <Sidebar activePage={page} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!calendarView && (
          <TopBar activePage={page} onNavigate={navigate} />
        )}

        <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {/* Calendar overlay */}
          <AnimatePresence>
            {calendarView && (
              <motion.div
                key="cal-overlay"
                className="absolute inset-0 z-50 bg-background flex flex-col"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
              >
                <CalendarPage onBack={() => setCalendarView(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {page === "dashboard" && <div className="flex-1 overflow-y-auto"><Dashboard onNavigate={navigate} /></div>}
          {page === "finance"   && <FinancePage />}
          {page === "tasks"     && <TasksPage onModal={setModalOpen} />}
          {page === "goals"     && <GoalsPage onModal={setModalOpen} />}
          {page === "habits"    && <HabitsPage onModal={setModalOpen} />}
          {page === "notes"     && <NotesPage onModal={setModalOpen} />}
          {page === "passwords" && <PasswordsPage onModal={setModalOpen} />}
          {page === "calendar"  && <CalendarPage />}
          {page === "events"    && <EventsPage />}
          {page === "profile"   && <div className="flex-1 overflow-hidden flex flex-col"><ProfilePage onNavigate={navigate} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} /></div>}
        </main>

        <>
          {/* Nút toggle lịch — nổi phía trên FAB, ẩn khi modal mở hoặc đang xem lịch */}
          <AnimatePresence>
            {showCalToggle && !calendarView && (
              <motion.button
                key="cal-toggle"
                onClick={() => setCalendarView(true)}
                className="fixed right-5 lg:right-6 z-40 w-10 h-10 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center shadow-sm"
                style={{ bottom: "calc(5rem + 60px)" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                title="Xem lịch"
              >
                <Calendar size={17} />
              </motion.button>
            )}
          </AnimatePresence>

          {!calendarView && <BottomNav activePage={page} onNavigate={navigate} />}
        </>
      </div>
    </div>
  );
}
