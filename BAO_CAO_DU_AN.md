# BÁO CÁO TỔNG HỢP DỰ ÁN ITME
*Cập nhật lần cuối: Tháng 6/2026*

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

**ItMe** là một ứng dụng quản lý cuộc sống cá nhân (Personal Productivity & Life Management) toàn diện. Ứng dụng được thiết kế nhằm giúp người dùng theo dõi và cân bằng mọi khía cạnh trong cuộc sống hàng ngày từ một nơi duy nhất.

### 🌟 Các Phân Hệ (Modules) Tính Năng Cốt Lõi:
*   **Tổng quan (Dashboard):** Trung tâm kiểm soát, cung cấp cái nhìn toàn cảnh về dữ liệu trong ngày.
*   **Công việc (Tasks) & Mục tiêu (Goals):** Quản lý tiến độ công việc theo mức độ ưu tiên và theo dõi các mục tiêu dài hạn.
*   **Thói quen (Habits):** Xây dựng và duy trì thói quen hàng ngày với cơ chế chuỗi (streak).
*   **Tài chính (Finance):** Theo dõi dòng tiền (thu/chi), quản lý tài sản và mục tiêu tiết kiệm.
*   **Ghi chú (Notes) & Lịch (Calendar):** Ghi chú thông minh, có tích hợp Âm Lịch Việt Nam và quản lý sự kiện đa dạng.
*   **Tiện ích nâng cao:** Đồng hồ Pomodoro (hoạt động ngầm xuyên trang), Chế độ Ngoại tuyến (Offline Mode), và Trích xuất Dữ liệu (JSON Export).

---

## 2. NỀN TẢNG & KIẾN TRÚC KỸ THUẬT (TECH STACK & ARCHITECTURE)

Dự án được xây dựng theo mô hình **Single Page Application (SPA)**, tối ưu cho cả trải nghiệm Web và Mobile (Android/iOS).

### 🛠️ Ngăn Xếp Công Nghệ (Tech Stack):
*   **Frontend Framework:** React 18 kết hợp TypeScript để đảm bảo tính chặt chẽ của dữ liệu (Type-safety).
*   **Build Tool:** Vite (đảm bảo tốc độ build và Hot-Module Replacement cực nhanh).
*   **Styling:** Tailwind CSS v4 kết hợp với các biến CSS tuỳ chỉnh (CSS variables).
*   **Animation:** `framer-motion` (tạo hiệu ứng chuyển trang, bật/tắt modal mượt mà).
*   **Đóng Gói Mobile:** Sử dụng **Capacitor** để đồng bộ bản build Web (thư mục `dist`) sang các nền tảng gốc (Native Android & iOS).

### 📂 Kiến Trúc Thư Mục (Folder Structure):
*   `src/app/components/`: Chứa toàn bộ giao diện (Màn hình chính, TopBar, BottomNav, Sidebar...).
*   `src/styles/`: Quản lý Design System (`theme.css`, `fonts.css`).
*   `src/app/utils/`: Chứa các hàm hỗ trợ độc lập (ví dụ: thuật toán chuyển đổi Âm/Dương lịch `lunarCalendar.ts`).
*   `android/` & `ios/`: Thư mục chứa project gốc của Capacitor để build ra App Mobile.

---

## 3. PHONG CÁCH THIẾT KẾ (DESIGN SYSTEM)

ItMe tuân thủ một hệ thống thiết kế (Design System) hiện đại, thân thiện, và mang lại cảm giác cao cấp (premium).

*   **Vibe chung:** Hiện đại, tối giản (clean), sử dụng bo góc lớn (`14px` - `18px`) tạo cảm giác mềm mại (bubbly).
*   **Màu sắc:** 
    *   *Primary:* Tím xanh (`#5B4CF5`) - thể hiện sự tập trung và sáng tạo.
    *   *Background:* Kem xám (`#F7F6F3`) - bảo vệ mắt, giúp làm nổi bật các thẻ (cards) màu trắng.
    *   *Semantic Colors:* Quy định rõ ràng (Xanh lá = Hoàn thành, Đỏ = Trễ hạn/Lỗi, Cam/Vàng = Cảnh báo).
