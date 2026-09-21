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
} from 'lucide-react';
import { Transaction } from '../types.ts';
import { exportToCsv, exportToJson, parseImportData } from '../services/dataTransfer.ts';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setImportStatus(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-app-modal border border-app rounded-[32px] p-6 shadow-2xl space-y-6 text-app-main">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-subtle pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-red-500" />
            <span className="font-mono-code text-xs font-bold uppercase tracking-widest text-app-main">
              BACKUP & IMPORT // EXPORT
            </span>
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
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-mono-code text-emerald-400">
            <Check className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-mono-code text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1.5 font-bold">
            <Download className="w-3.5 h-3.5 text-app-muted" />
            <span>Esporta Dati ({transactions.length} record)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => exportToCsv(transactions)}
              className="p-3.5 bg-app-subtle hover:bg-app-hover border border-app rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono-code font-bold text-app-main">CSV Excel</span>
              <span className="text-[9px] text-app-muted font-mono-code">Compatibile Fogli/Excel</span>
            </button>

            <button
              onClick={() => exportToJson(transactions)}
              className="p-3.5 bg-app-subtle hover:bg-app-hover border border-app rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
            >
              <FileCode className="w-5 h-5 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-mono-code font-bold text-app-main">Backup JSON</span>
              <span className="text-[9px] text-app-muted font-mono-code">Ripristino completo</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1.5 font-bold">
            <Upload className="w-3.5 h-3.5 text-app-muted" />
            <span>Importa o Ripristina</span>
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
            className="w-full p-4 border border-dashed border-app hover:border-red-500 bg-app-subtle/50 hover:bg-app-hover rounded-2xl flex items-center justify-center gap-3 text-app-sub transition-all cursor-pointer"
          >
            <CloudUpload className="w-5 h-5 text-app-muted" />
            <div className="text-left font-mono-code">
              <div className="text-xs font-bold text-app-main">
                {isProcessing ? 'Elaborazione in corso...' : 'Carica file .CSV o .JSON'}
              </div>
              <div className="text-[10px] text-app-muted">
                Riconoscimento automatico colonne Data, Importo, Tipo
              </div>
            </div>
          </button>
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
