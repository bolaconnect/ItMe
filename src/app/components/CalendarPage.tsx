import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, AlignLeft, CheckSquare, Flame, ArrowLeft,
  Sun, Moon, Coffee, Dumbbell, Book, Heart, Droplets, Music, Zap
} from "lucide-react";
import { solarToLunar, formatLunarShort, getLunarSpecialDay, getCanChi } from "../utils/lunarCalendar";
import { LunarCountdownStrip } from "./LunarCountdown";
import { useAppStore, CalEvent, EventType, HabitIcon, Frequency, Habit } from "../store/useAppStore";
import type { Task, Priority } from "./tasks/taskData";
import { auth } from "../../lib/firebase";
import { subscribeEvents, addEvent, deleteEvent } from "../../lib/eventsService";
import { addTask, deleteTask } from "../../lib/tasksService";
import { addHabit, deleteHabit } from "../../lib/habitsService";

/* ── Constants ── */
const VN_DAYS  = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                   "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export const TYPE_META: Record<EventType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  event: { label: "Sự kiện",  icon: Clock,        color: "var(--primary)", bg: "var(--secondary)" },
  task:  { label: "Công việc", icon: CheckSquare, color: "#10B981",        bg: "color-mix(in srgb, #10B981 15%, transparent)" },
  habit: { label: "Thói quen", icon: Flame,       color: "#F59E0B",        bg: "color-mix(in srgb, #F59E0B 15%, transparent)" },
};

