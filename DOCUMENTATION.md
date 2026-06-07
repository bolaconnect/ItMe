# MyLife — Tài liệu kỹ thuật & Kiến trúc

> Tài liệu này mô tả toàn bộ logic, kiến trúc, cấu trúc dữ liệu và hướng dẫn kết nối backend cho ứng dụng MyLife.

---

## 1. Tổng quan ứng dụng

**MyLife** là ứng dụng quản lý cuộc sống cá nhân toàn diện, bao gồm:

| Module | Chức năng |
|--------|-----------|
| Tổng quan (Dashboard) | Xem nhanh tất cả dữ liệu trong ngày |
| Công việc (Tasks) | Quản lý task theo độ ưu tiên, deadline, danh mục |
| Mục tiêu (Goals) | Đặt và theo dõi tiến độ mục tiêu dài hạn |
| Thói quen (Habits) | Xây dựng và duy trì thói quen hàng ngày |
| Tài chính (Finance) | Theo dõi thu chi, tài sản, đầu tư |
| Ghi chú (Notes) | Ghi chú có tag, màu sắc, ghim |
| Lịch (Calendar) | Xem và tạo sự kiện theo tháng/tuần, có âm lịch |
| Bản thân (Profile) | Hồ sơ cá nhân, cài đặt thông báo, appearance |

---

## 2. Stack công nghệ

```
Frontend:
  - React 18 + TypeScript
  - Tailwind CSS v4
  - Motion (Framer Motion v11) — animation
  - Lucide React — icons
  - Vite — build tool

Chưa có (cần thêm khi kết nối backend):
  - React Query / SWR — data fetching & caching
  - Axios / Fetch API — HTTP client
  - Zustand hoặc Redux Toolkit — global state
  - React Router v6 — URL routing (hiện dùng state-based routing)
```

---

## 3. Cấu trúc thư mục

```
src/
├── app/
│   ├── App.tsx                    # Root: AuthPage ↔ MainApp
│   ├── components/
│   │   ├── MainApp.tsx            # Layout chính, state routing
│   │   ├── AuthPage.tsx           # Màn hình đăng nhập
│   │   ├── TopBar.tsx             # Header mobile (search, notif, avatar)
│   │   ├── BottomNav.tsx          # Nav bar mobile
│   │   ├── Sidebar.tsx            # Sidebar desktop
│   │   ├── Dashboard.tsx          # Trang tổng quan
│   │   ├── TasksPage.tsx          # Quản lý công việc
│   │   ├── GoalsPage.tsx          # Quản lý mục tiêu
│   │   ├── HabitsPage.tsx         # Quản lý thói quen
│   │   ├── FinancePage.tsx        # Tài chính
│   │   ├── NotesPage.tsx          # Ghi chú
│   │   ├── CalendarPage.tsx       # Lịch
│   │   ├── ProfilePage.tsx        # Hồ sơ & cài đặt
│   │   ├── LunarCountdown.tsx     # Strip đếm ngược lễ âm lịch
│   │   ├── Sheet.tsx              # Form sheet component tái sử dụng
│   │   ├── TabScroller.tsx        # Tab scroll ngang
│   │   ├── tasks/
│   │   │   ├── taskData.ts        # Mock data + helper functions
│   │   │   └── TaskForm.tsx       # Form thêm/sửa task
│   │   ├── finance/
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── CashflowTab.tsx
│   │   │   ├── AssetsTab.tsx
│   │   │   ├── InvestTab.tsx
│   │   │   ├── GoalsTab.tsx
│   │   │   └── FinanceForms.tsx
│   │   └── figma/
│   │       └── ImageWithFallback.tsx
│   ├── utils/
│   │   └── lunarCalendar.ts       # Chuyển đổi âm/dương lịch
│   └── styles/
│       ├── theme.css              # CSS variables (colors, spacing)
│       └── fonts.css              # Font imports
```

---

## 4. Logic routing (điều hướng)

Ứng dụng hiện dùng **state-based routing** (không có URL), thông qua `MainApp.tsx`:

```typescript
type Page = "dashboard" | "tasks" | "goals" | "habits" | 
            "finance" | "notes" | "calendar" | "profile";

const [page, setPage] = useState<Page>("dashboard");
```

### Khi kết nối backend → chuyển sang React Router:

