import { useState } from "react";
import {
  LayoutDashboard, CheckSquare, Target, Repeat2,
  Wallet, StickyNote, ChevronLeft, ChevronRight,
  Sparkles, User, Settings, Calendar, CalendarDays
} from "lucide-react";
import type { Page } from "./MainApp";

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Tổng quan",  icon: LayoutDashboard },
  { id: "tasks",     label: "Công việc",  icon: CheckSquare },
  { id: "goals",     label: "Mục tiêu",   icon: Target },
  { id: "habits",    label: "Thói quen",  icon: Repeat2 },
  { id: "finance",   label: "Tài chính",  icon: Wallet },
  { id: "notes",     label: "Ghi chú",    icon: StickyNote },
  { id: "calendar",  label: "Lịch",       icon: Calendar },
  { id: "events",    label: "Sự kiện",    icon: CalendarDays },
  { id: "profile",   label: "Bản thân",   icon: User },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (p: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-border overflow-hidden ${collapsed ? "px-4 py-5 justify-center" : "px-5 py-5"}`}>
        <div className="shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Sparkles size={15} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-foreground font-semibold tracking-tight whitespace-nowrap">MyLife</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-hidden">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
                collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-border py-4 px-2.5 space-y-0.5 overflow-hidden`}>
        <button
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 ${
            collapsed ? "px-0 justify-center" : "px-3"
          }`}
          title={collapsed ? "Cài đặt" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm">Cài đặt</span>}
        </button>

        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? "px-0 justify-center" : ""}`}>
          <div className="shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <User size={13} className="text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs text-foreground font-medium truncate">Nguyễn Văn A</p>
              <p className="text-xs text-muted-foreground truncate">Free plan</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10 shadow-sm"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
