import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Circle, Clock, Flag, Search, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TaskForm } from "./tasks/TaskForm";
import { PRIORITY_COLOR, PRIORITY_BG, groupTasks } from "./tasks/taskData";
import { useAppStore } from "../store/useAppStore";
import { auth } from "../../lib/firebase";
import { subscribeTasks, addTask, updateTask, deleteTask } from "../../lib/tasksService";
import type { Task, Filter, Priority } from "./tasks/taskData";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",      label: "Tất cả"    },
  { id: "today",    label: "Hôm nay"   },
  { id: "upcoming", label: "Sắp tới"   },
  { id: "overdue",  label: "Quá hạn"   },
  { id: "done",     label: "Đã xong"   },
];



const VN_DAYS   = ["CN","T2","T3","T4","T5","T6","T7"];
const VN_MONTHS = ["Th.1","Th.2","Th.3","Th.4","Th.5","Th.6","Th.7","Th.8","Th.9","Th.10","Th.11","Th.12"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function CalendarTaskView({ tasks, onAdd }: { tasks: Task[]; onAdd: (date: string) => void }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [sel, setSel]     = useState(toISO(now));
  const TODAY = toISO(now);

  function prev() { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function next() { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  function dayTasks(dateStr: string) {
    return tasks.filter(t => t.dueDate === dateStr);
  }

  const selTasks = dayTasks(sel);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini calendar header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
        <button onClick={prev} className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-foreground" style={{ fontWeight:700, fontSize:"0.875rem" }}>{VN_MONTHS[month]} {year}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="shrink-0 grid grid-cols-7 border-b border-border">
        {VN_DAYS.map(d => (
          <div key={d} className="py-1.5 text-center text-muted-foreground" style={{ fontSize:"0.7rem", fontWeight:600 }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="shrink-0 grid grid-cols-7 border-b border-border">
        {Array.from({length: firstDow}).map((_,i) => <div key={`e${i}`} className="h-10 border-r border-border" />)}
        {Array.from({length: daysInMonth}, (_,i) => {
          const day = i+1;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = dateStr === TODAY;
          const isSel   = dateStr === sel;
          const dt      = dayTasks(dateStr);
          const col     = (firstDow+i)%7;
          return (
            <button key={day} onClick={() => setSel(dateStr)}
              className={`h-10 flex flex-col items-center justify-center gap-0.5 border-r border-border transition-colors
                ${isSel ? "bg-primary/10" : isToday ? "bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <span className={`w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? "bg-primary text-primary-foreground" : col===0 ? "text-red-500" : "text-foreground"}`}
                style={{ fontSize:"0.8rem", fontWeight: isToday?700:400 }}>
                {day}
              </span>
              {dt.length > 0 && (
                <div className="flex gap-0.5">
                  {dt.slice(0,3).map(t => (
                    <div key={t.id} className="w-1 h-1 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-muted-foreground" style={{ fontSize:"0.8rem", fontWeight:600 }}>
          {new Date(sel).toLocaleDateString("vi-VN", { weekday:"long", day:"numeric", month:"long" })}
          {" · "}{selTasks.length} việc
        </p>
        {selTasks.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center">
            <p className="text-muted-foreground" style={{ fontSize:"0.875rem" }}>Không có việc nào</p>
            <button onClick={() => onAdd(sel)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
              style={{ fontWeight:600, fontSize:"0.8125rem" }}>
              <Plus size={14} /> Thêm việc
            </button>
          </div>
        ) : selTasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLOR[t.priority] }} />
            <div className="flex-1 min-w-0">
              <p className={`text-foreground truncate ${t.done ? "line-through text-muted-foreground" : ""}`}
                style={{ fontWeight:600, fontSize:"0.875rem" }}>{t.title}</p>
              {t.dueDate && <p className="text-muted-foreground" style={{ fontSize:"0.75rem" }}>{t.dueDate}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TasksPage({ onModal }: { onModal?: (open: boolean) => void }) {
  const { tasks, setTasks } = useAppStore();
  const [filter,      setFilter]      = useState<Filter>("all");
  const [search,      setSearch]      = useState("");
  const [formOpen,    setFormOpen]    = useState(false);
  const [editing,     setEditing]     = useState<Task | null>(null);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    const unsubscribe = subscribeTasks(uid, (data) => {
      setTasks(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [uid, setTasks]);

  function openModal()  { setFormOpen(true);  onModal?.(true);  }
  function closeModal() { setFormOpen(false); onModal?.(false); }

  /* derived stats */
  const total    = tasks.length;
  const done     = tasks.filter((t) => t.done).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue  = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < todayStr).length;
  const todayN   = tasks.filter((t) => !t.done && t.dueDate === todayStr).length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;

  /* filtered + searched groups */
  const groups = groupTasks(
    search
      ? tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()))
      : tasks,
    filter,
  );

  async function toggle(id: string) {
    if (!uid) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(uid, id, { done: !task.done });
  }

  async function handleSaveTask(task: Partial<Task> & Omit<Task, "id" | "createdAt">) {
    if (!uid) return;
    const { id, ...taskData } = task;
    if (id) {
      await updateTask(uid, id, taskData);
    } else {
      await addTask(uid, taskData as Omit<Task, "id" | "createdAt">);
    }
  }

  async function handleDelete(id: string) {
    if (!uid) return;
    await deleteTask(uid, id);
  }

  function openAdd()         { setEditing(null); openModal(); }
  function openEdit(t: Task) { setEditing(t);    openModal(); }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* ── Header stats ── */}
        <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3 space-y-4">

          {/* Progress card */}
          <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wide">Tiến độ hôm nay</p>
                <p className="text-primary-foreground font-bold mt-0.5" style={{ fontSize: "1.6rem" }}>
                  {done}/{total}
                </p>
              </div>
              <p className="text-primary-foreground/80 font-semibold" style={{ fontSize: "1.3rem" }}>{pct}%</p>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="flex gap-4 mt-3">
              <Chip label={`${todayN} hôm nay`}  color="bg-white/15 text-white" />
              {overdue > 0 && <Chip label={`${overdue} quá hạn`} color="bg-red-400/40 text-white" />}
              <Chip label={`${total - done} còn lại`} color="bg-white/15 text-white" />
            </div>
          </div>

          {/* Search + filter row */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              {searchOpen ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "100%" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 flex items-center gap-2 bg-input-background px-3 py-2.5 rounded-xl"
                >
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Tìm công việc..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={() => { setSearch(""); setSearchOpen(false); }}>
                    <X size={14} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex gap-1.5 overflow-x-auto">
                  {FILTERS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setFilter(id)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-sm transition-all ${
                        filter === id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }${id === "overdue" && overdue > 0 && filter !== id ? " ring-1 ring-red-300" : ""}`}
                    >
                      {label}
                      {id === "overdue" && overdue > 0 && (
                        <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{overdue}</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="shrink-0 w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>

          <div className="h-px bg-border" />
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">
                {filter === "done" ? "🎉" : "✅"}
              </div>
              <p className="text-foreground font-medium">
                {filter === "done" ? "Chưa hoàn thành việc nào" : "Không có công việc nào"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search ? "Thử tìm kiếm khác" : "Nhấn + để thêm việc mới"}
              </p>
            </div>
          ) : (

          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                {group.label && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {group.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => toggle(task.id)}
                        onEdit={() => openEdit(task)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-[72px] lg:bottom-6 lg:right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      <TaskForm
        open={formOpen}
        editing={editing}
        onClose={closeModal}
        onSave={handleSaveTask}
        onDelete={handleDelete}
        tasks={tasks}
        defaultDate={todayStr}
      />
    </>
  );
}

/* ── Task item ── */
function TaskItem({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit: () => void }) {
  const isOverdue = !task.done && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 hover:shadow-sm transition-shadow group"
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 mt-0.5 transition-transform active:scale-90"
      >
        {task.done
          ? <CheckCircle2 size={20} className="text-green-500" />
          : <Circle       size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className={`text-sm leading-snug ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>

        {task.description && !task.done && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Category */}
          <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {task.category}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              <Clock size={10} />
              {formatDue(task.dueDate, task.dueTime)}
              {isOverdue && " · Quá hạn"}
            </span>
          )}
        </div>
      </div>

      {/* Priority dot */}
      <span
        className="shrink-0 mt-1.5 w-2 h-2 rounded-full"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
        title={task.priority}
      />
    </motion.li>
  );
}

/* ── Helpers ── */
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function formatDue(date: string, time: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let label = date === todayStr ? "Hôm nay" : date === tomorrowStr ? "Ngày mai" : date;
  if (time) label += ` ${time}`;
  return label;
}
