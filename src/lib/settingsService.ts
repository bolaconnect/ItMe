import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { updateProfile as updateAuthProfile } from "firebase/auth";

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

export interface Setting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface BodyMetrics {
  height: number;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  waist: number;
  chest: number;
  hip: number;
  restingHR: number;
  updatedAt: string;
}

export interface UserSettingsData {
  profile?: UserProfile;
  metrics?: BodyMetrics;
  preferences?: Setting[];
  passwordPinHash?: string;
}

function userDocRef(uid: string) {
  return doc(db, "users", uid);
}

export function subscribeSettings(
  uid: string,
  callback: (data: UserSettingsData) => void
): () => void {
  return onSnapshot(userDocRef(uid), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserSettingsData);
    } else {
      callback({});
    }
  });
}

export async function updateSettings(uid: string, data: Partial<UserSettingsData>): Promise<void> {
  await setDoc(userDocRef(uid), data, { merge: true });
}

export async function updateUserProfileAuth(displayName: string) {
  if (auth.currentUser) {
    await updateAuthProfile(auth.currentUser, { displayName });
  }
}
