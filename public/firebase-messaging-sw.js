// firebase-messaging-sw.js
// Service Worker cho Firebase Cloud Messaging, được import vào PWA Service Worker chính.

importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Khởi tạo Firebase trong Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDOShcp0N1stEj2jmVAJgS861n-_6znXiI",
  authDomain: "itme-22311.firebaseapp.com",
  projectId: "itme-22311",
  storageBucket: "itme-22311.firebasestorage.app",
  messagingSenderId: "541050754172",
  appId: "1:541050754172:web:c73689f892dc73110a25f9"
});

const messaging = firebase.messaging();

// Lắng nghe và hiển thị thông báo khi ứng dụng đang chạy nền hoặc bị tắt
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM SW] Nhận thông báo trong nền:", payload);
  
  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || "ItMe";
  const notificationOptions = {
    body: body || "Bạn có thông báo mới từ ItMe!",
    icon: icon || "/ItMe/icon.png",
    badge: "/ItMe/icon.png",
    tag: payload.data?.tag || "itme-notif",
    data: payload.data || {},
    // Rung điện thoại khi nhận thông báo (chỉ hoạt động trên Android/Chrome hỗ trợ)
    vibrate: [100, 50, 100],
    requireInteraction: payload.data?.type === "overdue" // Yêu cầu người dùng tương tác nếu trễ hạn
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý khi người dùng click vào thông báo đẩy
self.addEventListener("notificationclick", (event) => {
  console.log("[FCM SW] Click thông báo:", event.notification.tag);
  
  event.notification.close();

  // Tập trung vào cửa sổ ứng dụng đang mở hoặc mở cửa sổ mới
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Tìm tab ứng dụng ItMe đang mở
      for (const client of clientList) {
        if (client.url.includes("/ItMe/") && "focus" in client) {
          return client.focus();
        }
      }
      // Nếu không tìm thấy, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow("/ItMe/");
      }
    })
  );
});
