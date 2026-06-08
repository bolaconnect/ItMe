import emailjs from "@emailjs/browser";

// ── Cấu hình EmailJS ──
// Bạn chỉ cần đăng ký tài khoản miễn phí trên emailjs.com, tạo Service, Template rồi điền thông tin vào đây:
const EMAILJS_SERVICE_ID  = "service_bqkc3nq"; // Ví dụ: "service_xxxxxx"
const EMAILJS_TEMPLATE_ID = "template_ibev625"; // Ví dụ: "template_xxxxxx"
const EMAILJS_PUBLIC_KEY  = "ZhJTLqPPgN306CscS"; // Ví dụ: "your_public_key_xxxx"

export async function sendOtpEmail(email: string, name: string, otp: string): Promise<boolean> {
  // Nếu chưa điền thông tin cấu hình, trả về false để hệ thống kích hoạt chế độ Giả Lập (Mock)
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.log("[EmailJS] Chưa cấu hình thông số. Mã OTP được tạo là: ", otp);
    return false;
  }

  try {
    const templateParams = {
      to_email: email,
      email: email, // Dự phòng nếu template cài đặt biến {{email}}
      user_name: name,
      otp_code: otp,
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    return true; // Gửi thành công
  } catch (error) {
    console.error("[EmailJS] Lỗi khi gửi email: ", error);
    throw error;
  }
}
