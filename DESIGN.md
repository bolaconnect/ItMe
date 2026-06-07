# MyLife — Phong cách thiết kế (Design System)

> File này là tài liệu tham chiếu khi chỉnh sửa giao diện. Mọi thay đổi màu sắc, font, bo góc đều thực hiện trong `src/styles/theme.css`.

---

## 1. Màu sắc (Color Tokens)

Tất cả màu dùng CSS variable, không hardcode hex trực tiếp trong component.

### Bảng màu chính

| Token | Giá trị hiện tại | Dùng để |
|-------|-----------------|---------|
| `--primary` | `#5B4CF5` (tím xanh) | Nút chính, active state, icon highlight |
| `--primary-foreground` | `#FFFFFF` | Chữ trên nền primary |
| `--secondary` | `#EEF0FF` (tím nhạt) | Nền nút phụ, badge, tag |
| `--secondary-foreground` | `#3B30C4` | Chữ trên nền secondary |
| `--accent` | `#FF8A65` (cam) | Điểm nhấn, thông báo, streak |
| `--accent-foreground` | `#FFFFFF` | Chữ trên nền accent |
| `--destructive` | `#E53935` (đỏ) | Xoá, cảnh báo, lỗi |
| `--background` | `#F7F6F3` (kem xám) | Nền toàn trang |
| `--card` | `#FFFFFF` | Nền card, modal, sidebar |
| `--muted` | `#EBEBEE` (xám nhạt) | Nền input disabled, hover nhẹ |
| `--muted-foreground` | `#7A7890` | Chữ phụ, placeholder, label nhỏ |
| `--border` | `rgba(0,0,0,0.08)` | Đường viền card, divider |
| `--input-background` | `#F0EFF5` | Nền ô input |

### Màu cố định trong component (không dùng token)

Những màu này được hardcode cho các loại nội dung cụ thể:

```
Tasks priority:
  High    → #EF4444 (đỏ)
  Medium  → #F59E0B (vàng)
  Low     → #10B981 (xanh lá)

Event / Habit types:
  Event   → var(--primary)  #5B4CF5
  Task    → #10B981 (xanh lá)
  Habit   → #F59E0B (vàng)

Lunar calendar:
  Ngày rằm / mồng 1 → #EF4444 (đỏ) hoặc amber-600
  Ngày lễ đặc biệt  → amber-400/20 background

Goals categories:
  Sức khỏe  → #10B981
  Tài chính  → #F59E0B
  Học tập    → #3B82F6
  Sự nghiệp  → #8B5CF6
  Cá nhân    → #EC4899
```

### Cách đổi màu chủ đề

Mở `src/styles/theme.css`, thay giá trị trong `:root`:

```css
:root {
  --primary: #5B4CF5;    /* ← đổi màu này để thay màu chính toàn app */
  --secondary: #EEF0FF;  /* ← màu nền secondary tự động theo */
  --secondary-foreground: #3B30C4; /* ← chữ secondary */
  --accent: #FF8A65;     /* ← màu accent (cam) */
}
```

**Ví dụ theme xanh lá:**
```css
--primary: #059669;
--secondary: #ECFDF5;
--secondary-foreground: #065F46;
--accent: #F59E0B;
```

**Ví dụ theme hồng:**
```css
--primary: #DB2777;
--secondary: #FDF2F8;
--secondary-foreground: #9D174D;
--accent: #8B5CF6;
```

---

## 2. Typography (Chữ)

### Font chính

```
Font:    Plus Jakarta Sans
Source:  Google Fonts
Import:  src/styles/fonts.css
Weights: 300, 400, 500, 600, 700
```

### Cách đổi font

Mở `src/styles/fonts.css`:
```css
/* Thay URL Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=YOUR_FONT:wght@300;400;500;600;700&display=swap');
```

Sau đó mở `src/styles/theme.css`, đổi:
```css
--font-family: 'YOUR_FONT', sans-serif;
```

