import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, X, Tag, Trash2, Pin, PinOff,
  FileText, Bold, Italic, List, Hash, ArrowLeft,
} from "lucide-react";

/* ── Types ── */
interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string; // ISO
  color: string;
}

/* ── Constants ── */
const NOTE_COLORS = [
  "var(--card)", "#FFF9E6", "#F0FDF4", "#EFF6FF", "#FDF4FF", "#FFF1F2",
];

const COLOR_LABEL: Record<string, string> = {
  "var(--card)": "Mặc định",
  "#FFF9E6": "Vàng",
  "#F0FDF4": "Xanh lá",
  "#EFF6FF": "Xanh dương",
  "#FDF4FF": "Tím",
  "#FFF1F2": "Hồng",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)    return "Vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const INITIAL_NOTES: Note[] = [
  {
    id: 1, title: "Ý tưởng cho dự án mới", pinned: true, color: "#FFF9E6",
    tags: ["ý tưởng", "công việc"],
    content: "## Ý tưởng chính\n\n- Xây dựng app quản lý tài chính cá nhân\n- Tích hợp AI để phân tích chi tiêu\n- Giao diện đơn giản, dễ dùng\n\n## Tính năng cần có\n\n1. Theo dõi thu chi hàng ngày\n2. Biểu đồ phân tích theo tháng\n3. Cảnh báo khi vượt ngân sách\n4. Xuất báo cáo PDF",
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 2, title: "Lịch học tiếng Anh", pinned: false, color: "#EFF6FF",
    tags: ["học tập", "tiếng anh"],
    content: "## Kế hoạch học\n\n**Tuần này:**\n- Grammar: Past perfect\n- Vocabulary: 20 từ mới/ngày\n- Listening: 1 podcast 30 phút\n\n**Tài liệu:**\n- English Grammar in Use\n- Podcast: 6 Minute English\n- App: Anki flashcards",
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 3, title: "Công thức nấu ăn", pinned: false, color: "#F0FDF4",
    tags: ["cá nhân", "nấu ăn"],
    content: "## Salad gà nướng\n\n**Nguyên liệu:**\n- 300g ức gà\n- Rau xà lách\n- Cà chua bi, dưa chuột\n- Sốt mù tạt mật ong\n\n**Cách làm:**\n1. Ướp gà với muối, tiêu, tỏi\n2. Nướng ở 180°C trong 25 phút\n3. Trộn rau với sốt\n4. Thái gà và cho lên trên",
    updatedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
  },
  {
    id: 4, title: "Meeting notes - Sprint 12", pinned: false, color: "var(--card)",
    tags: ["công việc", "meeting"],
    content: "## Sprint 12 Planning\n\n**Thời gian:** 9:00 - 10:30\n**Tham dự:** Anh, Bình, Chương, Dung\n\n**Đã thảo luận:**\n- Review sprint 11: hoàn thành 85% story points\n- Sprint 12 goal: launch tính năng payment\n- Blocker: API từ phía ngân hàng chưa sẵn sàng\n\n**Action items:**\n- [ ] Liên hệ lại ngân hàng (Bình)\n- [ ] Thiết kế mockup payment flow (Chương)\n- [ ] Viết test cases (Dung)",
    updatedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
  {
    id: 5, title: "Sách đang đọc: Atomic Habits", pinned: false, color: "#FDF4FF",
    tags: ["học tập", "sách"],
    content: "## Ghi chú chương 1-3\n\n**Key insight:**\n> Thay đổi nhỏ không tạo ra kết quả ngay lập tức — chúng tích lũy theo thời gian.\n\n**1% Better Every Day:**\n- 1.01^365 = 37.78 (tốt hơn 37 lần sau 1 năm)\n- 0.99^365 = 0.03 (kém đi gần hết)\n\n**4 bước tạo thói quen tốt:**\n1. Gợi ý rõ ràng (Cue)\n2. Hấp dẫn (Craving)\n3. Dễ thực hiện (Response)\n4. Thỏa mãn (Reward)",
    updatedAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
  },
];

