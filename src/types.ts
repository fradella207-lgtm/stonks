/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export type AppSyncState = 'synced' | 'syncing' | 'offline' | 'error';

export type TimeFilterPeriod = 'month' | 'year' | 'all';

export type ThemeMode = 'dark' | 'black' | 'light';

export interface Transaction {
  id: string;            // Unique UUID
  date: string;          // ISO format (YYYY-MM-DD)
  type: TransactionType; // 'income' | 'expense'
  description: string;   // Explanatory text / title
  amount: number;        // Numeric decimal value forced with dot
  month: string;         // Period format (YYYY-MM)
  category?: string;     // Category tag (e.g. Spesa, Ristorante, Stipendio...)
  location?: string;     // Optional place/store name (e.g. "Esselunga", "Roma Centro")
  receiptImage?: string; // Optional receipt photo/attachment (base64/data URL)
  syncStatus?: SyncStatus;
}

export interface QueueItem {
  id: string;
  action: 'insert' | 'delete';
  transaction: Transaction;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface AppConfig {
  scriptUrl: string;
  autoSync: boolean;
  lastSyncTimestamp: number | null;
  theme?: ThemeMode;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