**Font gợi ý phù hợp:**
- `Inter` — hiện đại, dễ đọc (phổ biến nhất)
- `Be Vietnam Pro` — Vietnamese-friendly, tương tự hiện tại
- `Nunito` — tròn, thân thiện
- `DM Sans` — tối giản, thanh lịch
- `Geist` — kỹ thuật, sắc nét

### Scale chữ (dùng inline style thay vì Tailwind text-*)

> **Lưu ý:** Project này dùng `style={{ fontSize: "..." }}` thay vì `text-sm`, `text-lg` của Tailwind để tránh xung đột với `theme.css`. Khi chỉnh kích thước chữ, dùng giá trị `rem`:

```
0.65rem  = ~10px  → Label rất nhỏ (âm lịch, badge nhỏ)
0.72rem  = ~11.5px → Caption, meta info
0.775rem = ~12.5px → Text phụ nhỏ
0.8rem   = ~13px  → Description, sub-label
0.8125rem= ~13px  → Label form
0.875rem = ~14px  → Body text thông thường
0.9375rem= ~15px  → Body text lớn hơn, title card nhỏ
1rem     = ~16px  → Base size
1.0625rem= ~17px  → Title section
1.125rem = ~18px  → Title trang
1.25rem  = ~20px  → Heading lớn
1.6rem   = ~26px  → Số liệu nổi bật (progress %)
```

---

## 3. Bo góc (Border Radius)

```css
--radius: 0.875rem  /* ≈ 14px — base radius */

Tính toán từ base:
  --radius-sm: calc(var(--radius) - 4px)  = ~10px
  --radius-md: calc(var(--radius) - 2px)  = ~12px
  --radius-lg: var(--radius)               = ~14px
  --radius-xl: calc(var(--radius) + 4px)  = ~18px
```

### Tailwind classes tương ứng đang dùng

```
rounded-lg   → card nhỏ, button phụ
rounded-xl   → card tiêu chuẩn, input, FAB button
rounded-2xl  → card lớn, modal, bottom nav center
rounded-full → avatar, badge tròn, pill button, toggle
```

**Đổi bo góc toàn app:** thay `--radius` trong `theme.css`.
- Tăng (ví dụ `1.25rem`) → mềm mại, tròn hơn
- Giảm (ví dụ `0.5rem`) → vuông vắn, cứng cáp hơn

---

## 4. Spacing (Khoảng cách)

Project dùng Tailwind spacing scale (bội số 4px):

```
p-1  = 4px     gap-1  = 4px
p-2  = 8px     gap-2  = 8px
p-3  = 12px    gap-3  = 12px
p-4  = 16px    gap-4  = 16px
p-5  = 20px    gap-5  = 20px
p-6  = 24px    gap-6  = 24px
```

### Pattern spacing thường dùng

```
Card padding:          p-4 hoặc p-5
Card inner gap:        space-y-3 hoặc space-y-4
Section gap:           space-y-5
Header padding:        px-4 lg:px-6, py-3.5
List item padding:     px-4 py-3 hoặc px-4 py-3.5
Icon trong container:  w-9 h-9 (36px) hoặc w-10 h-10 (40px)
FAB button:            w-12 h-12 (48px)
```

---

## 5. Shadows (Đổ bóng)

```
shadow-sm  → Card hover nhẹ
shadow-md  → FAB button, toggle nút lịch
shadow-lg  → Modal, floating buttons
shadow-xl  → Bottom nav center, dropdown

Custom shadows (inline):
  FAB primary: 0 4px 20px rgba(91,76,245,0.4)   ← tím mờ
  Float pill:  0 4px 16px rgba(0,0,0,0.14)       ← đen mờ nhẹ
  Bottom nav:  0 -2px 16px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.1)
```

---

## 6. Component Patterns (Mẫu thiết kế lặp lại)