/* ── Simple markdown renderer ── */
function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} className="text-foreground mt-4 mb-1.5 first:mt-0" style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{line.slice(3)}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-foreground" style={{ fontWeight: 700, fontSize: "0.9rem" }}>{line.slice(2, -2)}</p>;
      if (line.startsWith("> ")) return (
        <blockquote key={i} className="border-l-2 border-primary pl-3 my-2 text-muted-foreground italic" style={{ fontSize: "0.9rem" }}>
          {line.slice(2)}
        </blockquote>
      );
      if (line.match(/^- \[[ x]\]/)) {
        const done = line.startsWith("- [x]");
        return (
          <div key={i} className="flex items-center gap-2 my-0.5">
            <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 ${done ? "bg-primary border-primary" : "border-border"}`} />
            <span className={`${done ? "line-through text-muted-foreground" : "text-foreground"}`} style={{ fontSize: "0.9rem" }}>
              {line.slice(6)}
            </span>
          </div>
        );
      }
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-foreground list-disc" style={{ fontSize: "0.9rem" }}>{line.slice(2)}</li>;
      if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-foreground list-decimal" style={{ fontSize: "0.9rem" }}>{line.replace(/^\d+\.\s*/, "")}</li>;
      if (line === "") return <div key={i} className="h-2" />;
      // inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-foreground" style={{ fontSize: "0.9rem", lineHeight: 1.65 }}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    });
}

/* ── Editor toolbar button ── */
function ToolBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon size={15} />
    </button>
  );
}

/* ── Main page ── */
export function NotesPage({ onModal }: { onModal?: (open: boolean) => void }) {
  const [notes, setNotes]           = useState<Note[]>(INITIAL_NOTES);
  const [selected, setSelected]     = useState<Note | null>(notes[0]);
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState<string | null>(null);
  const [editing, setEditing]       = useState(false);
  const [editTitle, setEditTitle]   = useState("");
  const [editContent, setEditContent] = useState("");
  const [showMobile, setShowMobile] = useState(false); // mobile: show editor
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* All unique tags */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  /* Filtered notes */
  const filtered = useMemo(() => {
    let list = [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    if (search) list = list.filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    );
    if (activeTag) list = list.filter(n => n.tags.includes(activeTag));
    return list;
  }, [notes, search, activeTag]);

  function selectNote(n: Note) {
    if (editing) saveEdit();
    setSelected(n);
    setEditing(false);
    setShowMobile(true);
    onModal?.(true);
  }

  function startEdit() {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditContent(selected.content);
    setEditing(true);
    onModal?.(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function saveEdit() {
    if (!selected) return;
    const updated: Note = {
      ...selected,
      title: editTitle.trim() || "Ghi chú không tiêu đề",
      content: editContent,
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setSelected(updated);
    setEditing(false);
    onModal?.(false);
  }

  function addNote() {
    const n: Note = {
      id: Date.now(), title: "Ghi chú mới", content: "", tags: [],
      pinned: false, color: "var(--card)", updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [n, ...prev]);
    setSelected(n);
    setEditTitle(n.title);
    setEditContent("");
    setEditing(true);
    setShowMobile(true);
    onModal?.(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function deleteNote(id: number) {
    setNotes(prev => prev.filter(n => n.id !== id));
    const remaining = filtered.filter(n => n.id !== id);
    setSelected(remaining[0] ?? null);
    setEditing(false);
  }

  function togglePin(id: number) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    if (selected?.id === id) setSelected(s => s ? { ...s, pinned: !s.pinned } : s);
  }

  function changeColor(color: string) {
    if (!selected) return;
    setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, color } : n));
    setSelected(s => s ? { ...s, color } : s);
  }

  function insertMarkdown(wrap: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = editContent.slice(start, end);
    const newText = editContent.slice(0, start) + wrap + sel + wrap + editContent.slice(end);
    setEditContent(newText);
    setTimeout(() => {
      ta.selectionStart = start + wrap.length;
      ta.selectionEnd = end + wrap.length;
      ta.focus();
    }, 0);
  }

  function insertLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = editContent.slice(0, pos);
    const after = editContent.slice(pos);
    const newText = before + (before.endsWith("\n") || before === "" ? "" : "\n") + prefix + after;
    setEditContent(newText);
    setTimeout(() => { ta.focus(); }, 0);
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Sidebar list ── */}
      <div className={`flex flex-col w-full md:w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card overflow-hidden
        ${showMobile ? "hidden md:flex" : "flex"}`}>

        {/* Search + New */}
        <div className="p-3 space-y-2 border-b border-border">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
              <Search size={14} className="text-muted-foreground flex-shrink-0" />
              <input
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                style={{ fontSize: "0.875rem" }}
                placeholder="Tìm ghi chú..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-muted-foreground" /></button>}
            </div>
            <button
              onClick={addNote}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Tag filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-600 transition-all ${
                !activeTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
              style={{ fontWeight: 600 }}
            >
              Tất cả
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  activeTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
                style={{ fontSize: "0.75rem", fontWeight: 600 }}
              >
                <Hash size={10} />{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-6">
              <FileText size={28} className="text-muted-foreground" />
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Không tìm thấy ghi chú</p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filtered.map(note => (
                <li key={note.id}>
                  <button
                    onClick={() => selectNote(note)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                      selected?.id === note.id ? "bg-secondary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: note.color === "var(--card)" ? "var(--muted-foreground)" : note.color.replace(")", ", 0.8)").replace("rgb", "rgba") }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {note.pinned && <Pin size={10} className="text-primary flex-shrink-0" />}
                          <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {note.title}
                          </p>
                        </div>
                        <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.775rem" }}>
                          {note.content.replace(/[#*>\-\[\]]/g, "").slice(0, 60) || "Chưa có nội dung"}
                        </p>
                        <p className="text-muted-foreground/60 mt-1" style={{ fontSize: "0.7rem" }}>
                          {fmtDate(note.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Editor / Viewer ── */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-background
        ${showMobile ? "flex" : "hidden md:flex"}`}>

        {selected ? (
          <>
            {/* Toolbar */}
            <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-border bg-card">
              {/* Mobile back */}
              <button
                onClick={() => { setShowMobile(false); setEditing(false); onModal?.(false); }}
                className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground mr-1"
              >
                <ArrowLeft size={16} />
              </button>

              {editing ? (
                <>
                  <ToolBtn icon={Bold}   label="In đậm"       onClick={() => insertMarkdown("**")} />
                  <ToolBtn icon={Italic} label="In nghiêng"   onClick={() => insertMarkdown("*")} />
                  <ToolBtn icon={List}   label="Danh sách"    onClick={() => insertLine("- ")} />
                  <ToolBtn icon={Hash}   label="Tiêu đề"      onClick={() => insertLine("## ")} />
                  <div className="flex-1" />
                  <button
                    onClick={saveEdit}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-secondary transition-colors"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    Huỷ
                  </button>
                </>
              ) : (
                <>
                  {/* Color dots */}
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => changeColor(c)}
                      className={`w-4 h-4 rounded-full transition-all flex-shrink-0 ${selected.color === c ? "ring-2 ring-offset-1 ring-primary" : "opacity-60 hover:opacity-100"}`}
                      style={{ background: c === "var(--card)" ? "var(--muted-foreground)" : c }}
                    />
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={() => togglePin(selected.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {selected.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>
                  <button
                    onClick={() => deleteNote(selected.id)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={startEdit}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity ml-1"
                    style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                  >
                    Chỉnh sửa
                  </button>
                </>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-5 lg:p-8" style={{ background: selected.color }}>
              {editing ? (
                <div className="max-w-2xl mx-auto space-y-3">
                  <input
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Tiêu đề..."
                  />
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground resize-none"
                    style={{ fontSize: "0.9375rem", lineHeight: 1.7, minHeight: "400px" }}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    placeholder={"Bắt đầu viết...\n\n## Tiêu đề\n**in đậm** *in nghiêng*\n- danh sách"}
                  />
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-foreground mb-1" style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                        {selected.title}
                      </h1>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                          {fmtDate(selected.updatedAt)}
                        </span>
                        {selected.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                            <Tag size={9} />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selected.content
                    ? <div className="space-y-0.5">{renderMarkdown(selected.content)}</div>
                    : (
                      <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors"
                        style={{ fontSize: "0.9375rem" }}>
                        Nhấn để bắt đầu viết...
                      </button>
                    )
                  }
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground" style={{ fontWeight: 600 }}>Chọn một ghi chú để xem</p>
            <button onClick={addNote}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              <Plus size={16} /> Tạo ghi chú mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
