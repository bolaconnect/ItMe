import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Task } from "../app/components/tasks/taskData";

/* ── Helpers ── */
function tasksRef(uid: string) {
  return collection(db, "users", uid, "tasks");
}
function taskDocRef(uid: string, taskId: string) {
  return doc(db, "users", uid, "tasks", taskId);
}

/* ── Realtime listener ── */
export function subscribeTasks(
  uid: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(tasksRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const tasks: Task[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Task, "id">),
    }));
    callback(tasks);
  });
}

/* ── CRUD ── */
export async function addTask(
  uid: string,
  task: Omit<Task, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(tasksRef(uid), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(
  uid: string,
  taskId: string,
  data: Partial<Omit<Task, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(taskDocRef(uid, taskId), data);
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(taskDocRef(uid, taskId));
}
