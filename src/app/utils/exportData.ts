import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function exportAllUserData(uid: string): Promise<void> {
  try {
    const backupData: Record<string, any> = {};

    // 1. Fetch user settings (document)
    const settingsDocRef = doc(db, "users", uid);
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
      backupData["settings"] = settingsSnap.data();
    } else {
      backupData["settings"] = {};
    }

    // 2. Fetch all subcollections
    const collectionsToExport = [
      "tasks",
      "habits",
      "events",
      "goals",
      "notes",
      "passwords",
      "finance_income",
      "finance_expense",
      "finance_assets",
      "finance_liabilities",
      "finance_investments",
      "finance_insurance",
      "finance_goals"
    ];

    for (const colName of collectionsToExport) {
      const colRef = collection(db, "users", uid, colName);
      const snap = await getDocs(colRef);
      backupData[colName] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    }

    // Convert server timestamps or Firestore Timestamps to readable dates/ISO strings
    const serializedData = JSON.stringify(backupData, (key, value) => {
      // If Firestore timestamp, convert to ISO string
      if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
        return new Date(value.seconds * 1000).toISOString();
      }
      return value;
    }, 2);

    // 3. Trigger browser download
    const blob = new Blob([serializedData], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const todayStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `ItMe_backup_${todayStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting user data from Firestore:", error);
    throw error;
  }
}
