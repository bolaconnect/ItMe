import { create } from "zustand";
import { Task } from "../components/tasks/taskData";
import { Goal } from "../../lib/goalsService";
import type { Page } from "../components/MainApp";
import { UserSettingsData } from "../../lib/settingsService";

/* ── Habit Types ── */
export type Frequency = "daily" | "weekdays" | "weekends";
export type HabitIcon = "sun" | "moon" | "coffee" | "dumbbell" | "book" | "heart" | "droplets" | "music" | "zap" | "flame";
export interface Habit {
  id: string;
  name: string;
  desc: string;
  icon: HabitIcon;
  color: string;
  frequency: Frequency;
  streak: number;
  best: number;
  completedDates: string[]; // ISO date strings
  createdAt?: any;
}

export function isHabitScheduledForToday(habit: Habit, dateStr: string = new Date().toLocaleDateString("en-CA")): boolean {
  const d = new Date(dateStr);
  const day = d.getDay();
  if (habit.frequency === "weekdays" && (day === 0 || day === 6)) return false;
  if (habit.frequency === "weekends" && day !== 0 && day !== 6) return false;
  return true;
}


/* ── Event Types ── */
export type EventType = "event" | "task" | "habit";
export interface CalEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  type: EventType;
  color: string;
  location?: string;
  note?: string;
  createdAt?: any;
}



/* ── Zustand Store ── */
interface AppState {
  tasks: Task[];
  setTasks: (updater: Task[] | ((prev: Task[]) => Task[])) => void;

  habits: Habit[];
  setHabits: (updater: Habit[] | ((prev: Habit[]) => Habit[])) => void;

  events: CalEvent[];
  setEvents: (updater: CalEvent[] | ((prev: CalEvent[]) => CalEvent[])) => void;

  goals: Goal[];
  setGoals: (updater: Goal[] | ((prev: Goal[]) => Goal[])) => void;

  bottomNavTabs: Page[];
  setBottomNavTabs: (tabs: Page[]) => void;

  settings: UserSettingsData;
  setSettings: (updater: UserSettingsData | ((prev: UserSettingsData) => UserSettingsData)) => void;

  /* ── Pomodoro State ── */
  pomodoroMode: "work" | "break" | "longBreak";
  pomodoroTimeLeft: number;
  pomodoroIsRunning: boolean;
  pomodoroActiveTaskId: string | null;
  setPomodoroState: (updater: Partial<Pick<AppState, "pomodoroMode" | "pomodoroTimeLeft" | "pomodoroIsRunning" | "pomodoroActiveTaskId">> | ((prev: Pick<AppState, "pomodoroMode" | "pomodoroTimeLeft" | "pomodoroIsRunning" | "pomodoroActiveTaskId">) => Partial<Pick<AppState, "pomodoroMode" | "pomodoroTimeLeft" | "pomodoroIsRunning" | "pomodoroActiveTaskId">>)) => void;
}

export const useAppStore = create<AppState>((set) => ({
  tasks: [],
  setTasks: (updater) => set((state) => ({
    tasks: typeof updater === "function" ? updater(state.tasks) : updater,
  })),

  habits: [],
  setHabits: (updater) => set((state) => ({
    habits: typeof updater === "function" ? updater(state.habits) : updater,
  })),

  events: [],
  setEvents: (updater) => set((state) => ({
    events: typeof updater === "function" ? updater(state.events) : updater,
  })),

  goals: [],
  setGoals: (updater) => set((state) => ({
    goals: typeof updater === "function" ? updater(state.goals) : updater,
  })),

  bottomNavTabs: ["events", "goals", "habits", "finance"],
  setBottomNavTabs: (tabs) => set({ bottomNavTabs: tabs }),

  settings: {},
  setSettings: (updater) => set((state) => ({
    settings: typeof updater === "function" ? updater(state.settings) : updater,
  })),

  pomodoroMode: "work",
  pomodoroTimeLeft: 25 * 60,
  pomodoroIsRunning: false,
  pomodoroActiveTaskId: null,
  setPomodoroState: (updater) => set((state) => {
    const current = {
      pomodoroMode: state.pomodoroMode,
      pomodoroTimeLeft: state.pomodoroTimeLeft,
      pomodoroIsRunning: state.pomodoroIsRunning,
      pomodoroActiveTaskId: state.pomodoroActiveTaskId,
    };
    const next = typeof updater === "function" ? updater(current) : updater;
    return next;
  }),
}));

export function getRecoveryInfo(habits: Habit[], goals: Goal[], settings: UserSettingsData) {
  const totalItems = habits.length + goals.length;
  const maxRecoveries = Math.ceil(totalItems / 3) * 5;
  const currentMonth = new Date().toISOString().slice(0, 7);
  let usedThisMonth = 0;
  if (settings?.streakRecovery?.month === currentMonth) {
    usedThisMonth = settings.streakRecovery.used;
  }
  return {
    maxRecoveries,
    usedThisMonth,
    remaining: Math.max(0, maxRecoveries - usedThisMonth),
    currentMonth,
  };
}
