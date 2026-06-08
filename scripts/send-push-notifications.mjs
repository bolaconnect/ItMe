import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// 1. Kiểm tra và tải Firebase Service Account JSON
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("❌ Lỗi: Thiếu biến môi trường FIREBASE_SERVICE_ACCOUNT_JSON!");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  console.error("❌ Lỗi: FIREBASE_SERVICE_ACCOUNT_JSON không phải là định dạng JSON hợp lệ!", err);
  process.exit(1);
}

// Khởi tạo Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const fcm = getMessaging();

// Thiết lập múi giờ Việt Nam (UTC+7)
function getVietnamLocalDate() {
  const d = new Date();
  const vnTime = new Date(d.getTime() + 7 * 3600 * 1000);
  return vnTime.toISOString().split("T")[0];
}

function getVietnamLocalHour() {
  const d = new Date();
  const vnTime = new Date(d.getTime() + 7 * 3600 * 1000);
  return vnTime.getUTCHours();
}

async function runNotificationSender() {
  console.log("🚀 Bắt đầu quét và gửi thông báo đẩy...");
  const todayStr = getVietnamLocalDate();
  const localHour = getVietnamLocalHour();
  const nowMs = Date.now();

  console.log(`⏰ Giờ Việt Nam hiện tại: ${todayStr} lúc ${localHour}:00`);

  // Quét tất cả người dùng
  const usersSnap = await db.collection("users").get();
  console.log(`👥 Tìm thấy ${usersSnap.docs.length} người dùng.`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    
    // Đọc cài đặt thông báo (Preferences)
    const preferences = userData.preferences || [];
    const getSettingVal = (id, defaultVal) => {
      const s = preferences.find(x => x.id === id);
      return s ? s.enabled : defaultVal;
    };
    
    const taskEnabled = getSettingVal("notif_task", true);
    const habitEnabled = getSettingVal("notif_habit", true);
    const dailyEnabled = getSettingVal("notif_daily", true);

    // Lấy danh sách FCM tokens của user này
    const tokensSnap = await db.collection(`users/${uid}/fcmTokens`).get();
    if (tokensSnap.empty) {
      console.log(`ℹ️ User ${uid}: Không có thiết bị đăng ký (FCM Tokens). Bỏ qua.`);
      continue;
    }
    const tokenDocs = tokensSnap.docs.map(doc => ({ id: doc.id, token: doc.data().token }));
    const tokens = tokenDocs.map(td => td.token);

    console.log(`👉 User ${uid}: Có ${tokens.length} thiết bị đang hoạt động.`);

    const notificationsToSend = [];

    // ──────────────────────────────────────────
    // A. XỬ LÝ CÔNG VIỆC (TASKS)
    // ──────────────────────────────────────────
    if (taskEnabled) {
      const tasksSnap = await db.collection(`users/${uid}/tasks`)
        .where("done", "==", false).get();

      for (const taskDoc of tasksSnap.docs) {
        const task = taskDoc.data();
        if (!task.dueDate) continue;

        // Định dạng thời gian đến hạn
        const dueMs = Date.parse(`${task.dueDate}T${task.dueTime || "23:59"}:00`);
        if (isNaN(dueMs)) continue;

        const diffH = (dueMs - nowMs) / 3_600_000;

        let tag = null;
        let title = "";
        let body = "";

        // Trễ hạn trong vòng 24 giờ
        if (diffH < 0 && diffH > -24) {
          tag = `push-overdue-${taskDoc.id}-${task.dueDate}`;
          title = `⚠️ Trễ hạn: ${task.title}`;
          const absDiffH = Math.abs(diffH);
          let timeText = "";
          if (absDiffH < 1) {
            timeText = `${Math.max(1, Math.round(absDiffH * 60))} phút`;
          } else {
            timeText = `${Math.round(absDiffH)} giờ`;
          }
          body = `Công việc này đã quá hạn ${timeText}! Hãy hoàn thành ngay nhé.`;
        }
        // Sắp đến hạn (trong vòng 1 giờ)
        else if (diffH >= 0 && diffH <= 1) {
          tag = `push-upcoming-${taskDoc.id}-${task.dueDate}`;
          title = `⏰ Sắp đến hạn: ${task.title}`;
          const mins = Math.max(1, Math.round(diffH * 60));
          body = `Hạn chót vào lúc ${task.dueTime || "cuối ngày"} hôm nay (còn ${mins} phút).`;
        }

        if (tag) {
          notificationsToSend.push({
            tag,
            title,
            body,
            type: diffH < 0 ? "overdue" : "upcoming",
            targetPage: "tasks"
          });
        }
      }
    }

    // ──────────────────────────────────────────
    // B. XỬ LÝ SỰ KIỆN (EVENTS)
    // ──────────────────────────────────────────
    // Sự kiện luôn được bật theo mặc định của app
    const eventsSnap = await db.collection(`users/${uid}/events`).get();
    for (const eventDoc of eventsSnap.docs) {
      const event = eventDoc.data();
      if (!event.date) continue;

      const eventMs = Date.parse(`${event.date}T${event.time || "00:00"}:00`);
      if (isNaN(eventMs)) continue;

      const diffH = (eventMs - nowMs) / 3_600_000;

      // Sự kiện sắp bắt đầu trong vòng 1 giờ
      if (diffH >= 0 && diffH <= 1) {
        const tag = `push-event-${eventDoc.id}-${event.date}`;
        const loc = event.location ? ` tại ${event.location}` : "";
        const mins = Math.max(1, Math.round(diffH * 60));
        
        notificationsToSend.push({
          tag,
          title: `📅 Sự kiện sắp tới: ${event.title}`,
          body: `Sự kiện bắt đầu lúc ${event.time || "00:00"}${loc} (còn ${mins} phút).`,
          type: "event",
          targetPage: "events"
        });
      }
    }

    // ──────────────────────────────────────────
    // C. XỬ LÝ THÓI QUEN (HABITS)
    // ──────────────────────────────────────────
    // Gửi nhắc nhở thói quen vào buổi tối nếu chưa hoàn thành (từ 19:00 - 21:00)
    if (habitEnabled && localHour >= 19 && localHour <= 21) {
      const habitsSnap = await db.collection(`users/${uid}/habits`).get();
      const dow = new Date().getDay(); // 0: Chủ Nhật, 1-6: Thứ 2-Thứ 7
      const isWeekend = dow === 0 || dow === 6;

      for (const habitDoc of habitsSnap.docs) {
        const habit = habitDoc.data();
        const completedDates = habit.completedDates || [];

        // Nếu đã hoàn thành hôm nay, bỏ qua
        if (completedDates.includes(todayStr)) continue;

        // Kiểm tra tần suất thói quen
        if (habit.frequency === "weekdays" && isWeekend) continue;
        if (habit.frequency === "weekends" && !isWeekend) continue;

        const tag = `push-habit-${habitDoc.id}-${todayStr}`;
        notificationsToSend.push({
          tag,
          title: `🔥 Thói quen chưa check-in: ${habit.name}`,
          body: `Đừng quên check-in thói quen hôm nay để duy trì streak nhé!`,
          type: "habit",
          targetPage: "habits"
        });
      }
    }

    // ──────────────────────────────────────────
    // D. GỬI VÀ DEDUP THÔNG BÁO
    // ──────────────────────────────────────────
    if (notificationsToSend.length === 0) {
      console.log(`ℹ️ User ${uid}: Không có thông báo cần gửi trong chu kỳ này.`);
      continue;
    }

    console.log(`🔔 User ${uid}: Tính toán được ${notificationsToSend.length} thông báo cần gửi.`);

    for (const notif of notificationsToSend) {
      // Kiểm tra xem đã gửi thông báo này chưa
      const sentRef = db.doc(`users/${uid}/sentPushNotifs/${notif.tag}`);
      const sentDoc = await sentRef.get();
      
      if (sentDoc.exists) {
        console.log(`⏭️ Đã gửi từ trước (skip): ${notif.tag}`);
        continue;
      }

      console.log(`✉️ Đang gửi push: "${notif.title}" (tag: ${notif.tag})`);

      try {
        // Gửi push qua FCM
        const response = await fcm.sendEachForMulticast({
          tokens,
          notification: {
            title: notif.title,
            body: notif.body
          },
          data: {
            type: notif.type,
            tag: notif.tag,
            targetPage: notif.targetPage
          },
          webpush: {
            fcmOptions: {
              link: `https://bolaconnect.github.io/ItMe/`
            }
          }
        });

        console.log(`   👉 Kết quả: Gửi thành công ${response.successCount}/${tokens.length} thiết bị.`);

        // Dọn dẹp các token không hợp lệ hoặc đã hủy đăng ký
        if (response.failureCount > 0) {
          const tokensToRemove = [];
          response.responses.forEach((res, index) => {
            if (!res.success) {
              const error = res.error;
              if (error && (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
              )) {
                tokensToRemove.push(tokenDocs[index]);
              }
            }
          });

          if (tokensToRemove.length > 0) {
            console.log(`   🧹 Dọn dẹp ${tokensToRemove.length} token hỏng...`);
            for (const td of tokensToRemove) {
              await db.doc(`users/${uid}/fcmTokens/${td.id}`).delete();
              console.log(`      ❌ Xóa token ID: ${td.id}`);
            }
          }
        }

        // Đánh dấu đã gửi (Expires sau 7 ngày để tự động dọn dẹp)
        await sentRef.set({
          sentAt: new Date(),
          expiresAt: new Date(nowMs + 7 * 86400000)
        });

      } catch (fcmErr) {
        console.error(`❌ Lỗi khi gửi FCM cho user ${uid}:`, fcmErr);
      }
    }
  }

  console.log("✅ Hoàn thành chu kỳ quét thông báo đẩy.");
}

runNotificationSender().catch(err => {
  console.error("💥 Lỗi nghiêm trọng khi chạy tập lệnh:", err);
  process.exit(1);
});