*   **Typography:** Sử dụng bộ font `Plus Jakarta Sans` - hiện đại, tinh tế và hỗ trợ hiển thị Tiếng Việt xuất sắc.
*   **Responsive Layout:** Tuân thủ thiết kế **Mobile-first**. Trên điện thoại hiển thị thanh điều hướng dưới cùng (Bottom Navigation), trên Desktop tự động chuyển đổi thành thanh menu bên trái (Sidebar).
*   **Chuyển động (Motion):** Các thao tác đóng/mở popup, chuyển tab đều có hiệu ứng `scale`, `fade` nhẹ để tạo cảm giác phản hồi thực tế (tactile feedback).

---

## 4. CẤU TRÚC LOGIC VÀ DỮ LIỆU

### 🚦 Routing (Điều Hướng)
*   Hiện tại ứng dụng đang dùng **State-based Routing** thông qua `MainApp.tsx` (thay đổi trạng thái trang thay vì đổi URL). 
*   *Định hướng:* Có thể tích hợp `react-router-dom` khi dự án chuyển sang mô hình Backend-driven hoàn chỉnh.

### 💾 Data Models & Logic Xử Lý
*   Toàn bộ cấu trúc dữ liệu (`Task`, `Goal`, `Habit`, `Finance`, `Note`) đều được định nghĩa interface bằng TypeScript rõ ràng.
*   **Global Logic:** Một số tính năng đòi hỏi logic duy trì liên tục (chẳng hạn như đồng hồ **Pomodoro Timer**) được quản lý bằng State Management (Zustand) để không bị gián đoạn hay reset khi người dùng chuyển đổi qua lại giữa các trang.
*   **Logic Âm Lịch:** Được xử lý 100% tại Client-side mà không cần gọi API từ bên thứ 3, đảm bảo ứng dụng có thể tra cứu lịch ngay cả khi không có mạng.

---

## 5. TIẾN ĐỘ HIỆN TẠI VÀ ĐỊNH HƯỚNG TƯƠNG LAI

### ✅ Các Tính Năng Đã Hoàn Thiện Xuất Sắc:
1.  **Giao diện hoàn chỉnh:** Thiết kế đồng bộ từ màu sắc, font chữ đến trải nghiệm đa màn hình (Responsive).
2.  **Đồng hồ Pomodoro Thông Minh:** Floating timer (đồng hồ dạng nổi) hoạt động độc lập và bảo toàn trạng thái trên toàn hệ thống.
3.  **Onboarding Hấp Dẫn:** Luồng hướng dẫn người dùng mới (Step-by-step Carousel) chuyên nghiệp.
4.  **Cơ Chế Offline & Export:** Có cảnh báo khi mất mạng (Offline Badge) và cung cấp khả năng đóng gói toàn bộ dữ liệu ra file JSON để backup.
5.  **Mobile Ready:** Đã tích hợp và cấu hình thành công Capacitor, ứng dụng đã sẵn sàng chạy lệnh `npx cap build android` để tạo ra file `.apk` cài đặt trực tiếp lên điện thoại.

### 🚀 Định Hướng & Bước Tiếp Theo (Next Steps):
*   **Tích hợp Backend Thực Tế (Firebase/Supabase):** Chuyển đổi dữ liệu từ dạng Mock (giả lập) sang kết nối API thời gian thực.
*   **Cơ chế Offline-First mạnh mẽ hơn:** Bổ sung Caching (như React Query) hoặc Service Workers để đồng bộ dữ liệu sau khi có mạng lại.
*   **Hệ thống Thông báo (Push Notifications):** Đẩy thông báo nhắc nhở làm task, thói quen và sự kiện lên điện thoại (thông qua Web Push hoặc Capacitor Push Notifications).