### Card tiêu chuẩn
```tsx
<div className="bg-card rounded-2xl border border-border p-4">
  {/* content */}
</div>
```

### Card có header + divider
```tsx
<div className="bg-card rounded-2xl border border-border overflow-hidden">
  <div className="px-4 py-3 border-b border-border">
    <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Tiêu đề</p>
  </div>
  <div className="p-4">
    {/* content */}
  </div>
</div>
```

### Badge / Tag
```tsx
{/* Primary badge */}
<span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground"
  style={{ fontSize: "0.72rem", fontWeight: 700 }}>
  Label
</span>

{/* Muted badge */}
<span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
  style={{ fontSize: "0.72rem", fontWeight: 600 }}>
  Label
</span>
```

### Icon container (icon trong hộp màu)
```tsx
<div className="w-9 h-9 rounded-xl flex items-center justify-center"
  style={{ background: "#ECFDF5" }}>
  <IconComponent size={16} style={{ color: "#10B981" }} />
</div>
```

### Button chính
```tsx
<button className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
  style={{ fontWeight: 600, fontSize: "0.875rem" }}>
  Nút chính
</button>
```

### Button phụ
```tsx
<button className="px-4 py-2.5 rounded-xl bg-muted text-foreground hover:bg-secondary transition-colors"
  style={{ fontWeight: 600, fontSize: "0.875rem" }}>
  Nút phụ
</button>
```

### Button nguy hiểm
```tsx
<button className="px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
  style={{ fontWeight: 600, fontSize: "0.875rem" }}>
  Xoá
</button>
```

### Input tiêu chuẩn (dùng class `.input-base`)
```tsx
<input className="input-base" placeholder="Nhập..." />
/* .input-base định nghĩa trong theme.css:
   bg-input-background, border transparent → focus: border primary + ring */
```

### FAB (Floating Action Button)
```tsx
<button
  className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-40
             w-12 h-12 rounded-xl bg-primary text-primary-foreground
             shadow-md flex items-center justify-center
             hover:opacity-90 active:scale-95 transition-all"
>
  <Plus size={20} />
</button>
```

### Modal / Sheet
```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
  
  {/* Panel */}
  <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
      <h3 style={{ fontWeight: 700 }}>Tiêu đề modal</h3>
      <button onClick={onClose}><X size={16} /></button>
    </div>
    
    {/* Content */}
    <div className="p-5 space-y-4">
      {/* ... */}
    </div>
    
    {/* Footer */}
    <div className="flex gap-2 px-5 pb-5">
      <button className="flex-1 py-2.5 rounded-xl bg-muted ...">Huỷ</button>
      <button className="flex-1 py-2.5 rounded-xl bg-primary ...">Lưu</button>
    </div>
  </div>
</div>
```

### Empty state
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">
    🎯
  </div>
  <p className="text-foreground" style={{ fontWeight: 600 }}>Tiêu đề trống</p>
  <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
    Mô tả hành động cần làm
  </p>
  <button className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
    style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
    <Plus size={14} /> Thêm mới
  </button>
</div>
```

### Progress bar
```tsx
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary rounded-full transition-all duration-500"
    style={{ width: `${percent}%` }}
  />
</div>
```

---

## 7. Animation (Motion)

Project dùng `motion/react` (Framer Motion v11).

### Fade + slide up (modal mở)
```tsx
initial={{ opacity: 0, y: 24, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 16, scale: 0.97 }}
transition={{ type: "spring", stiffness: 380, damping: 30 }}
```

### Fade đơn giản
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}
```

### Scale pop (button, badge xuất hiện)
```tsx
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.8 }}
transition={{ duration: 0.15 }}
```

### Slide từ phải (panel chi tiết)
```tsx
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 20 }}
transition={{ duration: 0.2 }}
```

### Page transition (giữa Auth ↔ App)
```tsx
exit={{ opacity: 0, scale: 0.98 }}
initial={{ opacity: 0, scale: 1.01 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.3 }}
```

