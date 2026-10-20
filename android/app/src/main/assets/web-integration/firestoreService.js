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
import { db, auth } from "./firebaseConfig";

/**
 * 1. ASCOLTO IN TEMPO REALE (Transazioni)
 * Riceve istantaneamente tutte le transazioni dell'utente, sincronizzate con Android.
 */
export function subscribeToTransactions(callback) {
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
 * Struttura conforme al 100% all'app Android e alle firestore.rules
 */
export async function saveTransaction({ id, title, amount, type, category, note = "", date = new Date() }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Utente non autenticato");

  // Genera ID se nuova transazione
  const transId = id ? id.toString() : Date.now().toString();
  const docRef = doc(db, "users", uid, "transactions", transId);

  const parsedDate = date instanceof Date ? date : new Date(date);
  const isValidDate = !isNaN(parsedDate.getTime());
  const dateStr = isValidDate ? parsedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

  const payload = {
    id: transId,
    userId: uid,
    title: (title || "").trim(),
    amount: parseFloat(amount) || 0,
    type: String(type).toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE",
    category: category || "Generale",
    note: note || "",
    isRecurring: false,
    date: dateStr,
    timestamp: Timestamp.fromDate(isValidDate ? parsedDate : new Date()),
    updatedAt: serverTimestamp()
  };

  if (!id) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * 3. ELIMINA TRANSAZIONE
 */
export async function deleteTransaction(id) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Utente non autenticato");

  const docRef = doc(db, "users", uid, "transactions", id.toString());
  await deleteDoc(docRef);
}
