/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db, auth } from "./firebase.ts";
import { firebaseSyncService } from "./firebaseSync.ts";

/**
 * 1. ASCOLTO IN TEMPO REALE (Transazioni)
 */
export function subscribeToTransactions(callback: (transactions: any[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  const colRef = collection(db, "users", uid, "transactions");
  const q = query(colRef, orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id
    }));
    callback(transactions);
  });
}

/**
 * 2. AGGIUNGI O MODIFICA TRANSAZIONE
 */
export async function saveTransaction({
  id,
  title,
  amount,
  type,
  category,
  note = "",
  date = new Date()
}: {
  id?: string;
  title: string;
  amount: number | string;
  type: string;
  category: string;
  note?: string;
  date?: string | Date;
}) {
  const isIncome = String(type).toUpperCase() === 'INCOME';
  const parsedDate = date instanceof Date ? date : new Date(date);
  const isValidDate = !isNaN(parsedDate.getTime());
  const dateStr = isValidDate ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return await firebaseSyncService.saveTransaction({
    id: id ? id.toString() : Date.now().toString(),
    title: (title || '').trim(),
    description: (title || '').trim(),
    amount: parseFloat(String(amount)) || 0,
    type: isIncome ? 'income' : 'expense',
    category: category || 'Generale',
    note: note || '',
    location: note || '',
    date: dateStr,
    month: dateStr.substring(0, 7),
  });
}

/**
 * 3. ELIMINA TRANSAZIONE
 */
export async function deleteTransaction(id: string): Promise<void> {
  return await firebaseSyncService.deleteTransaction(id.toString());
}
