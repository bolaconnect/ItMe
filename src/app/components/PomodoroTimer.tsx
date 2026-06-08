import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Minimize2, Maximize2, X, Coffee, Brain, Volume2, VolumeX, Flame } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { AnimatePresence, motion } from "motion/react";

// Web Audio API helper to play a pleasant chime
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a sequence of notes (chime)
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.4);      // C5
    playNote(659.25, now + 0.15, 0.4); // E5
    playNote(783.99, now + 0.3, 0.6);  // G5
  } catch (e) {
    console.error("Failed to play chime using Web Audio API", e);
  }
}

export function PomodoroTimer() {
  const { 
    pomodoroMode, 
    pomodoroTimeLeft, 
    pomodoroIsRunning, 
    pomodoroActiveTaskId, 
    setPomodoroState,
    tasks 
  } = useAppStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeTask = tasks.find(t => t.id === pomodoroActiveTaskId);

  // Sync mode changes and reset time
  const handleModeChange = (mode: "work" | "break" | "longBreak") => {
    let seconds = 25 * 60;
    if (mode === "break") seconds = 5 * 60;
    if (mode === "longBreak") seconds = 15 * 60;

    setPomodoroState({
      pomodoroMode: mode,
      pomodoroTimeLeft: seconds,
      pomodoroIsRunning: false,
    });
  };

  // Timer logic
  useEffect(() => {
    if (pomodoroIsRunning) {
      timerRef.current = setInterval(() => {
        setPomodoroState((prev) => {
          if (prev.pomodoroTimeLeft <= 1) {
            // Timer finished
            if (timerRef.current) clearInterval(timerRef.current);
            if (soundEnabled) playChime();
            
            // Switch mode automatically
            let nextMode: "work" | "break" | "longBreak" = "work";
            let nextTime = 25 * 60;
            
            if (prev.pomodoroMode === "work") {
              nextMode = "break";
              nextTime = 5 * 60;
            } else {
              nextMode = "work";
              nextTime = 25 * 60;
            }

            return {
              pomodoroMode: nextMode,
              pomodoroTimeLeft: nextTime,
              pomodoroIsRunning: false,
            };
          }
          return { pomodoroTimeLeft: prev.pomodoroTimeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoroIsRunning, soundEnabled]);

  // Formatter for MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentModeLabel = () => {
    if (pomodoroMode === "work") return "Tập trung";
    if (pomodoroMode === "break") return "Nghỉ ngắn";
    return "Nghỉ dài";
  };

  const currentModeBg = () => {
    if (pomodoroMode === "work") return "bg-primary/10 text-primary border-primary/20";
    if (pomodoroMode === "break") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    return "bg-sky-500/10 text-sky-500 border-sky-500/20";
  };

  const toggleTimer = () => {
    setPomodoroState({ pomodoroIsRunning: !pomodoroIsRunning });
  };

  const resetTimer = () => {
    let seconds = 25 * 60;
    if (pomodoroMode === "break") seconds = 5 * 60;
    if (pomodoroMode === "longBreak") seconds = 15 * 60;

    setPomodoroState({
      pomodoroTimeLeft: seconds,
      pomodoroIsRunning: false,
    });
  };

  const closePomodoro = () => {
    setPomodoroState({
      pomodoroIsRunning: false,
      pomodoroActiveTaskId: null,
    });
  };

  // If no task active and not running and time is default, we don't force show it unless activeTaskId exists or running
  // Actually, we'll let it be managed: we can render it globally, but hide it if activeTaskId is null AND isRunning is false AND it hasn't been opened.
  // Wait, let's make it so that if activeTaskId is present or isRunning is true, or if pomodoroActiveTaskId is "open" (any string), it shows up.
  if (pomodoroActiveTaskId === null && !pomodoroIsRunning && pomodoroTimeLeft === 25 * 60 && pomodoroMode === "work") {
    return null; // Don't render if inactive and default
  }

  return (
    <AnimatePresence>
      {isMinimized ? (
        // Floating Minimized Widget
        <motion.div
          key="minimized"
          layoutId="pomodoro-timer-container"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 bg-card/90 backdrop-blur-md border border-border shadow-2xl p-2.5 rounded-full select-none"
        >
          <div className={`p-2 rounded-full ${pomodoroMode === 'work' ? 'bg-primary' : 'bg-emerald-500'} text-white`}>
            {pomodoroMode === "work" ? <Brain size={14} className={pomodoroIsRunning ? "animate-pulse" : ""} /> : <Coffee size={14} />}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] text-muted-foreground font-medium -mb-1">{currentModeLabel()}</span>
            <span className="text-sm font-bold font-mono tracking-wider">{formatTime(pomodoroTimeLeft)}</span>
          </div>
          
          <button 
            onClick={toggleTimer}
            className="w-7 h-7 flex items-center justify-center bg-muted hover:bg-secondary rounded-full text-foreground transition-all active:scale-95"
          >
            {pomodoroIsRunning ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
          
          <button 
            onClick={() => setIsMinimized(false)}
            className="w-7 h-7 flex items-center justify-center bg-muted hover:bg-secondary rounded-full text-foreground transition-all active:scale-95"
            title="Mở rộng"
          >
            <Maximize2 size={12} />
          </button>
        </motion.div>
      ) : (
        // Expanded Panel (Bottom Right Modal or Widget)
        <motion.div
          key="expanded"
          layoutId="pomodoro-timer-container"
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 100 }}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-72 bg-card border border-border shadow-2xl rounded-2xl p-4 select-none overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-3.5">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-primary animate-pulse" />
              <span className="font-bold text-sm text-foreground">Bộ đếm tập trung</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Thu nhỏ"
              >
                <Minimize2 size={14} />
              </button>
              <button 
                onClick={closePomodoro}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl mb-4 text-xs font-semibold">
            {(["work", "break", "longBreak"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`py-1.5 rounded-lg transition-all ${
                  pomodoroMode === mode 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "work" ? "Tập trung" : mode === "break" ? "Nghỉ ngắn" : "Nghỉ dài"}
              </button>
            ))}
          </div>

          {/* Timer Circle/Box */}
          <div className="flex flex-col items-center justify-center py-2 mb-4">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentModeBg()} mb-1`}>
              {currentModeLabel()}
            </span>
            <span className="text-4xl font-extrabold font-mono tracking-widest text-foreground">
              {formatTime(pomodoroTimeLeft)}
            </span>
            {activeTask && (
              <p className="text-xs text-muted-foreground mt-2 truncate w-full text-center max-w-[200px]" title={activeTask.title}>
                🎯 Đang làm: <span className="font-bold text-foreground">{activeTask.title}</span>
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
              title="Đặt lại"
            >
              <RotateCcw size={16} />
            </button>
            
            <button
              onClick={toggleTimer}
              className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all active:scale-98"
            >
              {pomodoroIsRunning ? (
                <>
                  <Pause size={16} />
                  Tạm dừng
                </>
              ) : (
                <>
                  <Play size={16} className="fill-current" />
                  Bắt đầu
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
