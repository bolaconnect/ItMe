import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, FormField, FormInput, FormSelect, FormActions } from "../Sheet";
import { CATEGORIES, PRIORITY_LABEL } from "./taskData";
import type { Task, Priority } from "./taskData";

interface TaskFormProps {
  open:     boolean;
  editing?: Task | null;
  onClose:  () => void;
  onSave:   (task: Partial<Task> & Omit<Task, "id" | "createdAt">) => void;
  onDelete?: (id: string) => void;
  tasks:    Task[];
  defaultDate?: string;
}

export function TaskForm({ open, editing, onClose, onSave, onDelete, tasks, defaultDate = "" }: TaskFormProps) {
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dueDate,  setDueDate]  = useState("");
  const [dueTime,  setDueTime]  = useState("");
  const [err,      setErr]      = useState("");

  useEffect(() => {
    if (open) {
      setTitle(editing?.title       ?? "");
      setDesc(editing?.description  ?? "");
      setPriority(editing?.priority ?? "medium");
      setCategory(editing?.category ?? CATEGORIES[0]);
      setDueDate(editing?.dueDate   ?? defaultDate);
      setDueTime(editing?.dueTime   ?? "");
      setErr("");
    }
  }, [open, editing, defaultDate]);

  useEffect(() => {
    setErr("");
  }, [title, dueDate, dueTime]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setErr("Nhập tên công việc"); return; }

    if (!editing && dueDate) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (dueDate < todayStr) {
        setErr("Không thể chọn ngày trong quá khứ");
        return;
      }
      if (dueDate === todayStr && dueTime) {
        const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (dueTime < currentHHmm) {
          setErr("Không thể chọn thời gian trong quá khứ");
          return;
        }
      }
    }

    onSave({
      id:          editing?.id, // Có thể undefined nếu thêm mới
      title:       title.trim(),
      description: desc.trim(),
      done:        editing?.done ?? false,
      priority,
      category,
      dueDate,
      dueTime,
    });
    onClose();
  }

  const priorities: Priority[] = ["high", "medium", "low"];

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Sửa công việc" : "Thêm công việc"}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <FormField label="Tên công việc">
          <FormInput
            placeholder="Bạn cần làm gì?"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErr(""); }}
            autoFocus
          />
          {err && <p className="text-xs text-destructive mt-1">{err}</p>}
        </FormField>

        {/* Description */}
        <FormField label="Ghi chú (tuỳ chọn)">
          <textarea
            placeholder="Thêm mô tả chi tiết..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="input-base resize-none"
          />
        </FormField>

        {/* Priority */}
        <FormField label="Mức độ ưu tiên">
          <div className="flex gap-2">
            {priorities.map((p) => (
              <button
                key={p} type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                  priority === p
                    ? p === "high"   ? "bg-red-50 border-red-300 text-red-600 font-medium"
                    : p === "medium" ? "bg-yellow-50 border-yellow-300 text-yellow-700 font-medium"
                    :                  "bg-green-50 border-green-300 text-green-600 font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </FormField>

        {/* Category */}
        <FormField label="Danh mục">
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </FormSelect>
        </FormField>

        {/* Due date + time */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ngày hết hạn">
            <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </FormField>
          <FormField label="Giờ">
            <FormInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </FormField>
        </div>

        {/* Delete */}
        {editing && onDelete && (
          <button
            type="button"
            onClick={() => { onDelete(editing.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 size={14} /> Xoá công việc
          </button>
        )}

        <FormActions onCancel={onClose} submitLabel={editing ? "Cập nhật" : "Thêm việc"} />
      </form>
    </Sheet>
  );
}