---

## 8. Responsive design

### Breakpoints Tailwind

```
sm:  640px   → tablet nhỏ
md:  768px   → tablet
lg:  1024px  → desktop → Sidebar xuất hiện, BottomNav ẩn
xl:  1280px  → desktop rộng
```

### Pattern mobile-first thường gặp

```tsx
{/* Sidebar chỉ desktop */}
<aside className="hidden lg:flex ...">

{/* BottomNav chỉ mobile */}
<nav className="lg:hidden ...">

{/* FAB vị trí */}
className="bottom-20 right-5 lg:bottom-6 lg:right-6"
//          ↑ trên BottomNav    ↑ không có nav bar

{/* Padding trang */}
className="px-4 lg:px-6"

{/* Modal hiện ở bottom mobile, center desktop */}
className="items-end sm:items-center"
```

---

## 9. Z-index layers

```
z-10   → Overlay nhẹ
z-20   → Panel phụ
z-30   → Calendar overlay (đè lên trang)
z-40   → FAB, toggle buttons, BottomNav
z-50   → Nút "Quay lại" calendar, modal backdrop
z-[60] → Modal dialogs (EventForm, DayModal, form modal)
```

> **Quy tắc:** Modal mới thêm vào dùng `z-[60]`. Nếu cần modal trên modal, dùng `z-[70]`.

---

## 10. Màu sắc semantic cho nội dung

Dùng nhất quán trong toàn app:

```
✅ Hoàn thành / Tích cực:  #10B981 (xanh lá emerald)
⏰ Cảnh báo / Deadline:    #F59E0B (vàng amber)  
❌ Lỗi / Xoá / Overdue:   #EF4444 (đỏ)
📅 Sự kiện / Lịch:         var(--primary) #5B4CF5
💜 Mục tiêu đặc biệt:      #8B5CF6 (tím nhạt)
💗 Sự kiện cá nhân:        #EC4899 (hồng)
💙 Ngày thứ 7:             #3B82F6 (xanh dương)
❤️ Chủ nhật:               #EF4444 (đỏ)
🌕 Ngày rằm âm lịch:       #D97706 (amber-600)
🌑 Mồng 1 âm lịch:         #EF4444 (đỏ)
🎊 Ngày lễ âm lịch:        #D97706 background amber-100
```

---

## 11. Dark mode

Dark mode hiện chỉ là UI toggle trong ProfilePage (chưa áp dụng thực sự vào app).

### Cách implement dark mode thật

```typescript
// Trong ProfilePage, thay Toggle onChange:
onChange={(v) => {
  setDarkMode(v);
  document.documentElement.classList.toggle("dark", v);
  localStorage.setItem("darkMode", String(v));
}}

// Trong App.tsx, khôi phục khi load:
useEffect(() => {
  const saved = localStorage.getItem("darkMode") === "true";
  document.documentElement.classList.toggle("dark", saved);
}, []);
```

Dark mode variables đã định nghĩa sẵn trong `theme.css` trong block `.dark { }`.

---

## 12. Ví dụ thay đổi nhanh

### Đổi màu chủ đề toàn app → `src/styles/theme.css`
```css
--primary: #YOUR_COLOR;
--secondary: #LIGHT_VERSION;
--secondary-foreground: #DARK_VERSION;
```

### Đổi font → `src/styles/fonts.css` + `theme.css`
```css
/* fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* theme.css */
--font-family: 'Inter', sans-serif;
```

### Làm card vuông hơn → `src/styles/theme.css`
```css
--radius: 0.5rem;  /* giảm từ 0.875rem */
```

### Làm background tối hơn → `src/styles/theme.css`
```css
--background: #EFEFED;  /* tối hơn #F7F6F3 hiện tại */
```

### Đổi màu border rõ hơn → `src/styles/theme.css`
```css
--border: rgba(0, 0, 0, 0.15);  /* đậm hơn 0.08 hiện tại */
```
