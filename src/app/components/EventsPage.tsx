import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Clock } from "lucide-react";
import { useAppStore, CalEvent } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeEvents, addEvent, deleteEvent } from "../../lib/eventsService";
import { addTask } from "../../lib/tasksService";
import { addHabit } from "../../lib/habitsService";
import { TYPE_META, PRIORITY_COLOR, EventDetailModal, EventForm } from "./CalendarPage";

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = toISO(new Date());

export function EventsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail]     = useState<CalEvent | null>(null);

  const { events, setEvents, tasks } = useAppStore();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeEvents(uid, (data) => {
      setEvents(data);
    });
    return () => unsubscribe();
  }, [uid, setEvents]);

  const combinedEvents: CalEvent[] = useMemo(() => {
    const taskEvents: CalEvent[] = tasks.filter(t => !t.done && t.dueDate).map(t => ({
      id: t.id + "_task", title: t.title, date: t.dueDate as string, time: t.dueTime || undefined,
      type: "task", color: PRIORITY_COLOR[t.priority], note: t.description
    }));
    return [...events, ...taskEvents];
  }, [events, tasks]);

  // Sort and filter events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    return combinedEvents
      .filter(e => {
        if (e.date < TODAY) return false;
        if (e.date === TODAY && e.time && e.time < currentHHmm) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }, [combinedEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    return combinedEvents
      .filter(e => {
        if (e.date < TODAY) return true;
        if (e.date === TODAY && e.time && e.time < currentHHmm) return true;
        return false;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || (b.time || "").localeCompare(a.time || ""));
  }, [combinedEvents]);

  const displayEvents = tab === "upcoming" ? upcomingEvents : pastEvents;

  // Group by date
  const grouped = displayEvents.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, CalEvent[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => tab === "upcoming" ? a.localeCompare(b) : b.localeCompare(a));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Tabs ── */}
      <div className="shrink-0 flex items-center justify-center p-4 border-b border-border relative z-10">
        <div className="flex bg-muted p-1 rounded-xl w-full max-w-sm">
          <button
            onClick={() => setTab("upcoming")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all ${
              tab === "upcoming" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Sắp tới {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all ${
              tab === "past" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            Đã qua
          </button>
        </div>
      </div>

      {/* ── Event List ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:px-8 space-y-6 pb-28">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center opacity-80">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Clock size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mt-2" style={{ fontWeight: 600 }}>Không có sự kiện nào</p>
          </div>
        ) : (
          sortedDates.map(date => {
            const dateObj = new Date(date);
            const isToday = date === TODAY;
            const dateStr = isToday ? "Hôm nay" : dateObj.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

            return (
              <div key={date}>
                <h3 className="mb-3" style={{ fontWeight: 700, fontSize: "0.9375rem", color: isToday ? "var(--primary)" : "var(--muted-foreground)" }}>
                  {dateStr}
                </h3>
                <div className="space-y-3">
                  {grouped[date].map(ev => {
                    const meta = TYPE_META[ev.type];
                    return (
                      <motion.button key={ev.id} layout onClick={() => setDetail(ev)} className="w-full text-left flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
                        <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ev.type === "task" ? "color-mix(in srgb, "+ev.color+" 15%, transparent)" : meta.bg }}>
                          <meta.icon size={18} style={{ color: ev.type === "task" ? ev.color : meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate" style={{ fontWeight: 700, fontSize: "1rem" }}>{ev.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {ev.time && <span className="text-muted-foreground" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{ev.time}{ev.endTime && ` - ${ev.endTime}`}</span>}
                            {ev.location && <span className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>· {ev.location}</span>}
                          </div>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0" style={{ background: ev.color }} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add Button ── */}
      <button onClick={() => setFormOpen(true)} className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[45] w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
        <Plus size={24} />
      </button>

      {/* ── Modals ── */}
      <AnimatePresence>{detail && <EventDetailModal ev={detail} onClose={() => setDetail(null)} onDelete={async (id) => { if (uid) await deleteEvent(uid, id as any); setDetail(null); }} />}</AnimatePresence>
      <AnimatePresence>
        {formOpen && <EventForm defaultDate={TODAY} onlyEvent={true}
          onSaveEvent={async (e) => { if (uid) await addEvent(uid, e as any); setFormOpen(false); }}
          onSaveTask={async (t) => { if (uid) await addTask(uid, t as any); setFormOpen(false); }}
          onSaveHabit={async (h) => { if (uid) await addHabit(uid, h as any); setFormOpen(false); }}
          onClose={() => setFormOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
