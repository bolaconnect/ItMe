import React, { useState } from "react";
import { Sparkles, Brain, Wallet, KeyRound, ArrowRight, ArrowLeft, Check, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Compass,
      colorHex: "var(--primary)",
      title: "Hướng dẫn sử dụng ItMe",
      subtitle: "Hãy dành 1 phút để xem cách dùng các tính năng cốt lõi bên dưới nhé!",
      steps: [
        "ItMe là trợ lý giúp bạn quản lý cuộc sống cá nhân toàn diện.",
        "Sử dụng Sidebar (máy tính) hoặc Bottom Nav (điện thoại) để chuyển giữa các trang.",
        "Nhấp vào nút Xem hướng dẫn trong Trang cá nhân để đọc lại bản này bất kỳ lúc nào."
      ]
    },
    {
      icon: Brain,
      colorHex: "#8B5CF6",
      title: "1. Quản lý Công việc & Pomodoro",
      subtitle: "Cách thiết lập mục tiêu tập trung hiệu quả:",
      steps: [
        "Tạo công việc: Nhấn nút (+) màu tím góc dưới màn hình, nhập tên việc và đặt mức độ ưu tiên.",
        "Đặt hạn chót: Đặt ngày hoàn thành để hệ thống tự phân loại việc cần làm hôm nay, sắp tới hay quá hạn.",
        "Tập trung Pomodoro: Nhấn biểu tượng Bộ não 🧠 cạnh công việc để mở bộ đếm ngược. Đồng hồ mặc định chạy 25 phút làm việc, 5 phút nghỉ ngơi và sẽ phát chuông báo khi hoàn thành."
      ]
    },
    {
      icon: Wallet,
      colorHex: "#10B981",
      title: "2. Ghi chép Tài chính & Quỹ khẩn cấp",
      subtitle: "Cách kiểm soát dòng tiền và tài sản ròng:",
      steps: [
        "Nhập Thu & Chi: Nhấn nút (+) chọn Thêm khoản chi/Thu nhập, phân loại theo nhóm chi tiêu.",
        "Phân tích biểu đồ: Xem biểu đồ tròn để biết nhóm nào đang ngốn nhiều tiền nhất, biểu đồ vùng để so sánh Thu/Chi 6 tháng qua.",
        "Theo dõi Tài sản & Nợ: Cập nhật tài sản (tiền mặt, vàng, tài khoản...) và các khoản nợ để theo dõi tổng Tài sản ròng (Net Worth)."
      ]
    },
    {
      icon: Sparkles,
      colorHex: "#EF4444",
      title: "3. Thói quen & Cứu chuỗi Streak",
      subtitle: "Cách xây dựng kỷ luật bản thân mỗi ngày:",
      steps: [
        "Tạo thói quen: Thiết lập tên, màu sắc, icon và tần suất (Mỗi ngày, Ngày thường, Cuối tuần).",
        "Điểm danh thói quen: Khi làm xong, bấm dấu tích tròn (✅) để tăng chuỗi ngày liên tiếp (Streak).",
        "Cứu chuỗi (Streak Recovery): Nếu lỡ quên điểm danh làm đứt chuỗi, hãy nhấn icon Khiên bảo vệ 🛡️ để hồi phục chuỗi ngày cũ (lượt cứu được cấp thêm vào đầu mỗi tháng dựa trên tổng số thói quen của bạn)."
      ]
    },
    {
      icon: KeyRound,
      colorHex: "#F59E0B",
      title: "4. Bảo mật Ghi chú & Mật khẩu",
      subtitle: "Cách lưu trữ thông tin nhạy cảm an toàn:",
      steps: [
        "Cài mã PIN: Vào mục Mật khẩu, thiết lập mã khóa PIN 4 số. Hệ thống sẽ gửi OTP về Email đăng ký để xác thực chính chủ.",
        "Kho Mật khẩu: Lưu trữ thông tin tài khoản, mật khẩu, link đăng nhập và ghi chú bảo mật. Các thông tin này sẽ bị ẩn cho tới khi bạn mở khóa PIN.",
        "Ghi chú Markdown: Ghi chép nhanh ý tưởng, hỗ trợ định dạng Markdown cơ bản (dấu # để làm tiêu đề, - [ ] để làm checklist)."
      ]
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const ActiveIcon = slides[currentSlide].icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 overflow-hidden flex flex-col justify-between min-h-[440px] select-none"
        >
          {/* Skip button */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              Bỏ qua
            </button>
          )}

          {/* Slide Content */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <motion.div
              key={currentSlide}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {/* Icon Container */}
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-transparent"
                style={{
                  backgroundColor: `color-mix(in srgb, ${slides[currentSlide].colorHex} 12%, transparent)`,
                  color: slides[currentSlide].colorHex,
                  borderColor: `color-mix(in srgb, ${slides[currentSlide].colorHex} 20%, transparent)`
                }}
              >
                <ActiveIcon size={28} className={currentSlide === 0 ? "animate-bounce" : ""} />
              </div>

              <h2 className="text-base font-bold text-foreground mb-1 text-center">
                {slides[currentSlide].title}
              </h2>
              
              <p className="text-xs text-muted-foreground font-medium mb-4 text-center px-4">
                {slides[currentSlide].subtitle}
              </p>

              {/* Numbered Steps List */}
              <div className="w-full text-left space-y-2.5 bg-muted/30 p-4 rounded-xl border border-border/40 max-w-md">
                {slides[currentSlide].steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                    <span 
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] text-white"
                      style={{ backgroundColor: slides[currentSlide].colorHex }}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-border/50 pt-4 mt-6 flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx 
                      ? "w-4" 
                      : "w-1.5 opacity-40"
                  }`}
                  style={{
                    backgroundColor: currentSlide === idx ? slides[currentSlide].colorHex : "var(--muted-foreground)"
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {currentSlide > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Quay lại"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-98 transition-all shadow-md shadow-primary/10 cursor-pointer"
                style={{
                  backgroundColor: slides[currentSlide].colorHex,
                  fontSize: "13px"
                }}
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    <Check size={16} />
                    Bắt đầu dùng
                  </>
                ) : (
                  <>
                    Bước tiếp theo
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
