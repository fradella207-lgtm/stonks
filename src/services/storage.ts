/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, QueueItem, SyncStatus, ThemeMode, Transaction } from '../types.ts';
import { secureStorage } from './secureStorage.ts';
import { getDefaultCategories, localizeCategory, getStoredLanguage, SupportedLanguage } from './i18n.ts';

const STORAGE_KEYS = {
  TRANSACTIONS: 'stonks_transactions_v2',
  LEGACY_TRANSACTIONS: 'gs_nothing_transactions_v1',
  QUEUE: 'stonks_sync_queue_v2',
  CONFIG: 'stonks_config_v2',
  THEME: 'stonks_theme_mode',
  CUSTOM_CATEGORIES: 'stonks_custom_categories_v1',
  MONTHLY_BUDGET: 'stonks_monthly_budget_v1',
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

// Known legacy seed dummy transaction titles that should never appear for real users
const DUMMY_SEED_DESCRIPTIONS = new Set([
  'Stipendio Mensile',
  'Affitto Appartamento',
  'Spesa Esselunga',
  'Caffè e Pranzo',
]);

// Update an existing transaction locally (0ms latency)
export function updateTransactionLocal(updatedTx: Transaction): Transaction {
  const existing = getStoredTransactions();
  const dateIso = sanitizeDate(updatedTx.date);
  const amount = sanitizeAmount(updatedTx.amount);
  const month = extractMonth(dateIso);
  const cleanCategory = updatedTx.category ? localizeCategory(updatedTx.category) : '';
  const finalDesc = (updatedTx.description || '').trim() || cleanCategory || (updatedTx.type === 'income' ? 'Entrata' : 'Uscita');

  const cleanTx: Transaction = {
    ...updatedTx,
    date: dateIso,
    amount,
    month,
    category: cleanCategory,
    description: finalDesc,
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
    const raw = secureStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed
        .filter((item) => !DUMMY_SEED_DESCRIPTIONS.has(String(item.description || '').trim()))
        .map((item) => ({
          id: item.id || generateUUID(),
          date: sanitizeDate(item.date),
          type: item.type === 'income' ? ('income' as const) : ('expense' as const),
          description: String(item.description || 'Senza descrizione').trim(),
          amount: sanitizeAmount(item.amount),
          month: item.month || extractMonth(sanitizeDate(item.date)),
          category: item.category || '',
          location: item.location || '',
          receiptImage: item.receiptImage || '',
          syncStatus: item.syncStatus || 'synced',
        }));

      // If we filtered out dummy items, persist the cleaned list immediately
      if (sanitized.length !== parsed.length) {
        secureStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sanitized));
      }

      return sanitized;
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
    secureStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
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
  const cleanCategory = raw.category ? localizeCategory(raw.category) : '';
  const finalDesc = (raw.description || '').trim() || cleanCategory || (raw.type === 'income' ? 'Entrata' : 'Uscita');

  const transaction: Transaction = {
    id,
    date: dateIso,
    type: raw.type,
    description: finalDesc,
    amount,
    month,
    category: cleanCategory,
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
    const raw = secureStorage.getItem(STORAGE_KEYS.QUEUE);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch (err) {
    console.error('Errore lettura coda:', err);
    return [];
  }
}

export function saveStoredQueue(queue: QueueItem[]): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
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
    const t = secureStorage.getItem(STORAGE_KEYS.THEME);
    if (t === 'black' || t === 'light' || t === 'dark') {
      return t;
    }
  } catch {}
  return 'dark';
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}

// Custom categories storage with multi-language synchronization
export function getStoredCustomCategories(lang?: SupportedLanguage): { expense: string[]; income: string[] } {
  const currentLang = lang || getStoredLanguage();
  const defaultCats = getDefaultCategories(currentLang);

  try {
    const raw = secureStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.expense) && Array.isArray(parsed.income)) {
        // Check if legacy English defaults
        const isLegacyEnglish =
          parsed.expense.includes('Groceries') &&
          parsed.expense.includes('Dining Out') &&
          parsed.income.includes('Salary');

        if (isLegacyEnglish && currentLang !== 'en') {
          return defaultCats;
        }

        // Localize standard category names to current language and keep user custom categories intact
        const localizedExpense = parsed.expense.map((c: string) => localizeCategory(c, currentLang));
        const localizedIncome = parsed.income.map((c: string) => localizeCategory(c, currentLang));

        return {
          expense: Array.from(new Set(localizedExpense)),
          income: Array.from(new Set(localizedIncome)),
        };
      }
    }
  } catch {}

  return defaultCats;
}

export function saveStoredCustomCategories(cats: { expense: string[]; income: string[] }): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
  } catch {}
}

// Monthly Spending Limit Budget storage
export function getStoredMonthlyBudget(): number {
  try {
    const val = secureStorage.getItem(STORAGE_KEYS.MONTHLY_BUDGET);
    if (val !== null) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  } catch {}
  return 1500; // Default €1,500 monthly limit
}

export function saveStoredMonthlyBudget(amount: number): void {
  try {
    secureStorage.setItem(STORAGE_KEYS.MONTHLY_BUDGET, String(amount));
  } catch {}
}

// Clear all data
export function clearAllLocalTransactions(): void {
  try {
    secureStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    secureStorage.removeItem(STORAGE_KEYS.QUEUE);
  } catch {}
}
