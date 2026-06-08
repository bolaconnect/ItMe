import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

/* ── Goal type ── */
export type GoalCategory = "Sức khỏe" | "Công việc" | "Học tập" | "Tài chính" | "Cá nhân";
export type GoalStatus   = "active" | "done" | "paused";

export interface Goal {
  id:        string;      // Firestore document ID (string, không phải number)
  title:     string;
  desc:      string;
  category:  GoalCategory;
  target:    number;
  current:   number;
  unit:      string;
  deadline:  string;      // "YYYY-MM-DD"
  status:    GoalStatus;
  streak:    number;
  best:      number;
  completedDates: string[]; // ISO date strings
  createdAt?: Timestamp;
}

/* ── Helpers ── */
function goalsRef(uid: string) {
  return collection(db, "users", uid, "goals");
}
function goalDocRef(uid: string, goalId: string) {
  return doc(db, "users", uid, "goals", goalId);
}

/* ── Realtime listener ── */
export function subscribeGoals(
  uid: string,
  callback: (goals: Goal[]) => void
): () => void {
  const q = query(goalsRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const goals: Goal[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Goal, "id">),
    }));
    callback(goals);
  });
}

/* ── CRUD ── */
export async function addGoal(
  uid: string,
  goal: Omit<Goal, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(goalsRef(uid), {
    ...goal,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGoal(
  uid: string,
  goalId: string,
  data: Partial<Omit<Goal, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(goalDocRef(uid, goalId), data);
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  await deleteDoc(goalDocRef(uid, goalId));
}
