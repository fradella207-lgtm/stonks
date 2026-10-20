import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebaseConfig";

/**
 * 1. ACCESSO CON GOOGLE
 * Apre il popup di login Google e sincronizza il profilo utente su users/{userId}
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await syncUserProfile(user);
  return user;
}

/**
 * 2. ACCESSO CON EMAIL E PASSWORD
 */
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * 3. REGISTRAZIONE CON CONFERMA ACCOUNT (Email Verification)
 * Crea l'account, invia l'email di verifica e predispone il profilo utente su Firestore.
 */
export async function registerWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  
  // Invia email di conferma account
  try {
    await sendEmailVerification(user);
  } catch (err) {
    console.warn("Invio email verifica:", err);
  }
  
  // Salva il documento profilo
  await setDoc(doc(db, "users", user.uid), {
    userId: user.uid,
    email: user.email,
    displayName: displayName || user.email.split("@")[0] || "Utente",
    photoUrl: user.photoURL || "",
    budgetLimit: 500.0,
    themeMode: "SYSTEM",
    appLanguage: "IT",
    isEmailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return user;
}

/**
 * 4. DIMENTICA PASSWORD (Reset Email)
 * Invia l'email per reimpostare la password dimenticata
 */
export async function resetPassword(email) {
  if (!email || !email.trim()) {
    throw new Error("Inserisci un indirizzo email valido.");
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * 5. LOGOUT
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * 6. ASCOLTO STATO AUTENTICAZIONE
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Helper per aggiornare/creare il profilo su Firestore in formato Android 1:1
 */
export async function syncUserProfile(user) {
  if (!user || !user.uid) return;
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    userId: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Utente",
    photoUrl: user.photoURL || "",
    budgetLimit: 500.0,
    themeMode: "SYSTEM",
    appLanguage: "IT",
    isEmailVerified: Boolean(user.emailVerified),
    updatedAt: serverTimestamp()
  }, { merge: true });
}
