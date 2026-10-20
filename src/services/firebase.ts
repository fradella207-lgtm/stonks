/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.ts';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Primary Firestore instance: connects to (default) database, exactly 1:1 with Android app
export const defaultDb = getFirestore(app);

// Secondary named database instance (if provisioned in AI Studio)
let secondaryDbInstance: any = null;
try {
  secondaryDbInstance = getFirestore(app, 'ai-studio-gestionespese-08ea9aff-fba0-474b-a22f-690b78028957');
} catch (e) {
  console.warn('Named Firestore database not accessible:', e);
}
export const namedDb = secondaryDbInstance;

// Primary db used across the application
export const db = defaultDb;
export { firebaseConfig };
export default app;
