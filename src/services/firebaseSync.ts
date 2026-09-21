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
  query,
  orderBy,
  writeBatch,
  getDocs,
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

type AuthListener = (user: UserProfile | null) => void;
type CloudSyncListener = (status: 'synced' | 'syncing' | 'error' | 'offline') => void;

class FirebaseSyncService {
  private authListeners: Set<AuthListener> = new Set();
  private syncListeners: Set<CloudSyncListener> = new Set();
  private currentUser: UserProfile | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private syncStatus: 'synced' | 'syncing' | 'error' | 'offline' = 'synced';

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || (user.isAnonymous ? 'Ospite Locale' : 'Utente'),
          photoURL: user.photoURL,
        };
        this.subscribeToUserFirestore(user.uid);
      } else {
        this.currentUser = null;
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
    listener(this.currentUser);
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
      l(this.currentUser);
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

  // Google Login via popup
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
      };
      this.currentUser = profile;
      this.notifyAuth();

      if (isNewUser) {
        // A brand new account starts completely clean without any dummy data
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

  // Register with Email & Password (prevents duplicate emails via Firebase Auth)
  public async registerWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const u = res.user;

      if (name && u) {
        await updateProfile(u, { displayName: name });
      }

      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: name || u.email?.split('@')[0] || 'Utente',
        photoURL: u.photoURL,
      };
      this.currentUser = profile;
      this.notifyAuth();

      // Newly registered accounts start completely empty with 0 transactions
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

  // Login with Email & Password
  public async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    try {
      this.notifySync('syncing');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const u = res.user;
      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0] || 'Utente',
        photoURL: u.photoURL,
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
    await fbSignOut(auth);
    this.currentUser = null;
    this.notifyAuth();
    this.notifySync('synced');
  }

  // Real-time Firestore sync listener
  private subscribeToUserFirestore(uid: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    const path = `users/${uid}/transactions`;
    try {
      const q = query(
        collection(db, 'users', uid, 'transactions'),
        orderBy('date', 'desc')
      );

      this.unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const remoteList: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteList.push({
              id: docSnap.id,
              date: sanitizeDate(data.date),
              type: data.type === 'income' ? 'income' : 'expense',
              description: String(data.description || ''),
              amount: sanitizeAmount(data.amount),
              month: data.month || extractMonth(data.date),
              category: data.category || '',
              location: data.location || '',
              receiptImage: data.receiptImage || '',
              syncStatus: 'synced',
            });
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

  // If newly signed-in user has no data in Firestore, copy current local transactions
  private async pushLocalToFirestoreIfEmpty(uid: string) {
    const path = `users/${uid}/transactions`;
    try {
      const colRef = collection(db, 'users', uid, 'transactions');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const local = getStoredTransactions();
        if (local.length > 0) {
          const batch = writeBatch(db);
          for (const tx of local) {
            const docRef = doc(db, 'users', uid, 'transactions', tx.id);
            batch.set(docRef, {
              date: tx.date,
              type: tx.type,
              description: tx.description,
              amount: tx.amount,
              month: tx.month,
              category: tx.category || '',
              location: tx.location || '',
              receiptImage: tx.receiptImage || '',
              createdAt: Date.now(),
            });
          }
          await batch.commit();
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Save transaction to Firestore in background (non-blocking)
  public async saveTransaction(tx: Transaction): Promise<void> {
    if (!this.currentUser) return;
    const path = `users/${this.currentUser.uid}/transactions/${tx.id}`;
    try {
      this.notifySync('syncing');
      const docRef = doc(db, 'users', this.currentUser.uid, 'transactions', tx.id);
      await setDoc(docRef, {
        date: tx.date,
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        month: tx.month,
        category: tx.category || '',
        location: tx.location || '',
        receiptImage: tx.receiptImage || '',
        updatedAt: Date.now(),
      });
      this.notifySync('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      this.notifySync('error');
    }
  }

  // Delete transaction from Firestore in background (non-blocking)
  public async deleteTransaction(id: string): Promise<void> {
    if (!this.currentUser) return;
    const path = `users/${this.currentUser.uid}/transactions/${id}`;
    try {
      this.notifySync('syncing');
      const docRef = doc(db, 'users', this.currentUser.uid, 'transactions', id);
      await deleteDoc(docRef);
      this.notifySync('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
      this.notifySync('error');
    }
  }

  // Batch import multiple transactions (e.g. from CSV or JSON)
  public async batchImport(transactions: Transaction[]): Promise<number> {
    if (!this.currentUser) return 0;
    const path = `users/${this.currentUser.uid}/transactions`;
    try {
      this.notifySync('syncing');
      const batch = writeBatch(db);
      for (const tx of transactions) {
        const docRef = doc(db, 'users', this.currentUser.uid, 'transactions', tx.id);
        batch.set(docRef, {
          date: tx.date,
          type: tx.type,
          description: tx.description,
          amount: tx.amount,
          month: tx.month,
          category: tx.category || '',
          location: tx.location || '',
          receiptImage: tx.receiptImage || '',
          updatedAt: Date.now(),
        });
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
