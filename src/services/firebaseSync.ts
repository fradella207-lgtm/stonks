/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as fbSignOut,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  User,
} from 'firebase/auth';
import { auth, db, googleProvider } from './firebase.ts';
import { Transaction, UserProfile } from '../types.ts';
import {
  getStoredTransactions,
  saveTransactionsList,
  sanitizeDate,
  sanitizeAmount,
  extractMonth,
} from './storage.ts';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

type AuthListener = (user: UserProfile | null, isReady: boolean) => void;
type CloudSyncListener = (status: 'synced' | 'syncing' | 'error' | 'offline') => void;

/**
 * Synchronizes or creates the user profile document in Firestore: users/{userId}
 * Exactly matches the Android app schema.
 */
export async function syncUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Utente',
        photoUrl: user.photoURL || '',
        budgetLimit: 500.0,
        themeMode: 'SYSTEM',
        appLanguage: 'IT',
        isEmailVerified: Boolean(user.emailVerified),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('syncUserProfile error:', e);
  }
}

class FirebaseSyncService {
  private authListeners: Set<AuthListener> = new Set();
  private syncListeners: Set<CloudSyncListener> = new Set();
  private currentUser: UserProfile | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private syncStatus: 'synced' | 'syncing' | 'error' | 'offline' = 'synced';
  private isAuthReady: boolean = false;

