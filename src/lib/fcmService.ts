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

  if (!VAPID_KEY) {
    console.error("[FCM] Thiếu cấu hình VITE_FIREBASE_VAPID_KEY trong file .env!");
    return null;
  }

  try {
    // 1. Xin quyền thông báo từ trình duyệt
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Quyền thông báo bị từ chối.");
      return null;
    }

    // 2. Lấy FCM token từ Firebase
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY 
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
  } catch (err) {
    console.error("[FCM] Lỗi khi đăng ký FCM Token:", err);
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
