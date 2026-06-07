import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, AlignLeft, CheckSquare, Flame, ArrowLeft,
} from "lucide-react";
import { solarToLunar, formatLunarShort, getLunarSpecialDay, getCanChi } from "../utils/lunarCalendar";
import { LunarCountdownStrip } from "./LunarCountdown";

/* ── Types ── */
type EventType = "event" | "task" | "habit";

interface CalEvent {
  id: number;
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM
  endTime?: string;
  type: EventType;
  color: string;
  location?: string;
  note?: string;
}

/* ── Constants ── */
const VN_DAYS  = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                   "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

const TYPE_META: Record<EventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  event: { label: "Sự kiện",  icon: Clock,        color: "var(--primary)", bg: "var(--secondary)" },
  task:  { label: "Công việc", icon: CheckSquare, color: "#10B981",        bg: "color-mix(in srgb, #10B981 15%, transparent)" },
  habit: { label: "Thói quen", icon: Flame,       color: "#F59E0B",        bg: "color-mix(in srgb, #F59E0B 15%, transparent)" },
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = toISO(new Date());

function seedEvents(): CalEvent[] {
  const base = new Date();
  function dayStr(offset: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return toISO(d);
  }
  return [
    { id: 1, title: "Họp team weekly",          date: dayStr(0),  time: "09:00", endTime: "10:00", type: "event", color: "var(--primary)", location: "Phòng họp A" },
    { id: 2, title: "Review code sprint 12",    date: dayStr(0),  time: "14:00", endTime: "15:30", type: "task",  color: "#10B981" },
    { id: 3, title: "Tập thể dục",              date: dayStr(0),  time: "18:00", endTime: "19:00", type: "habit", color: "#F59E0B" },
    { id: 4, title: "Gặp khách hàng ABC",       date: dayStr(1),  time: "10:30", endTime: "12:00", type: "event", color: "var(--primary)", location: "Café The Workshop", note: "Chuẩn bị proposal" },
    { id: 5, title: "Nộp báo cáo tháng",        date: dayStr(1),  type: "task",  color: "#10B981" },
    { id: 6, title: "Sinh nhật Minh Anh",       date: dayStr(2),  type: "event", color: "#EC4899" },
    { id: 7, title: "Workshop UX Design",       date: dayStr(3),  time: "08:30", endTime: "17:00", type: "event", color: "var(--primary)", location: "Toong Coworking" },
    { id: 8, title: "Đọc sách 30 phút",         date: dayStr(3),  time: "21:00", type: "habit", color: "#F59E0B" },
    { id: 9, title: "Deadline dự án Alpha",     date: dayStr(5),  time: "23:59", type: "task",  color: "#EF4444" },
    { id: 10, title: "Khám sức khỏe định kỳ",  date: dayStr(6),  time: "08:00", endTime: "10:00", type: "event", color: "#8B5CF6", location: "Bệnh viện Vinmec" },
    { id: 11, title: "Thiền sáng",              date: dayStr(-1), time: "06:00", type: "habit", color: "#F59E0B" },
    { id: 12, title: "1:1 với Manager",         date: dayStr(-1), time: "15:00", endTime: "15:30", type: "event", color: "var(--primary)" },
    { id: 13, title: "Học tiếng Anh",           date: dayStr(7),  time: "20:00", type: "habit", color: "#3B82F6" },
    { id: 14, title: "Team building",           date: dayStr(8),  time: "09:00", endTime: "18:00", type: "event", color: "#EC4899", location: "Vũng Tàu" },
  ];
}

const INITIAL_EVENTS = seedEvents();