  constructor() {
    // 1. Immediately restore cached session so there is never a flash of login screen
    try {
      const cached = localStorage.getItem('stonks_auth_cached_user_v2');
      if (cached) {
        this.currentUser = JSON.parse(cached);
        if (this.currentUser?.uid) {
          this.subscribeToUserFirestore(this.currentUser.uid);
        }
      }
    } catch (e) {
      console.warn('Failed to restore cached user session:', e);
    }

    // 2. Ensure Firebase browser local persistence is strictly active
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase setPersistence warning:', err);
    });

    // 3. Keep real-time sync with Firebase Auth state
    onAuthStateChanged(auth, async (user: User | null) => {
      this.isAuthReady = true;
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || (user.isAnonymous ? 'Ospite Locale' : 'Utente'),
          photoURL: user.photoURL,
          emailVerified: user.emailVerified ?? false,
        };
        try {
          localStorage.setItem('stonks_auth_cached_user_v2', JSON.stringify(this.currentUser));
        } catch (e) {
          // ignore quota issues
        }

        // Keep profile in sync
        if (!user.isAnonymous) {
          syncUserProfile(user).catch(() => {});
        }

        this.subscribeToUserFirestore(user.uid);
      } else {
        this.currentUser = null;
        localStorage.removeItem('stonks_auth_cached_user_v2');
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
      }
      this.notifyAuth();
    });
  }

  public subscribeAuth(listener: AuthListener): () => void {
    this.authListeners.add(listener);
    listener(this.currentUser, this.isAuthReady);
    return () => {
      this.authListeners.delete(listener);
    };
  }

  public subscribeSync(listener: CloudSyncListener): () => void {
    this.syncListeners.add(listener);
    listener(this.syncStatus);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifyAuth() {
    for (const l of this.authListeners) {
      l(this.currentUser, this.isAuthReady);
    }
  }

  private notifySync(status: 'synced' | 'syncing' | 'error' | 'offline') {
    this.syncStatus = status;
    for (const l of this.syncListeners) {
      l(this.syncStatus);
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getIsAuthReady(): boolean {
    return this.isAuthReady;
  }

  // 1. Google Login via popup + automatic sync with users/{userId}
  public async loginWithGoogle(): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;
      const isNewUser = getAdditionalUserInfo(res)?.isNewUser ?? false;

      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || 'Utente Google',
        photoURL: u.photoURL,
        emailVerified: u.emailVerified ?? true,
      };
      this.currentUser = profile;
      this.notifyAuth();

      // Sincronizza o crea il profilo utente su Firestore (users/{userId})
      await syncUserProfile(u);

      if (isNewUser) {
        // A brand new account starts completely clean
        saveTransactionsList([]);
        localStorage.setItem('stonks_new_account_welcome_banner', 'true');
      }

      this.subscribeToUserFirestore(u.uid);
      this.notifySync('synced');
      return profile;
    } catch (err: any) {
      console.error('Login error:', err);
      this.notifySync('error');
      throw err;
    }
  }

  // 2. Register with Email, Password & Email Verification
  public async registerWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const u = res.user;

      if (name && u) {
        await updateProfile(u, { displayName: name });
      }

      // Automatically trigger email verification for new account
      try {
        await sendEmailVerification(u);
      } catch (verifErr) {
        console.warn('Could not auto-send verification email:', verifErr);
      }

      // Salva il documento profilo utente su users/{userId}
      await setDoc(
        doc(db, 'users', u.uid),
        {
          userId: u.uid,
          email: u.email,
          displayName: name || u.email?.split('@')[0] || 'Utente',
          photoUrl: u.photoURL || '',
          budgetLimit: 500.0,
          themeMode: 'SYSTEM',
          appLanguage: 'IT',
          isEmailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: name || u.email?.split('@')[0] || 'Utente',
        photoURL: u.photoURL,
        emailVerified: u.emailVerified ?? false,
      };
      this.currentUser = profile;
      this.notifyAuth();

      saveTransactionsList([]);
      localStorage.setItem('stonks_new_account_welcome_banner', 'true');

      this.subscribeToUserFirestore(u.uid);
      this.notifySync('synced');
      return profile;
    } catch (err: any) {
      console.error('Email registration error:', err);
      this.notifySync('error');
      throw err;
    }
  }

  // 3. Login with Email & Password
  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const u = res.user;

      // Sync user profile
      await syncUserProfile(u);

      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0] || 'Utente',
        photoURL: u.photoURL,
        emailVerified: u.emailVerified ?? false,
      };
      this.currentUser = profile;
      this.notifyAuth();

      this.subscribeToUserFirestore(u.uid);
      this.notifySync('synced');
      return profile;
    } catch (err: any) {
      console.error('Email login error:', err);
      this.notifySync('error');
      throw err;
    }
  }

  // 4. Send Password Reset Email
  public async sendPasswordReset(email: string): Promise<void> {
    if (!email || !email.trim()) {
      throw new Error('Inserisci un indirizzo email valido.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  }

  // Resend Email Verification to currently logged-in user
  public async sendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Nessun utente autenticato.');
    }
    await sendEmailVerification(auth.currentUser);
  }

  // Reload current user state (e.g. after clicking verification email link)
  public async reloadCurrentUser(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    const u = auth.currentUser;
    const profile: UserProfile = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || (u.isAnonymous ? 'Ospite Locale' : 'Utente'),
      photoURL: u.photoURL,
      emailVerified: u.emailVerified ?? false,
    };
    this.currentUser = profile;
    try {
      localStorage.setItem('stonks_auth_cached_user_v2', JSON.stringify(profile));
    } catch (e) {}
    await syncUserProfile(u);
    this.notifyAuth();
    return profile;
  }

  // Anonymous Guest Login
  public async loginAsGuest(): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await signInAnonymously(auth);
      const u = res.user;
      const profile: UserProfile = {
        uid: u.uid,
        email: null,
        displayName: 'Ospite (Offline-First)',
        photoURL: null,
        emailVerified: true,
      };
      this.currentUser = profile;
      this.notifyAuth();
      this.notifySync('synced');
      return profile;
    } catch (err: any) {
      console.error('Guest login error:', err);
      this.notifySync('error');
      throw err;
    }
  }

  public async logout(): Promise<void> {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    localStorage.removeItem('stonks_auth_cached_user_v2');
    await fbSignOut(auth);
    this.currentUser = null;
    this.notifyAuth();
    this.notifySync('synced');
  }

  // Real-time Firestore sync listener for users/{uid}/transactions
  private subscribeToUserFirestore(uid: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    const path = `users/${uid}/transactions`;
    try {
      const colRef = collection(db, 'users', uid, 'transactions');

      this.unsubscribeFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const rawType = String(data.type || '').toUpperCase();
            const isIncome = rawType === 'INCOME' || String(data.type).toLowerCase() === 'income';

            let dateStr = data.date;
            if (!dateStr && data.timestamp?.toDate) {
              try {
                dateStr = data.timestamp.toDate().toISOString().split('T')[0];
              } catch (e) {}
            }
            if (!dateStr) {
              dateStr = new Date().toISOString().split('T')[0];
            }
            dateStr = sanitizeDate(dateStr);

            const desc = data.title || data.description || 'Senza causale';
            const loc = data.note || data.location || '';
            const amt = sanitizeAmount(data.amount);

            remoteList.push({
              id: docSnap.id,
              userId: data.userId || uid,
              title: desc,
              description: desc,
              amount: amt,
              type: isIncome ? 'income' : 'expense',
              category: data.category || 'Generale',
              note: loc,
              location: loc,
              isRecurring: Boolean(data.isRecurring ?? false),
              date: dateStr,
              month: data.month || extractMonth(dateStr),
              receiptImage: data.receiptImage || '',
              syncStatus: 'synced',
            });
          });

          // Sort by date / timestamp descending
          remoteList.sort((a, b) => {
            const tA = new Date(a.date).getTime() || 0;
            const tB = new Date(b.date).getTime() || 0;
            return tB - tA;
          });

          // Update local cache with remote transactions
          saveTransactionsList(remoteList);
          this.notifySync('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          this.notifySync('error');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      this.notifySync('error');
    }
  }

  // Save transaction to Firestore in background: users/{userId}/transactions/{transId}
  public async saveTransaction(tx: Transaction): Promise<void> {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const transId = tx.id ? tx.id.toString() : Date.now().toString();
    const path = `users/${uid}/transactions/${transId}`;

    try {
      this.notifySync('syncing');
      const docRef = doc(db, 'users', uid, 'transactions', transId);
      const isIncome = tx.type === 'income' || (tx as any).type === 'INCOME';
      const desc = (tx.title || tx.description || '').trim();
      const loc = (tx.note || tx.location || '').trim();
      const amt = parseFloat(String(tx.amount || 0));
      const dateStr = tx.date || new Date().toISOString().split('T')[0];
      const dateObj = new Date(dateStr);

      const payload: any = {
        id: transId,
        userId: uid,
        title: desc,
        description: desc,
        amount: isNaN(amt) ? 0 : amt,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category: tx.category || 'Generale',
        note: loc,
        location: loc,
        isRecurring: Boolean(tx.isRecurring ?? false),
        date: dateStr,
        month: tx.month || extractMonth(dateStr),
        timestamp: Timestamp.fromDate(isNaN(dateObj.getTime()) ? new Date() : dateObj),
        updatedAt: serverTimestamp(),
      };

      if (!tx.id) {
        payload.createdAt = serverTimestamp();
      }

      if (tx.receiptImage) {
        payload.receiptImage = tx.receiptImage;
      }

      await setDoc(docRef, payload, { merge: true });
      this.notifySync('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      this.notifySync('error');
    }
  }

  // Delete transaction from Firestore in background: users/{userId}/transactions/{id}
  public async deleteTransaction(id: string): Promise<void> {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const transId = id.toString();
    const path = `users/${uid}/transactions/${transId}`;

    try {
      this.notifySync('syncing');
      const docRef = doc(db, 'users', uid, 'transactions', transId);
      await deleteDoc(docRef);
      this.notifySync('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      this.notifySync('error');
    }
  }

  // Batch import multiple transactions
  public async batchImport(transactions: Transaction[]): Promise<number> {
    if (!this.currentUser) return 0;
    const uid = this.currentUser.uid;
    const path = `users/${uid}/transactions`;

    try {
      this.notifySync('syncing');
      const batch = writeBatch(db);
      for (const tx of transactions) {
        const transId = tx.id ? tx.id.toString() : Date.now().toString();
        const docRef = doc(db, 'users', uid, 'transactions', transId);
        const isIncome = tx.type === 'income' || (tx as any).type === 'INCOME';
        const desc = (tx.title || tx.description || '').trim();
        const loc = (tx.note || tx.location || '').trim();
        const amt = parseFloat(String(tx.amount || 0));
        const dateStr = tx.date || new Date().toISOString().split('T')[0];
        const dateObj = new Date(dateStr);

        batch.set(
          docRef,
          {
            id: transId,
            userId: uid,
            title: desc,
            description: desc,
            amount: isNaN(amt) ? 0 : amt,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            category: tx.category || 'Generale',
            note: loc,
            location: loc,
            isRecurring: Boolean(tx.isRecurring ?? false),
            date: dateStr,
            month: tx.month || extractMonth(dateStr),
            timestamp: Timestamp.fromDate(isNaN(dateObj.getTime()) ? new Date() : dateObj),
            updatedAt: serverTimestamp(),
            ...(tx.receiptImage ? { receiptImage: tx.receiptImage } : {}),
          },
          { merge: true }
        );
      }
      await batch.commit();
      this.notifySync('synced');
      return transactions.length;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      this.notifySync('error');
      throw err;
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();

// Standalone functions matching user's requested API snippets:
export async function loginWithGoogle() {
  return firebaseSyncService.loginWithGoogle();
}

export async function loginWithEmail(email: string, pass: string) {
  return firebaseSyncService.loginWithEmail(email, pass);
}

export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  return firebaseSyncService.registerWithEmail(email, pass, displayName);
}

export async function resetPassword(email: string) {
  return firebaseSyncService.sendPasswordReset(email);
}

export function subscribeToTransactions(callback: (txs: Transaction[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  const colRef = collection(db, 'users', uid, 'transactions');
  return onSnapshot(colRef, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawType = String(data.type || '').toUpperCase();
      const isIncome = rawType === 'INCOME' || String(data.type).toLowerCase() === 'income';

      let dateStr = data.date;
      if (!dateStr && data.timestamp?.toDate) {
        try {
          dateStr = data.timestamp.toDate().toISOString().split('T')[0];
        } catch (e) {}
      }
      if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
      }
      dateStr = sanitizeDate(dateStr);

      const desc = data.title || data.description || 'Senza causale';
      const loc = data.note || data.location || '';
      const amt = sanitizeAmount(data.amount);

      list.push({
        id: docSnap.id,
        userId: data.userId || uid,
        title: desc,
        description: desc,
        amount: amt,
        type: isIncome ? 'income' : 'expense',
        category: data.category || 'Generale',
        note: loc,
        location: loc,
        isRecurring: Boolean(data.isRecurring ?? false),
        date: dateStr,
        month: data.month || extractMonth(dateStr),
        receiptImage: data.receiptImage || '',
        syncStatus: 'synced',
      });
    });

    list.sort((a, b) => {
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      return tB - tA;
    });

    callback(list);
  });
}

export async function saveTransaction(params: {
  id?: string;
  title: string;
  amount: number | string;
  type: 'EXPENSE' | 'INCOME' | 'income' | 'expense';
  category: string;
  note?: string;
  date?: string | Date;
}) {
  const isIncome = String(params.type).toUpperCase() === 'INCOME';
  const dateStr =
    params.date instanceof Date
      ? params.date.toISOString().split('T')[0]
      : params.date || new Date().toISOString().split('T')[0];

  return firebaseSyncService.saveTransaction({
    id: params.id || Date.now().toString(),
    title: params.title,
    description: params.title,
    amount: parseFloat(String(params.amount || 0)),
    type: isIncome ? 'income' : 'expense',
    category: params.category,
    note: params.note || '',
    location: params.note || '',
    date: dateStr,
    month: extractMonth(dateStr),
  });
}

export async function deleteTransaction(transId: string | number) {
  return firebaseSyncService.deleteTransaction(transId.toString());
}
