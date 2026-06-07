import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, X, KeyRound, Copy, Eye, EyeOff, Pin, PinOff,
  Pencil, Trash2, Shield, ShieldAlert, ExternalLink,
  Globe, Sparkles, Check, Loader2,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import {
  subscribeCredentials, addCredential, updateCredential,
  deleteCredential, togglePinCredential,
  type Credential,
} from "../../lib/passwordsService";

type Category = "social" | "bank" | "work" | "shopping" | "entertainment";

const CATEGORY_LABEL: Record<Category | "all", string> = {
  all: "Tất cả",
  social: "Mạng xã hội",
  bank: "Ngân hàng",
  work: "Công việc",
  shopping: "Mua sắm",
  entertainment: "Giải trí",
};

const CATEGORY_COLOR: Record<Category, string> = {
  social: "#3B82F6",
  bank: "#10B981",
  work: "#8B5CF6",
  shopping: "#F59E0B",
  entertainment: "#EC4899",
};

const FILTERS: (Category | "all")[] = ["all", "social", "bank", "work", "shopping", "entertainment"];

function strengthLabel(s: Credential["strength"]) {
  if (s === "weak") return { text: "Yếu", color: "#EF4444", bg: "#FEF2F2" };
  if (s === "medium") return { text: "Trung bình", color: "#F59E0B", bg: "#FFFBEB" };
  return { text: "Mạnh", color: "#10B981", bg: "#ECFDF5" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function generatePassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/* ── Copy toast helper ── */
function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      title={`Sao chép ${label}`}
      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

/* ── Add / Edit form ── */
function CredentialForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Partial<Credential> | null;
  onSave: (c: Omit<Credential, "id" | "updatedAt"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "social");
  const [note, setNote] = useState(initial?.note ?? "");
  const [showPw, setShowPw] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      username: username.trim(),
      password: password || generatePassword(),
      url: url.trim() || undefined,
      category,
      note: note.trim() || undefined,
      pinned: initial?.pinned ?? false,
      strength: password.length >= 12 ? "strong" : password.length >= 8 ? "medium" : "weak",
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h3 className="text-foreground" style={{ fontWeight: 700 }}>
            {initial?.id ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tên dịch vụ</label>
            <input className="input-base" placeholder="VD: Gmail, Facebook..." value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>URL website</label>
            <input className="input-base" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} type="url" />
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tên đăng nhập / Email</label>
            <input className="input-base" placeholder="username hoặc email" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Mật khẩu</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="input-base pr-10"
                  type={showPw ? "text" : "password"}
                  placeholder="Nhập hoặc tạo mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="shrink-0 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              >
                <Sparkles size={14} /> Tạo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-2" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Danh mục</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_LABEL).filter(k => k !== "all") as Category[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${category === cat ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    background: category === cat ? CATEGORY_COLOR[cat] : undefined,
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-foreground mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Ghi chú <span className="text-muted-foreground font-normal">(tuỳ chọn)</span></label>
            <textarea className="input-base resize-none h-20" placeholder="Ghi chú thêm..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity" style={{ fontWeight: 600 }}>
            {initial?.id ? "Lưu thay đổi" : "Thêm tài khoản"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Detail sheet ── */
function DetailSheet({
  cred,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  cred: Credential;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const str = strengthLabel(cred.strength);
  const catColor = CATEGORY_COLOR[cred.category];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: catColor, fontSize: "1.125rem" }}
              >
                {cred.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{cred.name}</h3>
                <span
                  className="inline-block mt-0.5 px-2 py-0.5 rounded-lg"
                  style={{ fontSize: "0.72rem", fontWeight: 600, background: `${catColor}18`, color: catColor }}
                >
                  {CATEGORY_LABEL[cred.category]}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground mb-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>TÊN ĐĂNG NHẬP</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground truncate" style={{ fontSize: "0.9375rem" }}>{cred.username}</p>
                <CopyBtn text={cred.username} label="username" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground mb-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>MẬT KHẨU</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-mono truncate" style={{ fontSize: "0.9375rem" }}>
                  {showPw ? cred.password : "••••••••••••"}
                </p>
                <div className="flex items-center shrink-0">
                  <button onClick={() => setShowPw(v => !v)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <CopyBtn text={cred.password} label="password" />
                </div>
              </div>
            </div>

            {cred.url && (
              <a
                href={cred.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Globe size={15} className="text-primary shrink-0" />
                <span className="text-primary truncate flex-1" style={{ fontSize: "0.875rem" }}>{cred.url}</span>
                <ExternalLink size={14} className="text-muted-foreground shrink-0" />
              </a>
            )}

            {cred.note && (
              <div className="p-3 rounded-xl border border-border">
                <p className="text-muted-foreground mb-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>GHI CHÚ</p>
                <p className="text-foreground" style={{ fontSize: "0.875rem" }}>{cred.note}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ fontSize: "0.75rem", fontWeight: 600, background: str.bg, color: str.color }}
              >
                {cred.strength === "weak" ? <ShieldAlert size={12} /> : <Shield size={12} />}
                {str.text}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                Cập nhật {fmtDate(cred.updatedAt)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={onTogglePin}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              {cred.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              {cred.pinned ? "Bỏ ghim" : "Ghim"}
            </button>
            <button
              onClick={onEdit}
              className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              <Pencil size={15} /> Sửa
            </button>
            <button
              onClick={onDelete}
              className="py-2.5 px-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Credential card ── */
function CredentialCard({
  cred,
  onOpen,
  onTogglePin,
}: {
  cred: Credential;
  onOpen: () => void;
  onTogglePin: () => void;
}) {
  const catColor = CATEGORY_COLOR[cred.category];
  const str = strengthLabel(cred.strength);

  return (
    <motion.button
      layout
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left group"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-semibold"
        style={{ background: catColor, fontSize: "0.9375rem" }}
      >
        {cred.name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {cred.pinned && <Pin size={11} className="text-primary shrink-0" fill="currentColor" />}
          <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{cred.name}</p>
          {cred.strength === "weak" && (
            <ShieldAlert size={12} className="text-red-400 shrink-0" />
          )}
        </div>
        <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.8125rem" }}>{cred.username}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onTogglePin(); }}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
        >
          {cred.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <CopyBtn text={cred.password} label="password" />
      </div>

      <span
        className="hidden sm:inline-block px-2 py-0.5 rounded-lg shrink-0"
        style={{ fontSize: "0.65rem", fontWeight: 600, background: str.bg, color: str.color }}
      >
        {str.text}
      </span>
    </motion.button>
  );
}

/* ── Main page ── */
export function PasswordsPage({ onModal }: { onModal?: (open: boolean) => void }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [detail, setDetail] = useState<Credential | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeCredentials(uid, (items) => {
      setCredentials(items);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const stats = useMemo(() => {
    const total = credentials.length;
    const weak = credentials.filter(c => c.strength === "weak").length;
    const pinned = credentials.filter(c => c.pinned).length;
    return { total, weak, pinned };
  }, [credentials]);

  const filtered = useMemo(() => {
    let list = [...credentials].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.name.localeCompare(b.name, "vi");
    });
    if (filter !== "all") list = list.filter(c => c.category === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.note?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [credentials, filter, search]);

  const grouped = useMemo(() => {
    if (filter !== "all") return [{ label: "", items: filtered }];
    const pinned = filtered.filter(c => c.pinned);
    const rest = filtered.filter(c => !c.pinned);
    const groups: { label: string; items: Credential[] }[] = [];
    if (pinned.length) groups.push({ label: "Đã ghim", items: pinned });
    if (rest.length) groups.push({ label: pinned.length ? "Khác" : "", items: rest });
    return groups;
  }, [filtered, filter]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
    onModal?.(true);
  }

  function openEdit(c: Credential) {
    setDetail(null);
    setEditing(c);
    setFormOpen(true);
    onModal?.(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    onModal?.(false);
  }

  async function handleSave(data: Omit<Credential, "id" | "updatedAt"> & { id?: string }) {
    if (!uid) return;
    const today = new Date().toISOString().slice(0, 10);
    if (data.id) {
      await updateCredential(uid, data.id, { ...data, updatedAt: today });
    } else {
      await addCredential(uid, { ...data, updatedAt: today });
    }
    closeForm();
  }

  async function handleDelete(id: string) {
    if (!uid) return;
    if (!confirm("Xóa tài khoản này?")) return;
    await deleteCredential(uid, id);
    setDetail(null);
    onModal?.(false);
  }

  async function togglePin(id: string) {
    if (!uid) return;
    const cred = credentials.find(c => c.id === id);
    if (!cred) return;
    await togglePinCredential(uid, id, !cred.pinned);
    if (detail?.id === id) setDetail(d => d ? { ...d, pinned: !d.pinned } : d);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="text-muted-foreground text-sm">Đang tải mật khẩu...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Stats */}
        <div className="shrink-0 px-4 lg:px-6 pt-4 pb-3 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-card border border-border rounded-2xl p-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <KeyRound size={16} className="text-primary" />
              </div>
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{stats.total}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.72rem" }}>Tài khoản</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: "#FEF2F2" }}>
                <ShieldAlert size={16} style={{ color: "#EF4444" }} />
              </div>
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{stats.weak}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.72rem" }}>Mật khẩu yếu</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3.5">
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center mb-2">
                <Pin size={16} className="text-secondary-foreground" />
              </div>
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{stats.pinned}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.72rem" }}>Đã ghim</p>
            </div>
          </div>

          {/* Search + filters */}
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
                    placeholder="Tìm tài khoản..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={() => { setSearch(""); setSearchOpen(false); }}>
                    <X size={14} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex gap-1.5 overflow-x-auto pb-0.5">
                  {FILTERS.map(id => (
                    <button
                      key={id}
                      onClick={() => setFilter(id)}
                      className={`shrink-0 px-3 py-2 rounded-xl transition-all ${
                        filter === id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontSize: "0.8125rem" }}
                    >
                      {CATEGORY_LABEL[id]}
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

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <KeyRound size={24} className="text-muted-foreground opacity-50" />
              </div>
              <p className="text-foreground font-medium">Không tìm thấy tài khoản</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Thử tìm kiếm khác" : "Nhấn + để thêm tài khoản mới"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(group => (
                <div key={group.label || "all"}>
                  {group.label && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-2">
                    {group.items.map(cred => (
                      <CredentialCard
                        key={cred.id}
                        cred={cred}
                        onOpen={() => { setDetail(cred); onModal?.(true); }}
                        onTogglePin={() => togglePin(cred.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-40 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {formOpen && (
          <CredentialForm
            initial={editing}
            onSave={handleSave}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detail && (
          <DetailSheet
            cred={detail}
            onClose={() => { setDetail(null); onModal?.(false); }}
            onEdit={() => openEdit(detail)}
            onDelete={() => handleDelete(detail.id)}
            onTogglePin={() => togglePin(detail.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
