/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, QueueItem, SyncStatus, ThemeMode, Transaction } from '../types.ts';

const STORAGE_KEYS = {
  TRANSACTIONS: 'stonks_transactions_v2',
  LEGACY_TRANSACTIONS: 'gs_nothing_transactions_v1',
  QUEUE: 'stonks_sync_queue_v2',
  CONFIG: 'stonks_config_v2',
  THEME: 'stonks_theme_mode',
  CUSTOM_CATEGORIES: 'stonks_custom_categories_v1',
};

// Generate a valid UUID v4 fallback
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Convert any date format to ISO YYYY-MM-DD
export function sanitizeDate(rawDate?: string | Date | null): string {
  if (!rawDate) {
    return new Date().toISOString().split('T')[0];
  }
  if (rawDate instanceof Date) {
    return rawDate.toISOString().split('T')[0];
  }
  const str = String(rawDate).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const itMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (itMatch) {
    const day = itMatch[1].padStart(2, '0');
    const month = itMatch[2].padStart(2, '0');
    const year = itMatch[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

// Sanitize amount: replaces commas with dots, strips currency signs, ensures positive decimal
export function sanitizeAmount(rawAmount: string | number): number {
  if (typeof rawAmount === 'number') {
    return Math.round(Math.abs(rawAmount) * 100) / 100;
  }
  if (!rawAmount) return 0;
  const cleanStr = String(rawAmount)
    .replace(/[€$£\s]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : Math.round(Math.abs(parsed) * 100) / 100;
}

// Extract month in YYYY-MM format from ISO date
export function extractMonth(isoDate: string): string {
  if (isoDate && isoDate.length >= 7) {
    return isoDate.substring(0, 7);
  }
  return new Date().toISOString().substring(0, 7);
}

// Initial clean seed data to showcase the app on first run
function getInitialSeedData(): Transaction[] {
  const currentMonth = extractMonth(new Date().toISOString());
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const d1 = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1)).toISOString().split('T')[0];
  const d2 = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3)).toISOString().split('T')[0];
  const d3 = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 5)).toISOString().split('T')[0];

  return [
    {
      id: generateUUID(),
      date: d3,
      type: 'income',
      description: 'Stipendio Mensile',
      category: 'Lavoro',
      location: 'Azienda',
      amount: 2450.00,
      month: currentMonth,
      syncStatus: 'synced',
    },
    {
      id: generateUUID(),
      date: d2,
      type: 'expense',
      description: 'Affitto Appartamento',
      category: 'Casa',
      location: 'Bonifico',
      amount: 720.00,
      month: currentMonth,
      syncStatus: 'synced',
    },
    {
      id: generateUUID(),
      date: d1,
      type: 'expense',
      description: 'Spesa Esselunga',
      category: 'Spesa',
      location: 'Esselunga Milano',
      amount: 84.50,
      month: currentMonth,
      syncStatus: 'synced',
    },
    {
      id: generateUUID(),
      date: today,
      type: 'expense',
      description: 'Caffè e Pranzo',
      category: 'Ristorante',
      location: 'Bar Centrale',
      amount: 14.80,
      month: currentMonth,
      syncStatus: 'synced',
    },
  ];
}

// Update an existing transaction locally (0ms latency)
export function updateTransactionLocal(updatedTx: Transaction): Transaction {
  const existing = getStoredTransactions();
  const dateIso = sanitizeDate(updatedTx.date);
  const amount = sanitizeAmount(updatedTx.amount);
  const month = extractMonth(dateIso);

  const cleanTx: Transaction = {
    ...updatedTx,
    date: dateIso,
    amount,
    month,
    description: (updatedTx.description || '').trim() || (updatedTx.type === 'income' ? 'Entrata' : 'Uscita'),
  };

  const idx = existing.findIndex((t) => t.id === cleanTx.id);
  if (idx >= 0) {
    existing[idx] = cleanTx;
    saveTransactionsList(existing);
  } else {
    existing.unshift(cleanTx);
    saveTransactionsList(existing);
  }

  return cleanTx;
}

