/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.ts';
import { Transaction } from '../types.ts';

// In-memory token storage (never localStorage for security)
let cachedAccessToken: string | null = null;

export async function getGoogleSheetsAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  // Request Google Sheets and Drive File scopes for creating/updating the spreadsheet
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Impossibile ottenere il token di accesso per Fogli Google.');
  }

  cachedAccessToken = credential.accessToken;
  return cachedAccessToken;
}

export function clearCachedGoogleToken(): void {
  cachedAccessToken = null;
}

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowCount: number;
}

/**
 * Creates a brand new Google Spreadsheet with all current Stonks transactions
 */
export async function exportToGoogleSheets(
  transactions: Transaction[]
): Promise<GoogleSheetsExportResult> {
  const token = await getGoogleSheetsAccessToken();

  const title = `Stonks - Spese ed Entrate (${new Date().toLocaleDateString('it-IT')})`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Movimenti',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message ||
        `Errore nella creazione del Foglio Google (Status ${createRes.status})`
    );
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare headers and values
  const headers = [
    'ID',
    'Data (AAAA-MM-GG)',
    'Tipo (Entrata/Uscita)',
    'Descrizione',
    'Categoria',
    'Importo (€)',
    'Luogo',
    'Mese (AAAA-MM)',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === 'income' ? 'Entrata' : 'Uscita',
    t.description || '',
    t.category || '',
    t.type === 'income' ? t.amount : -t.amount,
    t.location || '',
    t.month || '',
  ]);

  const allValues = [headers, ...rows];

  // 3. Append values to the sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Movimenti!A1:H${allValues.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errBody = await updateRes.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message ||
        `Errore nel salvataggio dei dati su Fogli Google (Status ${updateRes.status})`
    );
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowCount: rows.length,
  };
}

/**
 * Reads transactions from an existing Google Spreadsheet ID or URL
 */
export async function importFromGoogleSheets(
  sheetUrlOrId: string
): Promise<Transaction[]> {
  const token = await getGoogleSheetsAccessToken();

  let spreadsheetId = sheetUrlOrId.trim();
  // Extract ID from full URL if user pasted a link like https://docs.google.com/spreadsheets/d/XXXX/edit
  const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    spreadsheetId = match[1];
  }

  if (!spreadsheetId) {
    throw new Error('ID o link del Foglio Google non valido.');
  }

  // First fetch metadata to get the first sheet name
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    throw new Error('Impossibile accedere al Foglio Google. Verifica l\'ID o le autorizzazioni.');
  }

  const metaData = await metaRes.json();
  const firstSheetTitle =
    metaData.sheets?.[0]?.properties?.title || 'Movimenti';

  // Read range
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      firstSheetTitle
    )}!A1:Z1000`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!readRes.ok) {
    throw new Error('Errore durante la lettura dei dati dal foglio.');
  }

  const data = await readRes.json();
  const rows: any[][] = data.values || [];

  if (rows.length < 2) {
    throw new Error('Il foglio selezionato è vuoto o contiene solo le intestazioni.');
  }

  const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());

  const dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('date'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('voce') || h.includes('titolo'));
  const catIdx = headers.findIndex((h) => h.includes('cat') || h.includes('tag'));
  const locIdx = headers.findIndex((h) => h.includes('luogo') || h.includes('loc'));
  const amountIdx = headers.findIndex((h) => h.includes('importo') || h.includes('amount') || h.includes('valore'));
  const typeIdx = headers.findIndex((h) => h.includes('tipo') || h.includes('type'));
  const idIdx = headers.findIndex((h) => h.includes('id'));

  const parsed: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const rawDate = dateIdx >= 0 ? r[dateIdx] : r[1];
    const cleanDate = rawDate ? String(rawDate).trim() : new Date().toISOString().split('T')[0];

    const rawAmount = amountIdx >= 0 ? r[amountIdx] : r[5] || r[3] || '0';
    let numericAmount = Math.abs(parseFloat(String(rawAmount).replace(',', '.')) || 0);

    let typeStr = typeIdx >= 0 ? String(r[typeIdx] || '').toLowerCase() : '';
    let isIncome = typeStr.includes('inc') || typeStr.includes('entrat');

    if (!typeStr && String(rawAmount).trim().startsWith('+')) {
      isIncome = true;
    }

    const desc = descIdx >= 0 ? String(r[descIdx] || '') : 'Importato da Sheets';
    const cat = catIdx >= 0 ? String(r[catIdx] || '') : '';
    const loc = locIdx >= 0 ? String(r[locIdx] || '') : '';
    const id = idIdx >= 0 && r[idIdx] ? String(r[idIdx]) : `gs_${Date.now()}_${i}`;

    if (numericAmount > 0) {
      parsed.push({
        id,
        date: cleanDate,
        type: isIncome ? 'income' : 'expense',
        description: desc,
        amount: Math.round(numericAmount * 100) / 100,
        month: cleanDate.substring(0, 7),
        category: cat,
        location: loc,
        syncStatus: 'synced',
      });
    }
  }

  return parsed;
}
