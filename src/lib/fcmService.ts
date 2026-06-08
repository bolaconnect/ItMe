import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Băm chuỗi token để tạo ID tài liệu Firestore an toàn và ngắn gọn
 */
async function hashString(str: string): Promise<string> {
  try {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 24);
  } catch (e) {
    // Fallback nếu crypto.subtle không có sẵn (ví dụ: môi trường không bảo mật)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Đăng ký nhận thông báo đẩy FCM
 * 1. Xin quyền Browser Notification
 * 2. Lấy FCM Token
 * 3. Lưu Token vào Firestore để Backend/Script gửi push
 */
export async function requestFCMToken(uid: string): Promise<string | null> {
  if (!messaging) {
    console.warn("[FCM] Firebase Messaging không được hỗ trợ trên thiết bị/trình duyệt này.");
    return null;
  }

  if (!VAPID_KEY || VAPID_KEY.trim() === "" || VAPID_KEY.includes("YOUR_FIREBASE_VAPID_KEY_HERE")) {
    console.warn(
      "[FCM] VITE_FIREBASE_VAPID_KEY chưa được cấu hình hợp lệ trong file .env.local!\n" +
      "Để kích hoạt thông báo đẩy:\n" +
      "1. Truy cập Firebase Console > Cài đặt dự án > Cloud Messaging.\n" +
      "2. Tại mục 'Web push certificates', tạo một cặp khóa (Key pair) và sao chép nó.\n" +
      "3. Thay thế giá trị của VITE_FIREBASE_VAPID_KEY trong file .env.local bằng khóa này."
    );
    return null;
  }

  try {
    // 1. Xin quyền thông báo từ trình duyệt
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Quyền thông báo bị từ chối.");
      return null;
    }

    // 2. Đăng ký/lấy Service Worker tùy chỉnh để hỗ trợ đường dẫn base (Vite /ItMe/)
    const baseUrl = import.meta.env.BASE_URL || '/';
    const swUrl = `${baseUrl}firebase-messaging-sw.js`;
    const swScope = `${baseUrl}firebase-cloud-messaging-push-scope`;
    let registration: ServiceWorkerRegistration | undefined;
    
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        // 2.1. Thử tìm xem có PWA Service Worker (thường tên là sw.js hoặc chứa registerSW.js) đã đăng ký chưa.
        // PWA Service Worker trong production đã import firebase-messaging-sw.js.
        registration = registrations.find(r => {
          const scriptURL = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
          return scriptURL.includes('sw.js') || scriptURL.includes('registerSW.js');
        });
        
        // 2.2. Nếu không có PWA SW, hoặc đang chạy ở dev (không kích hoạt PWA), thử tìm SW riêng cho FCM
        if (!registration) {
          registration = registrations.find(r => {
            const scriptURL = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
            return scriptURL.includes('firebase-messaging-sw.js');
          });
        }
        
        // 2.3. Nếu vẫn chưa có registration phù hợp, tiến hành đăng ký mới với scope tùy chỉnh dưới base path
        if (!registration) {
          console.log("[FCM] Đăng ký Service Worker tùy chỉnh cho FCM:", swUrl, "với scope:", swScope);
          registration = await navigator.serviceWorker.register(swUrl, {
            scope: swScope
          });
        }
      } catch (swErr) {
        console.warn("[FCM] Lỗi khi xử lý Service Worker:", swErr);
      }
    }

    // 3. Lấy FCM token từ Firebase
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {})
    });

    if (!token) {
      console.warn("[FCM] Không lấy được FCM Token.");
      return null;
    }

    // 3. Lưu token vào Firestore dưới document của user
    const tokenId = await hashString(token);
    const docRef = doc(db, "users", uid, "fcmTokens", tokenId);
    
    await setDoc(docRef, {
      token,
      device: navigator.userAgent.substring(0, 200),
      platform: getPlatformName(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("[FCM] Đăng ký thiết bị thành công. Token ID:", tokenId);
    return token;
  } catch (err: any) {
    if (err?.message?.includes("applicationServerKey") || err?.message?.includes("VAPID") || err?.name === "InvalidAccessError") {
      console.error(
        "[FCM] Đăng ký thất bại do VAPID Key không hợp lệ. Hãy kiểm tra và đảm bảo khóa VITE_FIREBASE_VAPID_KEY trong file .env.local trùng khớp chính xác với khóa từ Firebase Console."
      );
    } else {
      console.error("[FCM] Lỗi khi đăng ký FCM Token:", err);
    }
    return null;
  }
}

/**
 * Hủy đăng ký nhận thông báo đẩy FCM (Xóa token khỏi Firestore)
 */
export async function removeFCMToken(uid: string, token: string): Promise<boolean> {
  if (!uid || !token) return false;
  try {
    const tokenId = await hashString(token);
    const docRef = doc(db, "users", uid, "fcmTokens", tokenId);
    await deleteDoc(docRef);
    console.log("[FCM] Hủy đăng ký thiết bị thành công. Token ID:", tokenId);
    return true;
  } catch (err) {
    console.error("[FCM] Lỗi khi hủy đăng ký FCM Token:", err);
    return false;
  }
}

/**
 * Lắng nghe tin nhắn khi app đang mở ở foreground
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  try {
    return onMessage(messaging, callback);
  } catch (err) {
    console.error("[FCM] Lỗi khi đăng ký lắng nghe foreground message:", err);
    return () => {};
  }
}

/**
 * Trợ giúp xác định loại thiết bị
 */
function getPlatformName(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  return "Desktop/Web";
}
