/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertCircle,
  X,
  Database,
  CloudUpload,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { Transaction } from '../types.ts';
import { exportToCsv, exportToJson, parseImportData } from '../services/dataTransfer.ts';
import { exportToGoogleSheets, importFromGoogleSheets } from '../services/googleSheets.ts';

interface DataTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[]) => Promise<void>;
}

export const DataTransferModal: React.FC<DataTransferModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onImportTransactions,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetsUrlCreated, setSheetsUrlCreated] = useState<string | null>(null);
  const [sheetImportInput, setSheetImportInput] = useState('');
  const [showSheetsImportField, setShowSheetsImportField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setImportStatus(null);
    setSheetsUrlCreated(null);

    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith('.json');
      const items = parseImportData(text, isJson ? 'json' : 'csv');

      if (items.length === 0) {
        throw new Error('Nessuna transazione valida trovata nel file.');
      }

      await onImportTransactions(items);
      setImportStatus(`Importati con successo ${items.length} movimenti!`);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Errore durante l\'importazione del file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGoogleSheetsExport = async () => {
    if (transactions.length === 0) {
      setErrorMessage('Nessun movimento registrato da esportare.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setImportStatus(null);
    setSheetsUrlCreated(null);

    try {
      const res = await exportToGoogleSheets(transactions);
      setSheetsUrlCreated(res.spreadsheetUrl);
      setImportStatus(`Creato con successo il Foglio Google con ${res.rowCount} movimenti!`);
    } catch (err: any) {
      console.error('Google Sheets export error:', err);
      setErrorMessage(err.message || 'Errore durante l\'esportazione su Google Fogli.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!sheetImportInput.trim()) {
      setErrorMessage('Inserisci il link o l\'ID del Foglio Google.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setImportStatus(null);

    try {
      const imported = await importFromGoogleSheets(sheetImportInput.trim());
      if (imported.length === 0) {
        throw new Error('Nessun dato valido estratto dal foglio specificato.');
      }
      await onImportTransactions(imported);
      setImportStatus(`Importati con successo ${imported.length} movimenti da Fogli Google!`);
      setSheetImportInput('');
      setShowSheetsImportField(false);
    } catch (err: any) {
      console.error('Google Sheets import error:', err);
      setErrorMessage(err.message || 'Errore durante l\'importazione da Google Fogli.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-app-modal border border-app rounded-[32px] p-6 shadow-2xl space-y-5 text-app-main max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono-code text-xs font-bold uppercase tracking-widest text-app-main block">
                GESTIONE DATI // FOGLI & BACKUP
              </span>
              <span className="text-[9px] text-app-muted font-mono-code">
                Google Fogli • CSV Excel • JSON Offline
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-app-muted hover:text-app-main transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {importStatus && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-start gap-2.5 text-xs font-mono-code text-emerald-400">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div>{importStatus}</div>
              {sheetsUrlCreated && (
                <a
                  href={sheetsUrlCreated}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition-colors"
                >
                  <span>Apri Foglio Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-mono-code text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* 1. SEZIONE GOOGLE FOGLI (ESPORTA & SALVA) */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
              <span className="text-[11px] font-mono-code uppercase font-bold text-emerald-400 tracking-wider">
                Integrazione Google Fogli
              </span>
            </div>
            <span className="text-[9px] font-mono-code text-app-muted">Cloud Google</span>
          </div>

          <p className="text-[10px] text-app-muted font-mono-code leading-relaxed">
            Salva istantaneamente tutte le spese ed entrate in un nuovo foglio di calcolo Google Drive nel tuo account.
          </p>

          <button
            type="button"
            onClick={handleGoogleSheetsExport}
            disabled={isProcessing}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono-code font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isProcessing ? 'Connessione a Google...' : 'Salva su Google Fogli'}</span>
          </button>
        </div>

        {/* 2. ESPORTA IN ALTRI FORMATI (CSV / JSON) */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1.5 font-bold">
            <Download className="w-3.5 h-3.5 text-app-muted" />
            <span>Download Diretto ({transactions.length} record)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => exportToCsv(transactions)}
              className="p-3 bg-app-subtle hover:bg-app-hover border border-app rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono-code font-bold text-app-main">Scarica CSV</span>
              <span className="text-[9px] text-app-muted font-mono-code">Excel & Fogli</span>
            </button>

            <button
              onClick={() => exportToJson(transactions)}
              className="p-3 bg-app-subtle hover:bg-app-hover border border-app rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
            >
              <FileCode className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono-code font-bold text-app-main">Backup JSON</span>
              <span className="text-[9px] text-app-muted font-mono-code">Ripristino totale</span>
            </button>
          </div>
        </div>

        {/* 3. IMPORTA DATI VECCHI (File o Da Link Foglio Google) */}
        <div className="space-y-2 pt-2 border-t border-app-subtle">
          <div className="text-[11px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1.5 font-bold">
            <Upload className="w-3.5 h-3.5 text-app-muted" />
            <span>Importa Dati Vecchi o Backup</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .json, text/csv, application/json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full p-3 border border-dashed border-app hover:border-red-500 bg-app-subtle/50 hover:bg-app-hover rounded-2xl flex items-center justify-center gap-3 text-app-sub transition-all cursor-pointer text-left"
          >
            <CloudUpload className="w-4 h-4 text-app-muted shrink-0" />
            <div className="font-mono-code">
              <div className="text-xs font-bold text-app-main">
                Carica file vecchio (.CSV o .JSON)
              </div>
              <div className="text-[9px] text-app-muted">
                Importa automaticamente spese e categorie precedenti
              </div>
            </div>
          </button>

          {/* Toggle Import from Google Sheets */}
          {!showSheetsImportField ? (
            <button
              type="button"
              onClick={() => setShowSheetsImportField(true)}
              className="w-full py-2 text-center text-[10px] font-mono-code text-app-muted hover:text-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Hai già un link di Google Fogli da importare? Clicca qui</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-app-subtle border border-app space-y-2">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block font-bold">
                Link o ID Foglio Google da importare
              </label>
              <input
                type="text"
                value={sheetImportInput}
                onChange={(e) => setSheetImportInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 rounded-xl bg-app-input border border-app text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleSheetsImport}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono-code font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Importa da Foglio
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheetsImportField(false)}
                  className="px-3 py-1.5 rounded-xl bg-app-card border border-app text-app-muted text-xs font-mono-code cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-app-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-app-subtle border border-app text-xs font-mono-code text-app-muted hover:text-app-main transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
