import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

/* ── Note Type ── */
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string; // ISO string
  color: string;
  createdAt?: Timestamp;
}

/* ── Helpers ── */
function notesRef(uid: string) {
  return collection(db, "users", uid, "notes");
}
function noteDocRef(uid: string, noteId: string) {
  return doc(db, "users", uid, "notes", noteId);
}

/* ── Realtime listener ── */
export function subscribeNotes(
  uid: string,
  callback: (notes: Note[]) => void
): () => void {
  // Sort by updatedAt descending initially, local logic will handle pinned sorting
  const q = query(notesRef(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const notes: Note[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Note, "id">),
    }));
    callback(notes);
  });
}

/* ── CRUD ── */
export async function addNote(
  uid: string,
  note: Omit<Note, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(notesRef(uid), {
    ...note,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(
  uid: string,
  noteId: string,
  data: Partial<Omit<Note, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(noteDocRef(uid, noteId), data);
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(noteDocRef(uid, noteId));
}
