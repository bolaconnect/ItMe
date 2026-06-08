import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Clock, Search, CalendarDays, MapPin, AlignLeft,
  CheckCircle2, Circle, Sparkles, Calendar
} from "lucide-react";
import { useAppStore, CalEvent } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeEvents, addEvent, deleteEvent } from "../../lib/eventsService";
import { subscribeTasks, addTask, updateTask } from "../../lib/tasksService";
import { addHabit } from "../../lib/habitsService";
import { TYPE_META, PRIORITY_COLOR, EventDetailModal, EventForm, CalendarPage } from "./CalendarPage";
import { solarToLunar } from "../utils/lunarCalendar";

const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = toISO(new Date());

export function EventsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail]     = useState<CalEvent | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType]   = useState<"all" | "event" | "task">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode]         = useState<"list" | "calendar">("list");

  const { events, setEvents, tasks, setTasks } = useAppStore();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubEvents = subscribeEvents(uid, setEvents);
    const unsubTasks  = subscribeTasks(uid, setTasks);
    return () => { unsubEvents(); unsubTasks(); };
  }, [uid, setEvents, setTasks]);

  // Combine events and tasks
  const combinedEvents = useMemo(() => {
    // Note: We include both done and undone tasks!
    const taskEvents: (CalEvent & { done?: boolean; priority?: string })[] = tasks.filter(t => t.dueDate).map(t => ({
      id: t.id + "_task", 
      title: t.title, 
      date: t.dueDate as string, 
      time: t.dueTime || undefined,
      type: "task", 
      color: PRIORITY_COLOR[t.priority], 
      note: t.description,
      done: t.done,
      priority: t.priority
    }));
    return [...events, ...taskEvents] as (CalEvent & { done?: boolean; priority?: string })[];
  }, [events, tasks]);

  // Handle checking a task
  async function handleToggleTask(e: React.MouseEvent, evId: string, currentDone: boolean) {
    e.stopPropagation();
    if (!uid || !evId.endsWith("_task")) return;
    const taskId = evId.replace("_task", "");
    
    // Optimistic
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !currentDone } : t));
    try {
      await updateTask(uid, taskId, { done: !currentDone });
    } catch (err) {
      console.error(err);
      // Revert
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: currentDone } : t));
    }
  }

  // Filter combined events
  const filteredEvents = useMemo(() => {
    return combinedEvents.filter(ev => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesLoc = ev.location?.toLowerCase().includes(q) ?? false;
        const matchesNote = ev.note?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesLoc && !matchesNote) return false;
      }
      
      // 2. Category Filter
      if (filterType !== "all" && ev.type !== filterType) return false;
      
      // 3. Selected Date Filter
      if (selectedDate && ev.date !== selectedDate) return false;
      
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }, [combinedEvents, searchQuery, filterType, selectedDate]);

  // Group by date
  const grouped = filteredEvents.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, typeof combinedEvents>);

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  // Generate date strip (2 days ago to 7 days ahead)
  const dateStrip = useMemo(() => {
    const arr = [];
    const base = new Date();
    for (let i = -2; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const lunar = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
      arr.push({
        dateStr: toISO(d),
        dayNum: d.getDate(),
        weekday: VN_DAYS[d.getDay()],
        isToday: toISO(d) === TODAY,
        lunarStr: lunar.day === 1 ? `1/${lunar.month}` : lunar.day.toString(),
      });
    }
    return arr;
  }, []);

  const daysWithEvents = useMemo(() => {
    const set = new Set<string>();
    combinedEvents.forEach(e => set.add(e.date));
    return set;
  }, [combinedEvents]);

  // Scroll horizontal strip to "Today" on mount
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollTo({ left: 100, behavior: "smooth" });
    }
  }, []);

  const todayEventsCount = combinedEvents.filter(e => e.date === TODAY && e.type === "event").length;
  const todayTasksCount = tasks.filter(t => t.dueDate === TODAY && !t.done).length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── HEADER BANNER ── */}
      <div className="shrink-0 px-4 pt-5 pb-3 bg-card border-b border-border z-10 shadow-sm relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <CalendarDays size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles size={22} className="text-primary" />
              Hành trình
            </h1>
            
            {/* Segmented Toggle List/Calendar */}
            <div className="flex p-0.5 rounded-xl bg-muted border border-border shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                Danh sách
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "calendar"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                Lịch biểu
              </button>
            </div>
          </div>

          {viewMode === "list" && (
            <>
              <p className="text-muted-foreground text-sm mt-1 mb-4 font-medium">
                Hôm nay: {todayEventsCount} sự kiện & {todayTasksCount} việc chưa làm.
              </p>

              {/* Search & Filter row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center bg-muted/60 rounded-xl px-3 py-2.5 focus-within:ring-2 ring-primary/20 transition-all border border-transparent focus-within:border-primary/30">
                  <Search size={16} className="text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện, công việc..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {[
                  { id: "all", label: "Tất cả", count: combinedEvents.length },
                  { id: "event", label: "Sự kiện", count: events.length },
                  { id: "task", label: "Công việc", count: tasks.filter(t => t.dueDate).length },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                      filterType === f.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                        : "bg-background text-muted-foreground border-border hover:bg-muted font-medium"
                    }`}
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {f.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-[0.65rem] font-bold ${
                      filterType === f.id ? "bg-black/15 text-white" : "bg-muted-foreground/15 text-foreground"
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* ── WEEKLY DATE STRIP ── */}
          <div className="shrink-0 border-b border-border bg-card/50 py-3 relative z-10">
            <div ref={stripRef} className="flex gap-2.5 overflow-x-auto scrollbar-none px-4 items-center">
              <button
                onClick={() => setSelectedDate(null)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-2xl border transition-all ${
                  selectedDate === null
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Calendar size={18} className="mb-1" />
                <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>Tất cả</span>
              </button>
              
              <div className="w-px h-10 bg-border shrink-0 mx-1" />

              {dateStrip.map((day) => {
                const active = selectedDate === day.dateStr;
                const hasEv = daysWithEvents.has(day.dateStr);
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-2xl border transition-all relative ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : day.isToday
                          ? "bg-primary/5 text-primary border-primary/20 font-bold hover:bg-primary/10"
                          : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <span className="opacity-80" style={{ fontSize: "0.65rem", fontWeight: active || day.isToday ? 700 : 600 }}>
                      {day.isToday ? "H.nay" : day.weekday}
                    </span>
                    <span style={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.2 }}>
                      {day.dayNum}
                    </span>
                    <span className="text-muted-foreground opacity-80" style={{ fontSize: "0.55rem", fontWeight: 500, marginTop: "1px" }}>
                      {day.lunarStr}
                    </span>
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full transition-colors ${
                      hasEv ? (active ? "bg-white" : "bg-primary") : "opacity-0"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TIMELINE VIEW ── */}
          <div className="flex-1 overflow-y-auto p-4 lg:px-8 pb-28">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center opacity-80">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <CalendarDays size={28} className="text-muted-foreground" />
                </div>
                <p className="text-foreground" style={{ fontWeight: 600 }}>Không tìm thấy dữ liệu</p>
                <p className="text-muted-foreground text-sm">Thử thay đổi bộ lọc hoặc thêm sự kiện mới.</p>
              </div>
            ) : (
              <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-4 before:w-px before:border-l-2 before:border-dashed before:border-border/60">
                {sortedDates.map((date) => {
                  const dateObj = new Date(date);
                  const lunar = solarToLunar(dateObj.getDate(), dateObj.getMonth() + 1, dateObj.getFullYear());
                  const isToday = date === TODAY;
                  const dateStr = isToday ? "Hôm nay" : dateObj.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
                  const lunarFullStr = `ÂL: ${lunar.day} tháng ${lunar.month}`;

                  return (
                    <div key={date} className="mb-8 relative">
                      <div className="absolute -left-6 top-0 w-6 flex justify-center bg-background py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                      </div>
                      <h3 className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                        <span>{dateStr}</span>
                        <span className="text-muted-foreground font-normal" style={{ fontSize: "0.75rem" }}>({lunarFullStr})</span>
                      </h3>

                      <div className="space-y-4">
                        {grouped[date].map((ev) => {
                          const meta = TYPE_META[ev.type];
                          const isTask = ev.type === "task";
                          const isDone = isTask && ev.done;
                          
                          return (
                            <motion.div
                              key={ev.id}
                              layout
                              onClick={() => setDetail(ev)}
                              className={`relative w-full text-left flex items-start gap-3 p-4 rounded-2xl border bg-card hover:shadow-md transition-all cursor-pointer ${
                                isDone ? "opacity-60 grayscale-[0.3]" : ""
                              }`}
                              style={{ borderColor: isTask ? ev.color + "40" : "var(--border)" }}
                            >
                              {isTask && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md" style={{ background: ev.color }} />
                              )}

                              <div className="flex-shrink-0 mt-0.5">
                                {isTask ? (
                                  <button
                                    onClick={(e) => handleToggleTask(e, ev.id, ev.done || false)}
                                    className="w-6 h-6 flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                                  >
                                    {isDone ? (
                                      <CheckCircle2 size={22} style={{ color: ev.color }} />
                                    ) : (
                                      <Circle size={22} className="text-muted-foreground" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
                                    <meta.icon size={16} style={{ color: meta.color }} />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.65rem", fontWeight: 700, background: isTask ? ev.color+"20" : meta.bg, color: isTask ? ev.color : meta.color }}>
                                    {meta.label}
                                  </span>
                                  {ev.time && (
                                    <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                                      <Clock size={10} /> {ev.time}{ev.endTime ? ` - ${ev.endTime}` : ""}
                                    </span>
                                  )}
                                  {isTask && ev.priority && (
                                    <span className="px-1.5 rounded-sm border" style={{ fontSize: "0.65rem", fontWeight: 600, color: ev.color, borderColor: ev.color+"50" }}>
                                      {ev.priority === "high" ? "Cao" : ev.priority === "medium" ? "TB" : "Thấp"}
                                    </span>
                                  )}
                                </div>

                                <p className="text-foreground truncate" style={{ fontWeight: 700, fontSize: "1rem", textDecoration: isDone ? "line-through" : "none" }}>
                                  {ev.title}
                                </p>

                                {(ev.location || ev.note) && (
                                  <div className="mt-2 space-y-1">
                                    {ev.location && (
                                      <p className="flex items-center gap-1.5 text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>
                                        <MapPin size={12} className="shrink-0" /> {ev.location}
                                      </p>
                                    )}
                                    {ev.note && (
                                      <p className="flex items-center gap-1.5 text-muted-foreground truncate italic" style={{ fontSize: "0.75rem" }}>
                                        <AlignLeft size={12} className="shrink-0" /> {ev.note}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-hidden">
          <CalendarPage hideFab={true} />
        </div>
      )}

      {/* ── FAB ADD BUTTON ── */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 right-[72px] lg:bottom-6 lg:right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {detail && (
          <EventDetailModal
            ev={detail}
            onClose={() => setDetail(null)}
            onDelete={async (id) => {
              if (uid && detail.type === "event") {
                await deleteEvent(uid, id as any);
              }
              setDetail(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {formOpen && (
          <EventForm
            defaultDate={selectedDate || TODAY}
            onlyEvent={false}
            onSaveEvent={async (e) => { if (uid) await addEvent(uid, e as any); setFormOpen(false); }}
            onSaveTask={async (t) => { if (uid) await addTask(uid, t as any); setFormOpen(false); }}
            onSaveHabit={async (h) => { if (uid) await addHabit(uid, h as any); setFormOpen(false); }}
            onClose={() => setFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
