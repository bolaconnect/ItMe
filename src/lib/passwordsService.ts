import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ── Types ── */
export interface Credential {
  id: string;
  name: string;
  username: string;
  password: string; // encrypted in Firestore, decrypted in memory
  url?: string;
  category: "social" | "bank" | "work" | "shopping" | "entertainment";
  note?: string;
  pinned: boolean;
  strength: "weak" | "medium" | "strong";
  updatedAt: string;
}

/* ─────────────────────────────────────────
   AES-GCM encryption helpers
   Key is derived from the user's UID so
   only they can decrypt their own passwords.
───────────────────────────────────────── */
const SALT = "itme-pw-v1";

async function getKey(uid: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(uid),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(plain: string, uid: string): Promise<string> {
  const key = await getKey(uid);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(encoded: string, uid: string): Promise<string> {
  try {
    const key = await getKey(uid);
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return encoded; // fallback nếu dữ liệu cũ chưa mã hoá
  }
}

/* ── Firestore collection ref ── */
function collRef(uid: string) {
  return collection(db, "users", uid, "passwords");
}
function docRef(uid: string, id: string) {
  return doc(db, "users", uid, "passwords", id);
}

/* ── Subscribe realtime ── */
export function subscribeCredentials(
  uid: string,
  callback: (items: Credential[]) => void
): () => void {
  const q = query(collRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, async (snap) => {
    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          username: data.username,
          password: await decryptText(data.password, uid),
          url: data.url,
          category: data.category,
          note: data.note,
          pinned: data.pinned ?? false,
          strength: data.strength ?? "medium",
          updatedAt: data.updatedAt ?? "",
        } as Credential;
      })
    );
    callback(items);
  });
}

/* ── Add ── */
export async function addCredential(
  uid: string,
  data: Omit<Credential, "id">
): Promise<string> {
  const encPw = await encryptText(data.password, uid);
  const ref = await addDoc(collRef(uid), {
    name: data.name,
    username: data.username,
    password: encPw,
    url: data.url ?? "",
    category: data.category,
    note: data.note ?? "",
    pinned: data.pinned ?? false,
    strength: data.strength ?? "medium",
    updatedAt: data.updatedAt ?? new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/* ── Update ── */
export async function updateCredential(
  uid: string,
  id: string,
  data: Partial<Omit<Credential, "id">>
): Promise<void> {
  const payload: Record<string, any> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.username !== undefined) payload.username = data.username;
  if (data.password !== undefined) {
    payload.password = await encryptText(data.password, uid);
  }
  if (data.url !== undefined) payload.url = data.url ?? "";
  if (data.category !== undefined) payload.category = data.category;
  if (data.note !== undefined) payload.note = data.note ?? "";
  if (data.pinned !== undefined) payload.pinned = data.pinned;
  if (data.strength !== undefined) payload.strength = data.strength;
  if (data.updatedAt !== undefined) payload.updatedAt = data.updatedAt;

  await updateDoc(docRef(uid, id), payload);
}

/* ── Delete ── */
export async function deleteCredential(uid: string, id: string): Promise<void> {
  await deleteDoc(docRef(uid, id));
}

/* ── Toggle pin ── */
export async function togglePinCredential(
  uid: string,
  id: string,
  pinned: boolean
): Promise<void> {
  await updateDoc(docRef(uid, id), { pinned });
}

/* ── Hash PIN ── */
export async function hashPin(pin: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(pin + "itme-pin-salt-v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