// Read all stored transactions
export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: item.id || generateUUID(),
        date: sanitizeDate(item.date),
        type: item.type === 'income' ? 'income' : 'expense',
        description: String(item.description || 'Senza descrizione').trim(),
        amount: sanitizeAmount(item.amount),
        month: item.month || extractMonth(sanitizeDate(item.date)),
        category: item.category || '',
        location: item.location || '',
        receiptImage: item.receiptImage || '',
        syncStatus: item.syncStatus || 'synced',
      }));
    }
    return [];
  } catch (err) {
    console.error('Errore lettura transazioni locali:', err);
    return [];
  }
}

// Save transactions list
export function saveTransactionsList(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Errore salvataggio transazioni locali:', err);
  }
}

// Add a transaction locally (0ms latency) and queue for background sync
export function addTransactionLocal(raw: {
  id?: string;
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: number | string;
  category?: string;
  location?: string;
  receiptImage?: string;
  month?: string;
}): { transaction: Transaction; queueItem: QueueItem } {
  const dateIso = sanitizeDate(raw.date);
  const amount = sanitizeAmount(raw.amount);
  const month = raw.month || extractMonth(dateIso);
  const id = raw.id || generateUUID();

  const transaction: Transaction = {
    id,
    date: dateIso,
    type: raw.type,
    description: (raw.description || '').trim() || (raw.type === 'income' ? 'Entrata' : 'Uscita'),
    amount,
    month,
    category: raw.category || '',
    location: raw.location || '',
    receiptImage: raw.receiptImage || '',
    syncStatus: 'pending',
  };

  // 1. Update local transactions immediately
  const existing = getStoredTransactions();
  const updated = [transaction, ...existing];
  saveTransactionsList(updated);

  // 2. Add to sync queue
  const queueItem: QueueItem = {
    id: generateUUID(),
    action: 'insert',
    transaction,
    timestamp: Date.now(),
    attempts: 0,
  };

  const currentQueue = getStoredQueue();
  currentQueue.push(queueItem);
  saveStoredQueue(currentQueue);

  return { transaction, queueItem };
}

// Delete a transaction locally (0ms latency)
export function deleteTransactionLocal(id: string): QueueItem | null {
  const existing = getStoredTransactions();
  const target = existing.find((t) => t.id === id);
  if (!target) return null;

  // 1. Remove from local list immediately
  const updated = existing.filter((t) => t.id !== id);
  saveTransactionsList(updated);

  // 2. Update queue
  const currentQueue = getStoredQueue();
  const pendingInsertIdx = currentQueue.findIndex(
    (q) => q.action === 'insert' && q.transaction.id === id
  );

  let queueItem: QueueItem;
  if (pendingInsertIdx >= 0) {
    currentQueue.splice(pendingInsertIdx, 1);
    saveStoredQueue(currentQueue);
    return null;
  } else {
    queueItem = {
      id: generateUUID(),
      action: 'delete',
      transaction: target,
      timestamp: Date.now(),
      attempts: 0,
    };
    currentQueue.push(queueItem);
    saveStoredQueue(currentQueue);
    return queueItem;
  }
}

// Queue accessors
export function getStoredQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch (err) {
    console.error('Errore lettura coda:', err);
    return [];
  }
}

export function saveStoredQueue(queue: QueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Errore salvataggio coda:', err);
  }
}

export function removeQueueItem(queueItemId: string): void {
  const q = getStoredQueue().filter((item) => item.id !== queueItemId);
  saveStoredQueue(q);
}

// Theme storage
export function getStoredTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(STORAGE_KEYS.THEME);
    if (t === 'black' || t === 'light' || t === 'dark') {
      return t;
    }
  } catch {}
  return 'dark';
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}

// Custom categories storage
export function getStoredCustomCategories(): { expense: string[]; income: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.expense) && Array.isArray(parsed.income)) {
        return parsed;
      }
    }
  } catch {}
  return {
    expense: ['Spesa', 'Ristorante', 'Trasporti', 'Casa', 'Bollette', 'Svago', 'Salute', 'Shopping', 'Altro'],
    income: ['Stipendio', 'Bonifico', 'Investimenti', 'Rimborso', 'Vendita', 'Bonus', 'Altro'],
  };
}

export function saveStoredCustomCategories(cats: { expense: string[]; income: string[] }): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
  } catch {}
}

// Clear all data
export function clearAllLocalTransactions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.QUEUE);
  } catch {}
}
