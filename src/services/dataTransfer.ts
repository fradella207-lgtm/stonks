/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types.ts';
import { generateUUID, sanitizeAmount, sanitizeDate, extractMonth } from './storage.ts';

/**
 * Export transactions to clean formatted CSV (Excel/Sheets compatible)
 */
export function exportToCsv(transactions: Transaction[]): void {
  const headers = ['ID', 'Data', 'Tipo', 'Categoria', 'Descrizione', 'Importo', 'Luogo', 'Mese'];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${(t.location || '').replace(/"/g, '""')}"`,
    t.month,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stonks_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export transactions to JSON format
 */
export function exportToJson(transactions: Transaction[]): void {
  const data = JSON.stringify(transactions, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stonks_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV or JSON content into valid Transaction records
 */
export function parseImportData(rawText: string, fileType: 'csv' | 'json'): Transaction[] {
  if (fileType === 'json') {
    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) throw new Error('Il file JSON deve contenere un elenco di movimenti.');

    return parsed.map((item: any) => {
      const date = sanitizeDate(item.date || item.Data);
      return {
        id: item.id || item.ID || generateUUID(),
        date,
        type: String(item.type || item.Tipo || 'expense').toLowerCase().includes('inc') ? 'income' : 'expense',
        description: String(item.description || item.Descrizione || 'Importato').trim(),
        amount: sanitizeAmount(item.amount || item.Importo),
        month: item.month || item.Mese || extractMonth(date),
        category: String(item.category || item.Categoria || ''),
        location: String(item.location || item.Luogo || ''),
        receiptImage: item.receiptImage || '',
        syncStatus: 'synced',
      };
    });
  }

  // Parse CSV
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('File CSV vuoto o senza righe di dati.');

  // Check header line
  const headerLine = lines[0].toLowerCase();
  const sep = headerLine.includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.replace(/["'\r]/g, '').trim().toLowerCase());

  // Find column indexes
  const dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('date'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('voce') || h.includes('titolo'));
  const catIdx = headers.findIndex((h) => h.includes('cat') || h.includes('tag'));
  const locIdx = headers.findIndex((h) => h.includes('luogo') || h.includes('loc') || h.includes('posto') || h.includes('negozio'));
  const amountIdx = headers.findIndex((h) => h.includes('importo') || h.includes('amount') || h.includes('valore') || h.includes('totale'));
  const typeIdx = headers.findIndex((h) => h.includes('tipo') || h.includes('type'));
  const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('uuid'));

  const results: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cells = rawLine.split(new RegExp(`${sep}(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)`))
      .map((c) => c.replace(/^"|"$/g, '').trim());

    if (cells.length < 2) continue;

    const rawDate = dateIdx >= 0 ? cells[dateIdx] : cells[1];
    const date = sanitizeDate(rawDate);
    const rawAmount = amountIdx >= 0 ? cells[amountIdx] : cells[4] || cells[3] || '0';
    const amount = sanitizeAmount(rawAmount);

    let typeStr = typeIdx >= 0 ? (cells[typeIdx] || '').toLowerCase() : '';
    let isIncome = typeStr.includes('inc') || typeStr.includes('entrat') || typeStr.includes('+');

    if (!typeStr && String(rawAmount).trim().startsWith('+')) isIncome = true;

    const desc = descIdx >= 0 ? cells[descIdx] : cells[3] || cells[2] || 'Importato';
    const cat = catIdx >= 0 ? cells[catIdx] : '';
    const loc = locIdx >= 0 ? cells[locIdx] : '';
    const id = (idIdx >= 0 && cells[idIdx]) ? cells[idIdx] : generateUUID();

    if (amount > 0) {
      results.push({
        id,
        date,
        type: isIncome ? 'income' : 'expense',
        description: desc || (isIncome ? 'Entrata' : 'Uscita'),
        amount,
        month: extractMonth(date),
        category: cat,
        location: loc,
        syncStatus: 'synced',
      });
    }
  }

  return results;
}
