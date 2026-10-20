/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "./firebase.ts";
import { firebaseSyncService, syncUserProfile as syncUserProfileBase } from "./firebaseSync.ts";

/**
 * 1. ACCESSO CON GOOGLE
 * Apre il popup Google e sincronizza il profilo utente su users/{userId}
 */
export async function loginWithGoogle() {
  return await firebaseSyncService.loginWithGoogle();
}

/**
 * 2. ACCESSO CON EMAIL E PASSWORD
 */
export async function loginWithEmail(email: string, pass: string) {
  return await firebaseSyncService.loginWithEmail(email, pass);
}

/**
 * 3. REGISTRAZIONE CON CONFERMA ACCOUNT (Email Verification)
 */
export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  return await firebaseSyncService.registerWithEmail(email, pass, displayName);
}

/**
 * 4. DIMENTICA PASSWORD (Reset Email)
 */
export async function resetPassword(email: string): Promise<void> {
  return await firebaseSyncService.sendPasswordReset(email);
}

/**
 * 5. LOGOUT
 */
export async function logoutUser(): Promise<void> {
  return await firebaseSyncService.logout();
}

/**
 * 6. ASCOLTO STATO AUTH
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Helper per aggiornare/creare il profilo su Firestore al primo accesso
 */
export async function syncUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}) {
  return await syncUserProfileBase(user);
}
