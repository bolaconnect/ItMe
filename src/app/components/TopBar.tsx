import { Bell, Search, User, X, Check, Clock, Flame } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Page } from "./MainApp";

const titles: Record<Page, string> = {
  dashboard: "Tổng quan",
  tasks:     "Công việc",
  goals:     "Mục tiêu",
  habits:    "Thói quen",
  finance:   "Tài chính",
  notes:     "Ghi chú",
  passwords: "Mật khẩu",
  calendar:  "Lịch",
  events:    "Sự kiện",
  profile:   "Bản thân",
};

const greetings: Record<Page, string> = {
  dashboard: "Chào buổi sáng, Văn A! ☀️",
  tasks:     "Hãy hoàn thành từng việc một.",
  goals:     "Mỗi ngày tiến thêm một bước.",
  habits:    "Kiên trì tạo nên sự khác biệt.",
  finance:   "Quản lý tiền bạc thông minh.",
  notes:     "Ghi lại mọi ý tưởng hay.",
  passwords: "Quản lý tài khoản an toàn.",
  calendar:  "Lên kế hoạch, chủ động mỗi ngày.",
  events:    "Theo dõi các sự kiện sắp tới.",
  profile:   "Phát triển bản thân mỗi ngày.",
};

interface Notif {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INIT_NOTIFS: Notif[] = [
  { id: 1, icon: Clock,  iconColor: "#5B4CF5", iconBg: "#EEF0FF", title: "Họp team weekly",      body: "Bắt đầu sau 15 phút tại Phòng họp A",   time: "15 phút",  read: false },
  { id: 2, icon: Flame,  iconColor: "#F59E0B", iconBg: "#FFFBEB", title: "Thói quen: Tập thể dục", body: "Đừng quên check-in thói quen hôm nay!", time: "1 giờ",    read: false },
  { id: 3, icon: Check,  iconColor: "#10B981", iconBg: "#ECFDF5", title: "Nộp báo cáo tháng",    body: "Deadline vào cuối ngày hôm nay",          time: "3 giờ",    read: true  },
  { id: 4, icon: Clock,  iconColor: "#EC4899", iconBg: "#FDF2F8", title: "Sinh nhật Minh Anh",   body: "Hôm nay là sinh nhật của Minh Anh 🎂",   time: "Hôm nay",  read: true  },
];

export function TopBar({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (p: Page) => void;
}) {
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifs, setNotifs]             = useState<Notif[]>(INIT_NOTIFS);
  const notifRef                        = useRef<HTMLDivElement>(null);
  const searchRef                       = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function dismissNotif(id: number) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3.5 bg-card border-b border-border gap-3">
      <div className="min-w-0">
        <h1 className="text-foreground truncate" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
          {titles[activePage]}
        </h1>
        <p className="text-xs text-muted-foreground hidden sm:block mt-0.5 truncate">
          {greetings[activePage]}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <div
            className={`flex items-center gap-2 rounded-xl bg-muted transition-all duration-200 ${
              searchOpen ? "w-44 px-3 py-2" : "w-9 h-9 justify-center cursor-pointer"
            }`}
            onClick={() => !searchOpen && setSearchOpen(true)}
          >
            <Search size={15} className="text-muted-foreground shrink-0" />
            {searchOpen && (
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            )}
            {searchOpen && searchQuery && (
              <button
                onClick={e => { e.stopPropagation(); setSearchQuery(""); }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className={`relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center transition-colors ${
              notifOpen ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-card" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                    Thông báo {unread > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                        {unread}
                      </span>
                    )}
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-primary hover:opacity-80 transition-opacity"
                      style={{ fontSize: "0.78rem", fontWeight: 600 }}
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2 text-center">
                      <Bell size={24} className="text-muted-foreground opacity-40" />
                      <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không có thông báo</p>
                    </div>
                  ) : notifs.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors ${
                        !n.read ? "bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: n.iconBg }}>
                        <n.icon size={14} style={{ color: n.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-foreground truncate" style={{ fontWeight: n.read ? 500 : 700, fontSize: "0.8125rem" }}>
                            {n.title}
                          </p>
                          <button
                            onClick={() => dismissNotif(n.id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-0.5 leading-snug" style={{ fontSize: "0.75rem" }}>{n.body}</p>
                        <p className="text-muted-foreground mt-1 opacity-60" style={{ fontSize: "0.7rem" }}>{n.time} trước</p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar — profile shortcut */}
        <button
          onClick={() => onNavigate("profile")}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            activePage === "profile"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <User size={15} />
        </button>
      </div>
    </header>
  );
}
