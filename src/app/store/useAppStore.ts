import { create } from "zustand";
import { Task } from "../components/tasks/taskData";
import { Goal } from "../../lib/goalsService";
import type { Page } from "../components/MainApp";

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

  bottomNavTabs: ["tasks", "calendar", "notes", "finance"],
  setBottomNavTabs: (tabs) => set({ bottomNavTabs: tabs }),
}));