```typescript
// Cài: pnpm add react-router-dom
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// Routes cần tạo:
// /              → Dashboard
// /tasks         → TasksPage
// /goals         → GoalsPage
// /habits        → HabitsPage
// /finance       → FinancePage
// /notes         → NotesPage
// /calendar      → CalendarPage
// /profile       → ProfilePage
// /auth/login    → AuthPage
// /auth/register → RegisterPage
```

---

## 5. Data Models (Kiểu dữ liệu)

### 5.1 Task (Công việc)
```typescript
interface Task {
  id: number;           // → UUID khi dùng backend
  title: string;
  description: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  category: string;     // "Công việc" | "Cá nhân" | "Sức khỏe" | ...
  dueDate?: string;     // "YYYY-MM-DD"
  dueTime?: string;     // "HH:MM"
}
```

### 5.2 Goal (Mục tiêu)
```typescript
interface Goal {
  id: number;
  title: string;
  description: string;
  category: Category;   // "Sức khỏe" | "Tài chính" | "Học tập" | ...
  target: number;       // Giá trị đích
  current: number;      // Giá trị hiện tại
  unit: string;         // "km" | "%" | "triệu" | ...
  deadline?: string;    // "YYYY-MM-DD"
  status: "active" | "done" | "paused";
  color: string;        // Hex hoặc CSS variable
}
```

### 5.3 Habit (Thói quen)
```typescript
interface Habit {
  id: number;
  name: string;
  icon: string;           // Tên icon Lucide
  color: string;          // Hex color
  frequency: "daily" | "weekly";
  targetDays: number;     // Số ngày/tuần cần hoàn thành
  completedDates: string[]; // ["YYYY-MM-DD", ...]
  streak: number;         // Tính toán từ completedDates
  createdAt: string;      // ISO timestamp
}
```

### 5.4 CalEvent (Sự kiện lịch)
```typescript
type EventType = "event" | "task" | "habit";

interface CalEvent {
  id: number;
  title: string;
  date: string;         // "YYYY-MM-DD"
  time?: string;        // "HH:MM"
  endTime?: string;     // "HH:MM"
  type: EventType;
  color: string;
  location?: string;
  note?: string;
}
```

### 5.5 Note (Ghi chú)
```typescript
interface Note {
  id: number;
  title: string;
  content: string;      // Markdown text
  tags: string[];
  pinned: boolean;
  updatedAt: string;    // ISO timestamp
  color: string;        // Background color hex
}
```

### 5.6 Finance
```typescript
interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;       // VND
  category: string;
  note?: string;
  date: string;         // "YYYY-MM-DD"
}

interface Asset {
  id: number;
  name: string;
  type: "cash" | "savings" | "investment" | "real_estate" | "other";
  value: number;        // VND
  updatedAt: string;
}

interface FinanceGoal {
  id: number;
  title: string;
  target: number;       // VND
  current: number;      // VND
  deadline: string;
  icon: string;
}
```

### 5.7 User Profile
```typescript
interface UserProfile {
  id: string;           // UUID
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  settings: {
    notifications: {
      daily: boolean;
      habits: boolean;
      tasks: boolean;
      goals: boolean;
    };
    darkMode: boolean;
    language: "vi" | "en";
  };
}
```

---

## 6. API Endpoints cần thiết (REST)

### Authentication
```
POST   /auth/register          Body: { name, email, password }
POST   /auth/login             Body: { email, password } → { token, user }
POST   /auth/logout
POST   /auth/refresh-token
GET    /auth/me                → UserProfile
```

### Tasks
```
GET    /tasks                  Query: { filter, search, page }
POST   /tasks                  Body: Task (không có id)
PUT    /tasks/:id              Body: Partial<Task>
DELETE /tasks/:id
PATCH  /tasks/:id/toggle       → { done: boolean }
```

### Goals
```
GET    /goals                  Query: { status, category }
POST   /goals
PUT    /goals/:id
DELETE /goals/:id
PATCH  /goals/:id/progress     Body: { current: number }
```

### Habits
```
GET    /habits
POST   /habits
PUT    /habits/:id
DELETE /habits/:id
POST   /habits/:id/complete    Body: { date: "YYYY-MM-DD" }
DELETE /habits/:id/complete    Query: { date: "YYYY-MM-DD" }
GET    /habits/stats           → streak, completion rate, ...
```

### Calendar Events
```
GET    /events                 Query: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
POST   /events
PUT    /events/:id
DELETE /events/:id
```

