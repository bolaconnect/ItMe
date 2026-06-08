import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { CalEvent } from "../app/store/useAppStore";

function eventsRef(uid: string) {
  return collection(db, "users", uid, "events");
}
function eventDocRef(uid: string, eventId: string) {
  return doc(db, "users", uid, "events", eventId);
}

export function subscribeEvents(
  uid: string,
  callback: (events: CalEvent[]) => void
): () => void {
  const q = query(eventsRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const events: CalEvent[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CalEvent, "id">),
    }));
    callback(events);
  });
}

export async function addEvent(
  uid: string,
  event: Omit<CalEvent, "id" | "createdAt">
): Promise<string> {
  const cleanEvent = Object.fromEntries(
    Object.entries(event).filter(([_, v]) => v !== undefined)
  );
  const ref = await addDoc(eventsRef(uid), {
    ...cleanEvent,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(eventDocRef(uid, eventId));
}
