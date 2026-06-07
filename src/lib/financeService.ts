import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  IncomeItem, ExpenseItem, Asset, Liability,
  Investment, Insurance, Goal,
} from "../app/components/finance/financeStore";

/* ── Helpers ── */
type CollName = "income" | "expense" | "assets" | "liabilities" | "investments" | "insurance" | "goals";

function collRef(uid: string, coll: CollName) {
  return collection(db, "users", uid, "finance_" + coll);
}
function docRef(uid: string, coll: CollName, id: string) {
  return doc(db, "users", uid, "finance_" + coll, id);
}

/* ── Generic subscribe ── */
function makeSubscribe<T>(coll: CollName) {
  return function subscribe(
    uid: string,
    callback: (items: (T & { id: string })[]) => void
  ): () => void {
    const q = query(collRef(uid, coll), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<T & { id: string }, "id">),
      })) as (T & { id: string })[];
      callback(items);
    });
  };
}

/* ── Generic add ── */
function makeAdd<T>(coll: CollName) {
  return async function add(uid: string, item: Omit<T, "id">): Promise<string> {
    const ref = await addDoc(collRef(uid, coll), { ...item, createdAt: serverTimestamp() });
    return ref.id;
  };
}

/* ── Generic update ── */
function makeUpdate<T>(coll: CollName) {
  return async function update(uid: string, id: string, data: Partial<Omit<T, "id">>): Promise<void> {
    await updateDoc(docRef(uid, coll, id), data as any);
  };
}

/* ── Generic delete ── */
function makeDelete(coll: CollName) {
  return async function remove(uid: string, id: string): Promise<void> {
    await deleteDoc(docRef(uid, coll, id));
  };
}

/* ── Exported API ── */
// Using string IDs from Firestore
export type FinItem<T> = Omit<T, "id"> & { id: string };

export const subscribeIncome     = makeSubscribe<IncomeItem>("income");
export const subscribeExpense    = makeSubscribe<ExpenseItem>("expense");
export const subscribeAssets     = makeSubscribe<Asset>("assets");
export const subscribeLiabilities = makeSubscribe<Liability>("liabilities");
export const subscribeInvestments = makeSubscribe<Investment>("investments");
export const subscribeInsurance  = makeSubscribe<Insurance>("insurance");
export const subscribeGoals      = makeSubscribe<Goal>("goals");

export const addIncome       = makeAdd<IncomeItem>("income");
export const addExpense      = makeAdd<ExpenseItem>("expense");
export const addAsset        = makeAdd<Asset>("assets");
export const addLiability    = makeAdd<Liability>("liabilities");
export const addInvestment   = makeAdd<Investment>("investments");
export const addInsuranceItem = makeAdd<Insurance>("insurance");
export const addGoal         = makeAdd<Goal>("goals");

export const updateIncome       = makeUpdate<IncomeItem>("income");
export const updateExpense      = makeUpdate<ExpenseItem>("expense");
export const updateAsset        = makeUpdate<Asset>("assets");
export const updateLiability    = makeUpdate<Liability>("liabilities");
export const updateInvestment   = makeUpdate<Investment>("investments");
export const updateInsuranceItem = makeUpdate<Insurance>("insurance");
export const updateGoal         = makeUpdate<Goal>("goals");

export const deleteIncome       = makeDelete("income");
export const deleteExpense      = makeDelete("expense");
export const deleteAsset        = makeDelete("assets");
export const deleteLiability    = makeDelete("liabilities");
export const deleteInvestment   = makeDelete("investments");
export const deleteInsuranceItem = makeDelete("insurance");
export const deleteGoal         = makeDelete("goals");
