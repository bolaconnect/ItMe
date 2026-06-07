import { LayoutDashboard, CheckSquare, Target, Repeat2, StickyNote } from "lucide-react";
import type { Page } from "./MainApp";

interface BottomNavProps {
  activePage: Page;
  onNavigate: (p: Page) => void;
}

const leftItems:  { id: Page; icon: React.ElementType; label: string }[] = [
  { id: "tasks", icon: CheckSquare, label: "Việc làm" },
  { id: "goals", icon: Target,      label: "Mục tiêu" },
];

const rightItems: { id: Page; icon: React.ElementType; label: string }[] = [
  { id: "habits", icon: Repeat2,   label: "Thói quen" },
  { id: "notes",  icon: StickyNote, label: "Ghi chú"  },
];

export function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="lg:hidden flex items-center border-t border-border bg-card px-2 py-1 safe-area-pb">

      {/* Left */}
      <div className="flex flex-1 items-center justify-around">
        {leftItems.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: "9.5px", fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Center — Dashboard */}
      <button
        onClick={() => onNavigate("dashboard")}
        className={`flex flex-col items-center gap-0.5 mx-2 px-5 py-2 rounded-2xl transition-all ${
          activePage === "dashboard"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground hover:bg-secondary"
        }`}
      >
        <LayoutDashboard size={22} strokeWidth={activePage === "dashboard" ? 2.2 : 1.8} />
        <span style={{ fontSize: "9.5px", fontWeight: 600 }}>Tổng quan</span>
      </button>

      {/* Right */}
      <div className="flex flex-1 items-center justify-around">
        {rightItems.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: "9.5px", fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </div>

    </nav>
  );
}
