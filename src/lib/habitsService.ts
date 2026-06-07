import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Habit } from "../app/store/useAppStore";

/* ── Helpers ── */
function habitsRef(uid: string) {
  return collection(db, "users", uid, "habits");
}
function habitDocRef(uid: string, habitId: string) {
  return doc(db, "users", uid, "habits", habitId);
}

/* ── Realtime listener ── */
export function subscribeHabits(
  uid: string,
  callback: (habits: Habit[]) => void
): () => void {
  const q = query(habitsRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const habits: Habit[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Habit, "id">),
    }));
    callback(habits);
  });
}

/* ── CRUD ── */
export async function addHabit(
  uid: string,
  habit: Omit<Habit, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(habitsRef(uid), {
    ...habit,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHabit(
  uid: string,
  habitId: string,
  data: Partial<Omit<Habit, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(habitDocRef(uid, habitId), data);
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  await deleteDoc(habitDocRef(uid, habitId));
}