const COLOR_BG: Record<string, string> = {
  "var(--primary)": "var(--secondary)",
  "#10B981": "#ECFDF5",
  "#F59E0B": "#FFFBEB",
  "#EF4444": "#FEF2F2",
  "#3B82F6": "#EFF6FF",
  "#8B5CF6": "#F5F3FF",
  "#EC4899": "#FDF2F8",
  "#14B8A6": "#F0FDFA",
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = toISO(new Date());

export const PRIORITY_COLOR: Record<Priority, string> = { high: "#E53935", medium: "#FFB347", low: "#4CAF50" };

const COLOR_OPTIONS = ["var(--primary)", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];
const FREQ_LABEL: Record<Frequency, string> = { daily: "Hàng ngày", weekdays: "Ngày thường", weekends: "Cuối tuần" };
const ICON_OPTIONS: { id: HabitIcon; El: React.ElementType }[] = [
  { id: "sun", El: Sun }, { id: "moon", El: Moon }, { id: "coffee", El: Coffee },
  { id: "dumbbell", El: Dumbbell }, { id: "book", El: Book }, { id: "heart", El: Heart },
  { id: "droplets", El: Droplets }, { id: "music", El: Music }, { id: "zap", El: Zap }, { id: "flame", El: Flame }
];

/* ── Helpers ── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function EventForm({
  defaultDate,
  onlyEvent,
  onSaveEvent, onSaveTask, onSaveHabit,
  onClose,
}: {
  defaultDate: string;
  onlyEvent?: boolean;
  onSaveEvent: (e: Omit<CalEvent, "id" | "createdAt">) => void;
  onSaveTask: (t: Omit<Task, "id" | "createdAt">) => void;
  onSaveHabit: (h: Omit<Habit, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [type, setType]       = useState<EventType>("event");
  const [title, setTitle]     = useState("");
  const [date, setDate]       = useState(defaultDate);
  
  // Event
  const [time, setTime]       = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLoc]    = useState("");
  const [note, setNote]       = useState("");

  // Task
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("Công việc");

  // Habit
  const [icon, setIcon]         = useState<HabitIcon>("sun");
  const [color, setColor]       = useState("var(--primary)");
  const [frequency, setFreq]    = useState<Frequency>("daily");
  const [err, setErr]           = useState("");

  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Xoá lỗi khi người dùng thay đổi dữ liệu đầu vào
  useEffect(() => {
    setErr("");
  }, [type, title, date, time, endTime]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (type !== "habit") {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date < todayStr) {
        setErr("Không thể chọn ngày trong quá khứ");
        return;
      }
      if (date === todayStr && time) {
        const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (time < currentHHmm) {
          setErr("Không thể chọn thời gian trong quá khứ");
          return;
        }
      }
      if (type === "event" && endTime && time && endTime < time) {
        setErr("Giờ kết thúc không thể trước giờ bắt đầu");
        return;
      }
    }

    if (type === "event") {
      onSaveEvent({
        title: title.trim(), date, time: time || undefined,
        endTime: endTime || undefined, type,
        color: TYPE_META.event.color,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
      } as any);
    } else if (type === "task") {
      onSaveTask({
        title: title.trim(), description: note.trim(), done: false,
        priority, category, dueDate: date, dueTime: time || "",
      } as any);
    } else if (type === "habit") {
      onSaveHabit({
        name: title.trim(), desc: note.trim(), icon, color,
        frequency, streak: 0, best: 0, completedDates: [],
      } as any);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        layout
        className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>Thêm mới</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          
          {/* Type */}
          {!onlyEvent && (
            <div>
              <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Loại</label>
              <div className="flex gap-2">
                {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([key, meta]) => (
                  <motion.button key={key} type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setType(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${type === key ? "" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
                    style={type === key ? { background: meta.bg, color: meta.color, fontWeight: 600, fontSize: "0.8rem", boxShadow: "0 2px 10px " + meta.bg } : { fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    <meta.icon size={13} />{meta.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.25, type: "spring", bounce: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{type === "habit" ? "Tên thói quen *" : "Tiêu đề *"}</label>
                <input className="input-base" placeholder={type === "habit" ? "VD: Đọc sách" : "VD: Họp team..."} value={title}
                  onChange={e => setTitle(e.target.value)} required />
              </div>

              {/* EVENT & TASK FIELDS */}
              {type !== "habit" && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Ngày</label>
                    <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)} min={localToday} />
                  </div>
                  <div>
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{type === "task" ? "Giờ hạn" : "Bắt đầu"}</label>
                    <input 
                      className="input-base" 
                      type="time" 
                      value={time} 
                      onChange={e => setTime(e.target.value)} 
                      min={date === localToday ? currentHHmm : undefined}
                    />
                  </div>
                  {type === "event" && (
                    <div>
                      <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Kết thúc</label>
                      <input 
                        className="input-base" 
                        type="time" 
                        value={endTime} 
                        onChange={e => setEndTime(e.target.value)} 
                        min={date === localToday ? (time || currentHHmm) : (time || undefined)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TASK SPECIFIC FIELDS */}
              {type === "task" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Mức độ ưu tiên</label>
                    <div className="flex gap-2">
                      {(["high", "medium", "low"] as Priority[]).map((p) => {
                        const PL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
                        return (
                          <motion.button
                            key={p} type="button" onClick={() => setPriority(p)}
                            whileTap={{ scale: 0.95 }}
                            className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                              priority === p
                                ? p === "high"   ? "bg-red-50 border-red-300 text-red-600 font-medium"
                                : p === "medium" ? "bg-yellow-50 border-yellow-300 text-yellow-700 font-medium"
                                :                  "bg-green-50 border-green-300 text-green-600 font-medium"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {PL[p]}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Danh mục</label>
                    <select className="input-base" value={category} onChange={e => setCategory(e.target.value)}>
                      {["Công việc", "Cá nhân", "Học tập", "Sức khoẻ", "Tài chính", "Gia đình", "Khác"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* HABIT SPECIFIC FIELDS */}
              {type === "habit" && (
                <>
                  <div>
                    <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Biểu tượng</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ICON_OPTIONS.map(({ id, El }) => (
                        <motion.button key={id} type="button" onClick={() => setIcon(id)}
                          whileTap={{ scale: 0.9 }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === id ? "ring-2 ring-offset-1" : "bg-muted hover:bg-secondary"}`}
                          style={icon === id ? { background: COLOR_BG[color] ?? "var(--secondary)", color, ringColor: color } : {}}>
                          <El size={16} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Màu sắc</label>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {COLOR_OPTIONS.map(c => (
                        <motion.button key={c} type="button" onClick={() => setColor(c)}
                          whileTap={{ scale: 0.8 }}
                          className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                          style={{ background: c, ringColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tần suất</label>
                    <div className="flex gap-2">
                      {(["daily", "weekdays", "weekends"] as Frequency[]).map(f => (
                        <motion.button key={f} type="button" onClick={() => setFreq(f)}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 py-2 rounded-xl transition-all ${frequency === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
                          style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {FREQ_LABEL[f]}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* COMMON OPTIONAL FIELDS */}
              {type === "event" && (
                <div>
                  <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                    <span className="flex items-center gap-1.5"><MapPin size={12} />Địa điểm</span>
                  </label>
                  <input className="input-base" placeholder="Tên địa điểm (tuỳ chọn)"
                    value={location} onChange={e => setLoc(e.target.value)} />
                </div>
              )}
              
              <div>
                <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  <span className="flex items-center gap-1.5"><AlignLeft size={12} />{type === "habit" ? "Mô tả ngắn" : "Ghi chú"}</span>
                </label>
                <textarea className="input-base resize-none" rows={2} placeholder="Ghi chú thêm..."
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </motion.div>
          </AnimatePresence>

          {err && <p className="text-xs text-destructive text-center mt-1 mb-2 font-medium">{err}</p>}
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
function EventPill({ ev, onClick }: { ev: CalEvent; onClick: (e: any) => void }) {
  const meta = TYPE_META[ev.type];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-full text-left px-1.5 py-0.5 rounded-md truncate transition-opacity hover:opacity-80"
      style={{ background: ev.type === "task" ? "color-mix(in srgb, "+ev.color+" 15%, transparent)" : meta.bg, color: ev.type === "task" ? ev.color : meta.color, fontSize: "0.7rem", fontWeight: 600 }}
    >
      {ev.time && <span className="mr-1 opacity-70">{ev.time}</span>}
      {ev.title}
    </motion.button>
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
        initial={{ y: 32, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
                {d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {isToday && <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: "0.65rem", fontWeight: 700 }}>Hôm nay</span>}
            </div>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.775rem" }}>
              Âm lịch {lunar.day}/{lunar.month}{lunar.leap ? " nhuận" : ""}
              {special && <span className="ml-2 text-amber-600 font-semibold">· {special}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground ml-2 flex-shrink-0"><X size={16} /></button>
        </div>

        <div className="px-4 pb-2 max-h-72 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không có công việc hay sự kiện nào</p>
            </div>
          ) : events.map(ev => {
            const meta = TYPE_META[ev.type];
            return (
              <motion.button key={ev.id} onClick={() => onSelectEvent(ev)}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ev.type === "task" ? "color-mix(in srgb, "+ev.color+" 15%, transparent)" : meta.bg }}>
                  <meta.icon size={14} style={{ color: ev.type === "task" ? ev.color : meta.color }} />
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
              </motion.button>
            );
          })}
        </div>

        <div className="px-4 pb-4 pt-2">
          <button onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus size={15} /> Thêm mới
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Event detail modal ── */
export function EventDetailModal({ ev, onClose, onDelete }: { ev: CalEvent; onClose: () => void; onDelete: (id: string) => void }) {
  const meta = TYPE_META[ev.type];
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="h-1 w-full" style={{ background: ev.color }} />
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 700, background: ev.type === "task" ? "color-mix(in srgb, "+ev.color+" 15%, transparent)" : meta.bg, color: ev.type === "task" ? ev.color : meta.color }}>
            <meta.icon size={11} />{meta.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={15} /></button>
        </div>

        <div className="px-5 pb-4 space-y-3">
          <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{ev.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
              <Clock size={14} className="flex-shrink-0" />
              <span>
                {new Date(ev.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                {(() => {
                  const d = new Date(ev.date);
                  const lunar = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
                  return <span className="opacity-80"> (ÂL: {lunar.day}/{lunar.month})</span>;
                })()}
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
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            Xoá {meta.label.toLowerCase()}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card w-full rounded-2xl shadow-2xl p-6 border border-border"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Xóa {meta.label.toLowerCase()}</h3>
              <p className="text-muted-foreground text-[15px] mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa {meta.label.toLowerCase()} <strong>{ev.title}</strong> này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Hủy
                </button>
                <button onClick={() => { onDelete(ev.id); onClose(); }} className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main page ── */
export function CalendarPage({ onBack, hideFab = false }: { onBack?: () => void; hideFab?: boolean } = {}) {
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [view, setView]         = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<string>(TODAY);
  
  const { events, setEvents, tasks, setTasks, habits, setHabits } = useAppStore();

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
      id: t.id + "_task", title: t.title, date: t.dueDate, time: t.dueTime || undefined,
      type: "task", color: PRIORITY_COLOR[t.priority], note: t.description
    }));
    return [...events, ...taskEvents];
  }, [events, tasks]);

  const [formOpen, setFormOpen] = useState(false);
  const [dayModal, setDayModal] = useState<string | null>(null);
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

  function prevWeek() { const d = new Date(selected || TODAY); d.setDate(d.getDate() - 7); setSelected(toISO(d)); }
  function nextWeek() { const d = new Date(selected || TODAY); d.setDate(d.getDate() + 7); setSelected(toISO(d)); }

  function getWeekLabel() {
    const days = getWeekDays();
    const start = new Date(days[0]); const end = new Date(days[6]);
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${end.getDate()} ${VN_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    return `${start.getDate()}/${start.getMonth()+1} – ${end.getDate()}/${end.getMonth()+1} ${end.getFullYear()}`;
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow    = getFirstDayOfWeek(year, month);

  function eventsForDate(date: string) {
    return combinedEvents.filter(e => e.date === date).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }

  const selectedEvents = eventsForDate(selected);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 lg:px-6 pt-3 pb-2.5 border-b border-border">
        {onBack && (
          <button onClick={onBack} className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center mr-1 flex-shrink-0">
            <ArrowLeft size={15} />
          </button>
        )}
        <div className="flex items-center gap-0.5">
          <button onClick={view === "month" ? prevMonth : prevWeek} className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center">
            <ChevronLeft size={15} />
          </button>
          <div className="text-center px-1" style={{ minWidth: view === "month" ? "100px" : "140px" }}>
            {view === "month" ? (
              <>
                <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.2 }}>{VN_MONTHS[month]} {year}</h2>
                <p className="text-muted-foreground hidden sm:block" style={{ fontSize: "0.65rem" }}>Năm {getCanChi(solarToLunar(1, month + 1, year).year)}</p>
              </>
            ) : (
              <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "0.8125rem", lineHeight: 1.2 }}>{getWeekLabel()}</h2>
            )}
          </div>
          <button onClick={view === "month" ? nextMonth : nextWeek} className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex gap-1 ml-auto">
          {(["month", "week"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1 rounded-lg transition-all ${view === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {v === "month" ? "Tháng" : "Tuần"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "month" ? (
            <>
              <div className="grid grid-cols-7 border-b border-border shrink-0">
                {VN_DAYS.map(d => <div key={d} className="py-2 text-center text-muted-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{d}</div>)}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
                  {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} className="border-b border-r border-border bg-muted/20" />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday    = dateStr === TODAY;
                    const isSelected = dateStr === selected;
                    const dayEvents  = eventsForDate(dateStr);
                    const col    = (firstDow + i) % 7;
                    const lunar  = solarToLunar(day, month + 1, year);
                    const lunarShort = formatLunarShort(lunar.day, lunar.month);
                    const special    = getLunarSpecialDay(lunar.day, lunar.month);
                    return (
                      <div key={day} onClick={() => { setSelected(dateStr); setDayModal(dateStr); }}
                        className={`border-b border-r border-border p-1 cursor-pointer transition-colors overflow-hidden flex flex-col gap-0.5
                          ${isSelected && isToday ? "bg-primary/10" : isSelected ? "bg-secondary/60" : isToday ? "bg-primary/5" : "hover:bg-muted/40"}
                          ${special && !isSelected && !isToday ? "bg-amber-400/10" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-0.5">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${isToday ? "bg-primary text-primary-foreground" : col===0 ? "text-red-500" : col===6 ? "text-blue-500" : "text-foreground"}`} style={{ fontSize: "0.8125rem", fontWeight: isToday ? 700 : 400 }}>{day}</span>
                          <span className={`flex-shrink-0 px-1 rounded leading-tight text-right ${lunar.day===1 || lunar.day===15 ? "font-bold" : ""} ${lunar.day===1 ? "text-red-500" : lunar.day===15 ? "text-amber-600" : "text-muted-foreground"}`} style={{ fontSize: "0.65rem", marginTop: "3px" }}>{lunarShort}{lunar.leap ? "n" : ""}</span>
                        </div>
                        {special && <div className="px-1 py-0.5 rounded bg-amber-400/20 text-amber-700 truncate leading-tight" style={{ fontSize: "0.6rem", fontWeight: 700 }}>{special}</div>}
                        <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map(ev => <EventPill key={ev.id} ev={ev} onClick={e => { e.stopPropagation(); setSelected(dateStr); setDayModal(dateStr); }} />)}
                          {dayEvents.length > 2 && <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>+{dayEvents.length - 2} thêm</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-border shrink-0">
                {getWeekDays().map((dateStr) => {
                  const d = new Date(dateStr); const lunar = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
                  const special = getLunarSpecialDay(lunar.day, lunar.month);
                  return (
                    <button key={dateStr} onClick={() => { setSelected(dateStr); }} className={`py-2 flex flex-col items-center gap-0.5 transition-colors ${dateStr === selected ? "bg-secondary/60" : "hover:bg-muted/40"}`}>
                      <span className={`${d.getDay() === 0 ? "text-red-500" : "text-muted-foreground"}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>{VN_DAYS[d.getDay()]}</span>
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full ${dateStr === TODAY ? "bg-primary text-primary-foreground" : d.getDay() === 0 ? "text-red-500" : "text-foreground"}`} style={{ fontWeight: dateStr === TODAY ? 700 : 500, fontSize: "0.9375rem" }}>{d.getDate()}</span>
                      <span className={`${lunar.day===1||lunar.day===15?"font-bold":""} ${lunar.day===1?"text-red-500":lunar.day===15?"text-amber-600":"text-muted-foreground"}`} style={{ fontSize: "0.65rem" }}>{formatLunarShort(lunar.day, lunar.month)}</span>
                      {special && <span className="text-amber-600 text-center leading-tight px-0.5" style={{ fontSize: "0.58rem", fontWeight: 700 }}>{special.slice(0, 8)}</span>}
                      {eventsForDate(dateStr).length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {eventsForDate(dateStr).slice(0, 3).map(ev => <div key={ev.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.color }} />)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(() => {
                  const selDate = new Date(selected); const lunar = solarToLunar(selDate.getDate(), selDate.getMonth() + 1, selDate.getFullYear());
                  const special = getLunarSpecialDay(lunar.day, lunar.month);
                  return (
                    <div className="mb-3">
                      <p className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{selDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</p>
                      <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: "0.8rem" }}>
                        <span>Âm lịch: {lunar.day}/{lunar.month}{lunar.leap ? " (nhuận)" : ""}</span>
                        {special && <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{special}</span>}
                      </p>
                    </div>
                  );
                })()}
                {selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><Clock size={20} className="text-muted-foreground" /></div>
                    <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không có lịch trình nào</p>
                    <button onClick={() => setFormOpen(true)} className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                      <Plus size={14} /> Thêm mới
                    </button>
                  </div>
                ) : (
                  selectedEvents.map(ev => {
                    const meta = TYPE_META[ev.type];
                    return (
                      <motion.button key={ev.id} layout onClick={() => setDetail(ev)} className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
                        <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ev.type === "task" ? "color-mix(in srgb, "+ev.color+" 15%, transparent)" : meta.bg }}>
                          <meta.icon size={16} style={{ color: ev.type === "task" ? ev.color : meta.color }} />
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

      <AnimatePresence>{dayModal && <DayModal date={dayModal} events={eventsForDate(dayModal)} onClose={() => setDayModal(null)} onAdd={() => { setDayModal(null); setFormOpen(true); }} onSelectEvent={ev => { setDayModal(null); setDetail(ev); }} />}</AnimatePresence>
      <AnimatePresence>{detail && <EventDetailModal ev={detail} onClose={() => setDetail(null)} onDelete={async (id) => { 
        if (uid) {
          const cleanId = id.replace(/_(task|habit)$/, "");
          if (detail.type === "event") await deleteEvent(uid, cleanId);
          else if (detail.type === "task") await deleteTask(uid, cleanId);
          else if (detail.type === "habit") await deleteHabit(uid, cleanId);
        }
      }} />}</AnimatePresence>

      <AnimatePresence>
        {(() => {
          const showBtn = view === "month" ? !(year === now.getFullYear() && month === now.getMonth()) : !getWeekDays().includes(TODAY);
          return showBtn ? (
            <motion.button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(TODAY); }} className="fixed bottom-36 left-1/2 -translate-x-1/2 lg:bottom-20 z-40 px-5 py-2 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-secondary transition-colors" style={{ fontWeight: 700, fontSize: "0.8125rem", boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>Hôm nay</motion.button>
          ) : null;
        })()}
      </AnimatePresence>

      {!hideFab && (
        <button onClick={() => setFormOpen(true)} className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[45] w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
          <Plus size={20} />
        </button>
      )}

      <AnimatePresence>
        {formOpen && <EventForm defaultDate={selected}
          onSaveEvent={async (e) => { if (uid) await addEvent(uid, e as any); setFormOpen(false); }}
          onSaveTask={async (t) => { if (uid) await addTask(uid, t as any); setFormOpen(false); }}
          onSaveHabit={async (h) => { if (uid) await addHabit(uid, h as any); setFormOpen(false); }}
          onClose={() => setFormOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