/* ── Helpers ── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ── Event Form ── */
function EventForm({
  defaultDate,
  onSave,
  onClose,
}: {
  defaultDate: string;
  onSave: (e: CalEvent) => void;
  onClose: () => void;
}) {
  const [title, setTitle]     = useState("");
  const [date, setDate]       = useState(defaultDate);
  const [time, setTime]       = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType]       = useState<EventType>("event");
  const [location, setLoc]    = useState("");
  const [note, setNote]       = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: Date.now(), title: title.trim(), date, time: time || undefined,
      endTime: endTime || undefined, type,
      color: TYPE_META[type].color,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>Thêm sự kiện</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tiêu đề *</label>
            <input className="input-base" placeholder="VD: Họp team, Sinh nhật..." value={title}
              onChange={e => setTitle(e.target.value)} required />
          </div>

          {/* Type */}
          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Loại</label>
            <div className="flex gap-2">
              {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([key, meta]) => (
                <button key={key} type="button"
                  onClick={() => setType(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${type === key ? "" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
                  style={type === key ? { background: meta.bg, color: meta.color, fontWeight: 600, fontSize: "0.8rem" } : { fontSize: "0.8rem", fontWeight: 600 }}
                >
                  <meta.icon size={13} />{meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Ngày</label>
              <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Bắt đầu</label>
              <input className="input-base" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Kết thúc</label>
              <input className="input-base" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <span className="flex items-center gap-1.5"><MapPin size={12} />Địa điểm</span>
            </label>
            <input className="input-base" placeholder="Tên địa điểm (tuỳ chọn)"
              value={location} onChange={e => setLoc(e.target.value)} />
          </div>
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              <span className="flex items-center gap-1.5"><AlignLeft size={12} />Ghi chú</span>
            </label>
            <textarea className="input-base resize-none" rows={2} placeholder="Ghi chú thêm..."
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              Huỷ
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              Thêm
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Event pill ── */
function EventPill({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  const meta = TYPE_META[ev.type];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-1.5 py-0.5 rounded-md truncate transition-opacity hover:opacity-80"
      style={{ background: meta.bg, color: meta.color, fontSize: "0.7rem", fontWeight: 600 }}
    >
      {ev.time && <span className="mr-1 opacity-70">{ev.time}</span>}
      {ev.title}
    </button>
  );
}

/* ── Day events modal ── */
function DayModal({
  date, events, onClose, onAdd, onSelectEvent,
}: {
  date: string; events: CalEvent[]; onClose: () => void;
  onAdd: () => void; onSelectEvent: (ev: CalEvent) => void;
}) {
  const d = new Date(date);
  const lunar = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
  const special = getLunarSpecialDay(lunar.day, lunar.month);
  const isToday = date === toISO(new Date());

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                {d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: "0.65rem", fontWeight: 700 }}>Hôm nay</span>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.775rem" }}>
              Âm lịch {lunar.day}/{lunar.month}{lunar.leap ? " nhuận" : ""}
              {special && <span className="ml-2 text-amber-600 font-semibold">· {special}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground ml-2 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Event list */}
        <div className="px-4 pb-2 max-h-72 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không có sự kiện nào</p>
            </div>
          ) : events.map(ev => {
            const meta = TYPE_META[ev.type];
            return (
              <button key={ev.id} onClick={() => onSelectEvent(ev)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                  <meta.icon size={14} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.875rem" }}>{ev.title}</p>
                  {ev.time && (
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.color }} />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2">
          <button onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus size={15} /> Thêm sự kiện
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Event detail modal ── */
function EventDetailModal({ ev, onClose, onDelete }: { ev: CalEvent; onClose: () => void; onDelete: (id: number) => void }) {
  const meta = TYPE_META[ev.type];
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 24, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        {/* Color accent bar */}
        <div className="h-1 w-full" style={{ background: ev.color }} />

        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: meta.bg, color: meta.color }}>
            <meta.icon size={11} />{meta.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4 space-y-3">
          <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{ev.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
              <Clock size={14} className="flex-shrink-0" />
              <span>
                {new Date(ev.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                {ev.time && <><br /><span style={{ fontSize: "0.8rem" }}>{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""}</span></>}
              </span>
            </div>
            {ev.location && (
              <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                <MapPin size={14} className="flex-shrink-0" />
                <span>{ev.location}</span>
              </div>
            )}
            {ev.note && (
              <div className="flex items-start gap-3 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                <AlignLeft size={14} className="flex-shrink-0 mt-0.5" />
                <span>{ev.note}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={() => { onDelete(ev.id); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            Xoá sự kiện
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


/* ── Main page ── */
export function CalendarPage({ onBack }: { onBack?: () => void } = {}) {
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [view, setView]         = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<string>(TODAY);
  const [events, setEvents]     = useState<CalEvent[]>(INITIAL_EVENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [dayModal, setDayModal] = useState<string | null>(null); // date string
  const [detail, setDetail]     = useState<CalEvent | null>(null);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  function getWeekDays() {
    const d = new Date(selected || TODAY);
    const dow = d.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() - dow + i);
      return toISO(day);
    });
  }

  function prevWeek() {
    const d = new Date(selected || TODAY);
    d.setDate(d.getDate() - 7);
    setSelected(toISO(d));
  }
  function nextWeek() {
    const d = new Date(selected || TODAY);
    d.setDate(d.getDate() + 7);
    setSelected(toISO(d));
  }

  function getWeekLabel() {
    const days = getWeekDays();
    const start = new Date(days[0]);
    const end = new Date(days[6]);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}–${end.getDate()} ${VN_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()}/${start.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1} ${end.getFullYear()}`;
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow    = getFirstDayOfWeek(year, month);

  function eventsForDate(date: string) {
    return events.filter(e => e.date === date).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }

  function addEvent(e: CalEvent) {
    setEvents(prev => [e, ...prev]);
    setFormOpen(false);
  }

  function deleteEvent(id: number) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  const selectedEvents = eventsForDate(selected);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 lg:px-6 pt-3 pb-2.5 border-b border-border">
        {/* Nút quay lại (chỉ hiện trong overlay mode) */}
        {onBack && (
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center mr-1 flex-shrink-0"
            title="Quay lại"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        {/* Nav — month or week */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={view === "month" ? prevMonth : prevWeek}
            className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="text-center px-1" style={{ minWidth: view === "month" ? "100px" : "140px" }}>
            {view === "month" ? (
              <>
                <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.2 }}>
                  {VN_MONTHS[month]} {year}
                </h2>
                <p className="text-muted-foreground hidden sm:block" style={{ fontSize: "0.65rem" }}>
                  Năm {getCanChi(solarToLunar(1, month + 1, year).year)}
                </p>
              </>
            ) : (
              <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "0.8125rem", lineHeight: 1.2 }}>
                {getWeekLabel()}
              </h2>
            )}
          </div>
          <button
            onClick={view === "month" ? nextMonth : nextWeek}
            className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex gap-1 ml-auto">
          {(["month", "week"] as const).map(v => (
            <button key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-lg transition-all ${view === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              {v === "month" ? "Tháng" : "Tuần"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* ── Countdown strip ── */}
      <LunarCountdownStrip count={5} />

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden flex flex-col">

          {view === "month" ? (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border shrink-0">
                {VN_DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
                  {/* Empty cells */}
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`e${i}`} className="border-b border-r border-border bg-muted/20" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday    = dateStr === TODAY;
                    const isSelected = dateStr === selected;
                    const dayEvents  = eventsForDate(dateStr);
                    const col    = (firstDow + i) % 7;
                    const isSun  = col === 0;
                    const isSat  = col === 6;
                    const lunar  = solarToLunar(day, month + 1, year);
                    const lunarShort = formatLunarShort(lunar.day, lunar.month);
                    const special    = getLunarSpecialDay(lunar.day, lunar.month);
                    const isRam  = lunar.day === 15;
                    const isMung1 = lunar.day === 1;

                    return (
                      <div
                        key={day}
                        onClick={() => { setSelected(dateStr); setDayModal(dateStr); }}
                        className={`border-b border-r border-border p-1 cursor-pointer transition-colors overflow-hidden flex flex-col gap-0.5
                          ${isSelected && isToday ? "bg-primary/10" : isSelected ? "bg-secondary/60" : isToday ? "bg-primary/5" : "hover:bg-muted/40"}
                          ${special && !isSelected && !isToday ? "bg-amber-400/10" : ""}`}
                      >
                        {/* Solar + Lunar number row */}
                        <div className="flex items-start justify-between gap-0.5">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                              ${isToday ? "bg-primary text-primary-foreground" : isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-foreground"}`}
                            style={{ fontSize: "0.8125rem", fontWeight: isToday ? 700 : 400 }}
                          >
                            {day}
                          </span>
                          <span
                            className={`flex-shrink-0 px-1 rounded leading-tight text-right
                              ${isMung1 || isRam ? "font-bold" : ""}
                              ${isMung1 ? "text-red-500" : isRam ? "text-amber-600" : "text-muted-foreground"}`}
                            style={{ fontSize: "0.65rem", marginTop: "3px" }}
                          >
                            {lunarShort}{lunar.leap ? "n" : ""}
                          </span>
                        </div>

                        {/* Special day label */}
                        {special && (
                          <div
                            className="px-1 py-0.5 rounded bg-amber-400/20 text-amber-700 truncate leading-tight"
                            style={{ fontSize: "0.6rem", fontWeight: 700 }}
                          >
                            {special}
                          </div>
                        )}

                        {/* Events */}
                        <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map(ev => (
                            <EventPill key={ev.id} ev={ev} onClick={e => { e.stopPropagation(); setSelected(dateStr); setDayModal(dateStr); }} />
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>
                              +{dayEvents.length - 2} thêm
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* ── Week view ── */
            <>
              <div className="grid grid-cols-7 border-b border-border shrink-0">
                {getWeekDays().map((dateStr) => {
                  const d = new Date(dateStr);
                  const isToday = dateStr === TODAY;
                  const isSel = dateStr === selected;
                  const isSun = d.getDay() === 0;
                  const lunar = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
                  const special = getLunarSpecialDay(lunar.day, lunar.month);
                  const isRam  = lunar.day === 15;
                  const isMung = lunar.day === 1;
                  return (
                    <button key={dateStr}
                      onClick={() => { setSelected(dateStr); setDayModal(dateStr); }}
                      className={`py-2 flex flex-col items-center gap-0.5 transition-colors ${isSel ? "bg-secondary/60" : "hover:bg-muted/40"}`}
                    >
                      <span className={`${isSun ? "text-red-500" : "text-muted-foreground"}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                        {VN_DAYS[d.getDay()]}
                      </span>
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : isSun ? "text-red-500" : "text-foreground"}`}
                        style={{ fontWeight: isToday ? 700 : 500, fontSize: "0.9375rem" }}
                      >
                        {d.getDate()}
                      </span>
                      {/* Âm lịch */}
                      <span
                        className={`${isMung || isRam ? "font-bold" : ""} ${isMung ? "text-red-500" : isRam ? "text-amber-600" : "text-muted-foreground"}`}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {formatLunarShort(lunar.day, lunar.month)}
                      </span>
                      {special && (
                        <span className="text-amber-600 text-center leading-tight px-0.5" style={{ fontSize: "0.58rem", fontWeight: 700 }}>
                          {special.slice(0, 8)}
                        </span>
                      )}
                      {eventsForDate(dateStr).length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {eventsForDate(dateStr).slice(0, 3).map(ev => (
                            <div key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.color }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected day events */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(() => {
                  const selDate = new Date(selected);
                  const lunar = solarToLunar(selDate.getDate(), selDate.getMonth() + 1, selDate.getFullYear());
                  const special = getLunarSpecialDay(lunar.day, lunar.month);
                  return (
                    <div className="mb-3">
                      <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                        {selDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: "0.8rem" }}>
                        <span>Âm lịch: {lunar.day}/{lunar.month}{lunar.leap ? " (nhuận)" : ""}</span>
                        {special && <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{special}</span>}
                      </p>
                    </div>
                  );
                })()}
                {selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Clock size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không có sự kiện nào</p>
                    <button onClick={() => setFormOpen(true)}
                      className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
                      style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                      <Plus size={14} /> Thêm sự kiện
                    </button>
                  </div>
                ) : (
                  selectedEvents.map(ev => {
                    const meta = TYPE_META[ev.type];
                    return (
                      <motion.button
                        key={ev.id}
                        layout
                        onClick={() => setDetail(ev)}
                        className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-border bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
                          <meta.icon size={16} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{ev.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {ev.time && <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>{ev.time}{ev.endTime && ` - ${ev.endTime}`}</span>}
                            {ev.location && <span className="text-muted-foreground truncate" style={{ fontSize: "0.8rem" }}>· {ev.location}</span>}
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: ev.color }} />
                      </motion.button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Day events modal */}
      <AnimatePresence>
        {dayModal && (
          <DayModal
            date={dayModal}
            events={eventsForDate(dayModal)}
            onClose={() => setDayModal(null)}
            onAdd={() => { setDayModal(null); setFormOpen(true); }}
            onSelectEvent={ev => { setDayModal(null); setDetail(ev); }}
          />
        )}
      </AnimatePresence>

      {/* Event detail modal */}
      <AnimatePresence>
        {detail && (
          <EventDetailModal
            ev={detail}
            onClose={() => setDetail(null)}
            onDelete={deleteEvent}
          />
        )}
      </AnimatePresence>

      {/* Today floating button — only when not on current period */}
      <AnimatePresence>
        {(() => {
          const isMonthView = view === "month";
          const showBtn = isMonthView
            ? !(year === now.getFullYear() && month === now.getMonth())
            : !getWeekDays().includes(TODAY);
          return showBtn ? (
            <motion.button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(TODAY); }}
              className="fixed bottom-36 left-1/2 -translate-x-1/2 lg:bottom-20 z-40 px-5 py-2 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-secondary transition-colors"
              style={{ fontWeight: 700, fontSize: "0.8125rem", boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Hôm nay
            </motion.button>
          ) : null;
        })()}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* Form */}
      <AnimatePresence>
        {formOpen && (
          <EventForm defaultDate={selected} onSave={addEvent} onClose={() => setFormOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