### Notes
```
GET    /notes                  Query: { search, tag, page }
POST   /notes
PUT    /notes/:id
DELETE /notes/:id
PATCH  /notes/:id/pin          Body: { pinned: boolean }
```

### Finance
```
GET    /finance/transactions   Query: { type, from, to, category }
POST   /finance/transactions
PUT    /finance/transactions/:id
DELETE /finance/transactions/:id

GET    /finance/assets
POST   /finance/assets
PUT    /finance/assets/:id
DELETE /finance/assets/:id

GET    /finance/goals
POST   /finance/goals
PUT    /finance/goals/:id
DELETE /finance/goals/:id

GET    /finance/summary        → { totalIncome, totalExpense, netWorth, ... }
```

### Profile
```
GET    /profile
PUT    /profile                Body: Partial<UserProfile>
PUT    /profile/password       Body: { oldPassword, newPassword }
POST   /profile/avatar         Body: FormData (multipart)
DELETE /profile                (xoá tài khoản)
GET    /profile/export         → tất cả dữ liệu user (JSON)
```

---

## 7. Kết nối Firebase / Supabase / Backend tùy chỉnh

### 7.1 Cấu trúc service layer (khuyến nghị)

Tạo thư mục `src/services/` với các file:

```typescript
// src/services/api.ts — base client
const BASE_URL = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT",  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

```typescript
// src/services/tasks.ts
import { api } from "./api";
import type { Task } from "../app/components/tasks/taskData";

