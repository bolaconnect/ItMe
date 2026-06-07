import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AuthPage } from "./components/AuthPage";
import { MainApp } from "./components/MainApp";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div className="size-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!loggedIn ? (
          <motion.div
            key="auth"
            className="size-full"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <AuthPage onLogin={() => setLoggedIn(true)} />
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
