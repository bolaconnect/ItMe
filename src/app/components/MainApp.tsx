import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { Dashboard } from "./Dashboard";
import { FinancePage } from "./FinancePage";
import { GoalsPage } from "./GoalsPage";
import { HabitsPage } from "./HabitsPage";
import { NotesPage } from "./NotesPage";
import { ProfilePage } from "./ProfilePage";
import { EventsPage } from "./EventsPage";
import { PasswordsPage } from "./PasswordsPage";
import { ToastProvider } from "./ToastNotification";
import { auth } from "../../lib/firebase";
import { subscribeSettings } from "../../lib/settingsService";
import { useAppStore } from "../store/useAppStore";

export type Page = "dashboard" | "tasks" | "goals" | "habits" | "finance" | "notes" | "passwords" | "events" | "profile";

export function MainApp() {
  const [page, setPage]                 = useState<Page>("dashboard");
  const [modalOpen, setModalOpen]       = useState(false);
  const [darkMode, setDarkMode]         = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const setSettings = useAppStore(state => state.setSettings);
  const setBottomNavTabs = useAppStore(state => state.setBottomNavTabs);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = subscribeSettings(auth.currentUser.uid, (data) => {
      setSettings(data);
      if (data.bottomNavTabs && data.bottomNavTabs.length === 4) {
        let normalized = data.bottomNavTabs.map(t => (t === "tasks" || t === "calendar") ? "events" : (t as Page));
        normalized = Array.from(new Set(normalized));
        const available = ["goals", "habits", "finance", "notes", "passwords", "events"] as Page[];
        for (const tab of available) {
          if (normalized.length >= 4) break;
          if (!normalized.includes(tab)) {
            normalized.push(tab);
          }
        }
        setBottomNavTabs(normalized.slice(0, 4) as Page[]);
      }
    });
    return () => unsub();
  }, [setSettings, setBottomNavTabs]);

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
    setModalOpen(false);
  }

  return (
    <ToastProvider>
    <div className="size-full flex bg-background overflow-hidden">
      <Sidebar activePage={page} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar activePage={page} onNavigate={navigate} />

        <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {page === "dashboard" && <div className="flex-1 overflow-y-auto"><Dashboard onNavigate={navigate} /></div>}
          {page === "finance"   && <FinancePage />}
          {(page === "tasks" || page === "events") && <EventsPage />}
          {page === "goals"     && <GoalsPage onModal={setModalOpen} />}
          {page === "habits"    && <HabitsPage onModal={setModalOpen} />}
          {page === "notes"     && <NotesPage onModal={setModalOpen} />}
          {page === "passwords" && <PasswordsPage onModal={setModalOpen} />}
          {page === "profile"   && <div className="flex-1 overflow-hidden flex flex-col"><ProfilePage onNavigate={navigate} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} /></div>}
        </main>

        <BottomNav activePage={page} onNavigate={navigate} />
      </div>
    </div>
    </ToastProvider>
  );
}
