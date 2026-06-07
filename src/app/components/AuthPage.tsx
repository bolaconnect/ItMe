import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../lib/firebase";

type Tab = "login" | "register";
type MobileScreen = "welcome" | "form";

export interface AuthPageProps {
  onLogin: () => void;
}

const companions = [
  "Theo dõi mục tiêu hằng ngày",
  "Lên kế hoạch thông minh",
  "Quản lý tài chính cá nhân",
  "Xây dựng thói quen tốt",
];

/* ── Brand panel content (shared desktop left + mobile welcome) ── */
function BrandPanel({
  onStart,
  isMobile,
}: {
  onStart?: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-primary">
      {/* Blobs */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #FF8A65, transparent)" }}
      />

      {/* Logo */}
      <div className={`relative z-10 flex items-center gap-3 ${isMobile ? "p-8 pt-14" : "p-12"}`}>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="text-white text-lg font-semibold tracking-tight">MyLife</span>
      </div>

      {/* Hero copy */}
      <div className={`relative z-10 space-y-8 ${isMobile ? "px-8" : "px-12"}`}>
        <div>
          <p className="text-white/60 text-sm mb-3 tracking-wide uppercase">Người bạn đồng hành</p>
          <h2
            className="text-white leading-snug"
            style={{ fontSize: isMobile ? "1.9rem" : "2rem", fontWeight: 700 }}
          >
            Sống có chủ đích,
            <br />
            <span className="text-white/70">mỗi ngày một bước.</span>
          </h2>
          <p className="text-white/55 mt-4 leading-relaxed text-sm">
            MyLife giúp bạn biến những ước mơ thành kế hoạch rõ ràng — và kế hoạch thành hành động thực tế mỗi ngày.
          </p>
        </div>

        <ul className="space-y-3">
          {companions.map((item) => (
            <li key={item} className="flex items-center gap-3 text-white/75 text-sm">
              <CheckCircle2 size={16} className="text-white/50 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Testimonial + CTA */}
      <div className={`relative z-10 space-y-4 ${isMobile ? "px-8 pb-14" : "px-12 pb-12"}`}>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
          <p className="text-white/80 text-sm leading-relaxed italic">
            "Từ khi dùng MyLife, tôi không còn cảm giác mỗi ngày trôi qua vô mục đích nữa."
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">
              TN
            </div>
            <div>
              <p className="text-white text-xs font-medium">Trần Ngọc</p>
              <p className="text-white/50 text-xs">Kỹ sư phần mềm, Hà Nội</p>
            </div>
          </div>
        </div>

        {/* Mobile CTA — only shown on welcome screen */}
        {isMobile && onStart && (
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-primary font-semibold text-sm active:scale-[0.98] transition-transform duration-150"
          >
            Bắt đầu ngay
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("welcome");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!loginEmail || !loginPassword) return setError("Vui lòng nhập đủ email và mật khẩu.");
    setIsLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/invalid-credential") setError("Email hoặc mật khẩu không chính xác.");
        else setError(err.message);
      } else setError("Đã xảy ra lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) return setError("Vui lòng điền đủ thông tin.");
    if (regPassword !== regConfirm) return setError("Mật khẩu xác nhận không khớp.");
    setIsLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await updateProfile(cred.user, { displayName: regName });
      // Lắng nghe auth state ở App.tsx sẽ tự động chuyển trang
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") setError("Email đã được sử dụng.");
        else if (err.code === "auth/weak-password") setError("Mật khẩu quá yếu (ít nhất 6 ký tự).");
        else setError(err.message);
      } else setError("Đã xảy ra lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderLogin = async (providerName: "google" | "github") => {
    setIsLoading(true); setError("");
    try {
      const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/popup-closed-by-user") setError("Đã huỷ đăng nhập.");
        else setError(err.message);
      } else setError("Đã xảy ra lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="size-full overflow-hidden bg-background">
      {/* ════════════════════════════════
          DESKTOP layout (lg+)
      ════════════════════════════════ */}
      <div className="hidden lg:flex w-full h-full">
        {/* Left brand */}
        <div className="w-[46%] xl:w-[42%] h-full">
          <BrandPanel />
        </div>

        {/* Right form */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-12">
          <FormPanel
            tab={tab}
            setTab={setTab}
            showPass={showPass}
            setShowPass={setShowPass}
            showConfirm={showConfirm}
            setShowConfirm={setShowConfirm}
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            regName={regName}
            setRegName={setRegName}
            regEmail={regEmail}
            setRegEmail={setRegEmail}
            regPassword={regPassword}
            setRegPassword={setRegPassword}
            regConfirm={regConfirm}
            setRegConfirm={setRegConfirm}
            handleEmailLogin={handleEmailLogin}
            handleEmailRegister={handleEmailRegister}
            handleProviderLogin={handleProviderLogin}
            isLoading={isLoading}
            error={error}
            setError={setError}
          />
        </div>
      </div>

      {/* ════════════════════════════════
          MOBILE layout (< lg)
          Two full-screen stacked slides
      ════════════════════════════════ */}
      <div className="flex lg:hidden w-full h-full relative overflow-hidden">
        <AnimatePresence initial={false}>
          {mobileScreen === "welcome" ? (
            <motion.div
              key="welcome"
              className="absolute inset-0"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            >
              <BrandPanel isMobile onStart={() => setMobileScreen("form")} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="absolute inset-0 bg-background flex flex-col overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            >
              {/* Back button */}
              <button
                onClick={() => setMobileScreen("welcome")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground px-6 pt-12 pb-2 hover:text-foreground transition-colors self-start"
              >
                <ChevronLeft size={16} />
                Quay lại
              </button>

              <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                <div className="w-full max-w-[400px]">
                  <FormPanel
                    tab={tab}
                    setTab={setTab}
                    showPass={showPass}
                    setShowPass={setShowPass}
                    showConfirm={showConfirm}
                    setShowConfirm={setShowConfirm}
                    loginEmail={loginEmail}
                    setLoginEmail={setLoginEmail}
                    loginPassword={loginPassword}
                    setLoginPassword={setLoginPassword}
                    regName={regName}
                    setRegName={setRegName}
                    regEmail={regEmail}
                    setRegEmail={setRegEmail}
                    regPassword={regPassword}
                    setRegPassword={setRegPassword}
                    regConfirm={regConfirm}
                    setRegConfirm={setRegConfirm}
                    handleEmailLogin={handleEmailLogin}
                    handleEmailRegister={handleEmailRegister}
                    handleProviderLogin={handleProviderLogin}
                    isLoading={isLoading}
                    error={error}
                    setError={setError}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Form panel ── */
interface FormPanelProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  regName: string;
  setRegName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  regConfirm: string;
  setRegConfirm: (v: string) => void;
  handleEmailLogin: (e?: React.FormEvent) => void;
  handleEmailRegister: (e?: React.FormEvent) => void;
  handleProviderLogin: (p: "google" | "github") => void;
  isLoading: boolean;
  error: string;
  setError: (v: string) => void;
}

function FormPanel({
  tab, setTab,
  showPass, setShowPass,
  showConfirm, setShowConfirm,
  loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  regName, setRegName,
  regEmail, setRegEmail,
  regPassword, setRegPassword,
  regConfirm, setRegConfirm,
  handleEmailLogin, handleEmailRegister, handleProviderLogin,
  isLoading, error, setError
}: FormPanelProps) {
  return (
    <div className="w-full max-w-[400px]">
      {/* Heading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-foreground" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            {tab === "login" ? "Chào mừng trở lại 👋" : "Bắt đầu hành trình 🌱"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
            {tab === "login"
              ? "Rất vui được gặp lại bạn. Tiếp tục hành trình nào!"
              : "Chỉ mất 1 phút để tạo tài khoản và bắt đầu."}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mt-7 p-1 bg-muted rounded-xl">
        {(["login", "register"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-200 ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forms */}
      <AnimatePresence mode="wait">
        {tab === "login" ? (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22 }}
            className="mt-6 space-y-4"
            onSubmit={handleEmailLogin}
          >
            <Field label="Email" htmlFor="l-email">
              <input
                id="l-email" type="email" placeholder="ban@email.com"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="input-base"
              />
            </Field>

            <Field label="Mật khẩu" htmlFor="l-pass">
              <div className="relative">
                <input
                  id="l-pass" type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-base pr-11"
                />
                <EyeToggle show={showPass} onToggle={() => setShowPass(!showPass)} />
              </div>
            </Field>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <SubmitButton label="Đăng nhập" isLoading={isLoading} />
            <Divider />
            <SocialButtons onGoogle={() => handleProviderLogin("google")} onGithub={() => handleProviderLogin("github")} isLoading={isLoading} />
          </motion.form>
        ) : (
          <motion.form
            key="register"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            className="mt-6 space-y-4"
            onSubmit={handleEmailRegister}
          >
            <Field label="Tên của bạn" htmlFor="r-name">
              <input
                id="r-name" type="text" placeholder="Nguyễn Văn A"
                value={regName} onChange={(e) => setRegName(e.target.value)}
                className="input-base"
              />
            </Field>

            <Field label="Email" htmlFor="r-email">
              <input
                id="r-email" type="email" placeholder="ban@email.com"
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                className="input-base"
              />
            </Field>

            <Field label="Mật khẩu" htmlFor="r-pass">
              <div className="relative">
                <input
                  id="r-pass" type={showPass ? "text" : "password"} placeholder="Tối thiểu 8 ký tự"
                  value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  className="input-base pr-11"
                />
                <EyeToggle show={showPass} onToggle={() => setShowPass(!showPass)} />
              </div>
              <PasswordStrength password={regPassword} />
            </Field>

            <Field label="Xác nhận mật khẩu" htmlFor="r-confirm">
              <div className="relative">
                <input
                  id="r-confirm" type={showConfirm ? "text" : "password"} placeholder="Nhập lại mật khẩu"
                  value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                  className="input-base pr-11"
                />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
            </Field>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Bằng cách tạo tài khoản, bạn đồng ý với{" "}
              <button type="button" className="text-primary hover:underline">Điều khoản sử dụng</button>{" "}
              và{" "}
              <button type="button" className="text-primary hover:underline">Chính sách bảo mật</button>.
            </p>

            <SubmitButton label="Tạo tài khoản" isLoading={isLoading} />
            <Divider />
            <SocialButtons onGoogle={() => handleProviderLogin("google")} onGithub={() => handleProviderLogin("github")} isLoading={isLoading} />
          </motion.form>
        )}
      </AnimatePresence>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {tab === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <button
          onClick={() => setTab(tab === "login" ? "register" : "login")}
          className="text-primary font-medium hover:underline"
        >
          {tab === "login" ? "Đăng ký ngay" : "Đăng nhập"}
        </button>
      </p>
    </div>
  );
}

/* ── Micro helpers ── */

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm text-foreground">{label}</label>
      {children}
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function SubmitButton({ label, isLoading }: { label: string; isLoading?: boolean }) {
  return (
    <button
      type="submit" disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 mt-2 disabled:opacity-50 disabled:pointer-events-none"
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>{label} <ArrowRight size={16} /></>}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">hoặc</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function SocialButtons({ onGoogle, onGithub, isLoading }: { onGoogle: () => void; onGithub: () => void; isLoading?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SocialBtn icon={GoogleIcon} label="Google" onClick={onGoogle} disabled={isLoading} />
      <SocialBtn icon={GithubIcon} label="GitHub" onClick={onGithub} disabled={isLoading} />
    </div>
  );
}

function SocialBtn({ icon: Icon, label, onClick, disabled }: { icon: React.ElementType; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      <Icon />
      {label}
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const strength = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  const colors = ["bg-muted", "bg-red-400", "bg-yellow-400", "bg-green-500"];
  const labels = ["", "Yếu", "Trung bình", "Mạnh"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= strength ? colors[strength] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[strength]}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
