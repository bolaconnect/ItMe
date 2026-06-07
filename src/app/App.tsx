import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AuthPage } from "./components/AuthPage";
import { MainApp } from "./components/MainApp";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="size-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            className="size-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <AuthPage onLogin={() => {}} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            className="size-full"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MainApp />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