export const tasksService = {
  getAll:  (params?: { filter?: string; search?: string }) =>
    api.get<Task[]>(`/tasks?${new URLSearchParams(params as Record<string, string>)}`),
  create:  (task: Omit<Task, "id">) => api.post<Task>("/tasks", task),
  update:  (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  remove:  (id: number) => api.delete(`/tasks/${id}`),
  toggle:  (id: number) => api.patch<Task>(`/tasks/${id}/toggle`, {}),
};

// Tương tự cho: goalsService, habitsService, eventsService, notesService, financeService
```

### 7.2 Environment variables cần thiết

Tạo file `.env.local` tại root:

```env
VITE_API_URL=https://your-backend.com/api/v1
VITE_SUPABASE_URL=https://xxx.supabase.co          # nếu dùng Supabase
VITE_SUPABASE_ANON_KEY=your-anon-key               # nếu dùng Supabase
VITE_FIREBASE_API_KEY=your-key                      # nếu dùng Firebase
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 7.3 Thay mock data → API calls

Ví dụ với TasksPage (pattern áp dụng cho tất cả):

```typescript
// TRƯỚC (mock data):
const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

// SAU (với React Query):
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";

const queryClient = useQueryClient();

const { data: tasks = [], isLoading } = useQuery({
  queryKey: ["tasks"],
  queryFn: () => tasksService.getAll(),
});

const createMutation = useMutation({
  mutationFn: tasksService.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
});

const toggleMutation = useMutation({
  mutationFn: (id: number) => tasksService.toggle(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
});
```

---

## 8. Authentication flow

```
Hiện tại:
  AuthPage → setLoggedIn(true) → MainApp
  (không có real auth, chỉ là UI)

Cần implement:
  1. AuthPage gọi POST /auth/login
  2. Lưu token vào localStorage / httpOnly cookie
  3. Tạo AuthContext để share user state
  4. Protected routes: redirect về /login nếu chưa đăng nhập
  5. Refresh token tự động khi token hết hạn

Gợi ý dùng: 
  - Firebase Auth (Google, Email/Password)
  - Supabase Auth (built-in)
  - NextAuth (nếu chuyển sang Next.js)
```

---

## 9. State management

### Hiện tại (local state)
Mỗi trang tự quản lý state của mình bằng `useState`. Dữ liệu **không persist** khi refresh.

### Khuyến nghị khi có backend

```
Data fetching:    React Query (@tanstack/react-query)
Global UI state:  Zustand (theme, auth, sidebar collapsed)
Forms:            React Hook Form + Zod validation
```

```typescript
// src/store/authStore.ts — Zustand example
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "auth-storage" }
  )
);
```

---

## 10. Lunar Calendar (Âm lịch)

File `src/app/utils/lunarCalendar.ts` chứa thuật toán chuyển đổi âm/dương lịch theo thuật toán chuẩn của Việt Nam.

```typescript
// Export functions:
solarToLunar(day, month, year) → { day, month, year, leap }
formatLunarShort(lunarDay, lunarMonth) → "14/5" 
getLunarSpecialDay(lunarDay, lunarMonth) → "Tết Nguyên Đán" | null
getCanChi(lunarYear) → "Giáp Thìn" | ...
```

**Không cần backend** — tính toán hoàn toàn client-side.

---

## 11. Calendar view toggle (Chế độ xem lịch)

Tính năng đặc biệt: từ các trang Tasks, Goals, Habits, Notes, Dashboard — có thể chuyển sang chế độ xem lịch.

```
MainApp.tsx:
  calendarView: boolean
  modalOpen: boolean        ← ẩn nút toggle khi có form đang mở

Nút Calendar toggle hiện khi:
  - page ∈ ["dashboard", "tasks", "goals", "habits", "notes"]
  - !modalOpen

Khi calendarView = true:
  - Overlay CalendarPage đè lên trang hiện tại (z-30)
  - TopBar ẩn
  - BottomNav thay bằng nút "Quay lại" (fixed, z-50)
  - Tất cả modal trong CalendarPage dùng z-[60] để không bị đè
```

---

## 12. Mobile vs Desktop

| Yếu tố | Mobile | Desktop |
|--------|--------|---------|
| Navigation | BottomNav (lg:hidden) | Sidebar (hidden lg:flex) |
| Layout | Single column | Side panel + content |
| TopBar | Hiển thị | Hiển thị |
| FAB (+) | bottom-20 (trên nav) | bottom-6 |
| Calendar toggle | fixed right-5, bottom ~148px | fixed right-6 |

---

## 13. Các packages cần cài thêm khi tích hợp backend

```bash
# Data fetching
pnpm add @tanstack/react-query

# State management
pnpm add zustand

# Routing
pnpm add react-router-dom

# Forms & validation
pnpm add react-hook-form zod @hookform/resolvers

# HTTP client (tuỳ chọn, thay fetch)
pnpm add axios

# Nếu dùng Supabase:
pnpm add @supabase/supabase-js

# Nếu dùng Firebase:
pnpm add firebase

# Toast notifications (đã có sonner trong project)
# pnpm add sonner ← đã cài
```

---

## 14. Checklist trước khi launch

- [ ] Thay tất cả `INITIAL_*` mock data bằng API calls
- [ ] Implement real authentication (không hardcode user)
- [ ] Thêm loading states (skeleton UI) cho tất cả fetch
- [ ] Thêm error handling + toast thông báo lỗi
- [ ] Implement offline support (React Query cache)
- [ ] Thêm React Router cho URL-based navigation
- [ ] Implement dark mode thực sự (toggle class trên `<html>`)
- [ ] Upload avatar (ProfilePage → Camera button)
- [ ] Push notifications (Web Push API)
- [ ] Data export (profile/export endpoint)
- [ ] Validation form đầy đủ với Zod
- [ ] Responsive test trên các thiết bị thực
- [ ] SEO meta tags (nếu public)
- [ ] Environment variables cho production

---

## 15. Ghi chú kiến trúc quan trọng

1. **`onModal` callback pattern**: Mỗi trang có form gọi `onModal(true/false)` để MainApp biết ẩn/hiện calendar toggle button. Khi thêm trang mới có form, nhớ implement pattern này.

2. **`Page` type**: Khi thêm trang mới, phải cập nhật `type Page` trong `MainApp.tsx`, thêm vào `titles` và `greetings` trong `TopBar.tsx`, và thêm vào `Sidebar.tsx`.

3. **z-index layers**:
   - `z-10`: Event detail overlay cũ (đã bỏ)  
   - `z-20`: Unused
   - `z-30`: Calendar overlay
   - `z-40`: FAB buttons, toggle buttons, BottomNav
   - `z-50`: "Quay lại" button, modal backdrops
   - `z-[60]`: Modal dialogs (EventForm, DayModal, EventDetailModal)

4. **CSS variables** (theme.css): Dùng `var(--primary)`, `var(--card)`, `var(--border)`, etc. thay vì hardcode màu. Thay đổi theme bằng cách override các biến này.

5. **Âm lịch**: Dữ liệu âm lịch tính toán 100% client-side, không cần API. Chỉ cần truyền ngày dương lịch vào `solarToLunar()`.
