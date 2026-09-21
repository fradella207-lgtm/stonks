/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  Search,
  ReceiptText,
  MapPin,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';
import { WeeklyRecapCard } from './WeeklyRecapCard.tsx';

interface HistoryTabProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  transactions,
  onEdit,
  onDelete,
  onOpenAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Filter transactions by search query and type
  const filtered = transactions
    .filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q) ||
        t.date.includes(q)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatShortDate = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div id="tab-history" className="w-full space-y-4">
      {/* 1. Fixed Weekly Recap directly in Movimenti as requested */}
      <WeeklyRecapCard transactions={transactions} />

      {/* 2. Feed Header with Search Bar & Type Filters */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Cerca per voce, categoria o luogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-app-card border border-app rounded-2xl pl-10 pr-3 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/60 outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="px-3 py-2 rounded-2xl bg-app-card border border-app text-[11px] font-mono-code text-app-muted shrink-0">
            {filtered.length} {filtered.length === 1 ? 'movimento' : 'movimenti'}
          </div>
        </div>

        {/* Filter Pills: Tutti, Solo Uscite, Solo Entrate */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { key: 'all', label: 'Tutti' },
              { key: 'expense', label: 'Solo Uscite (-)' },
              { key: 'income', label: 'Solo Entrate (+)' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTypeFilter(item.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono-code transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === item.key
                  ? 'bg-app-card text-app-main border border-red-500 font-bold shadow-sm'
                  : 'bg-app-subtle text-app-muted hover:text-app-main border border-app'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Feed List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-app rounded-3xl bg-app-card/60 p-6">
          <div className="w-10 h-10 mx-auto rounded-full bg-app-subtle border border-app flex items-center justify-center text-app-muted mb-2">
            <ReceiptText className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono-code text-app-main font-medium">
            Nessun movimento trovato
          </p>
          <p className="text-[11px] text-app-muted mt-1 max-w-xs mx-auto">
            {searchQuery
              ? 'Nessun risultato corrisponde alla ricerca.'
              : 'Nessun movimento registrato finora.'}
          </p>
          <button
            onClick={onOpenAdd}
            className="mt-3 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono-code font-bold transition-all cursor-pointer"
          >
            Aggiungi Movimento
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((t) => {
            const isIncome = t.type === 'income';
            const isConfirming = confirmDeleteId === t.id;

            return (
              <div
                key={t.id}
                className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-app bg-app-card hover:bg-app-hover transition-all duration-150"
              >
                {/* Left Side: Clickable area for modification */}
                <div
                  onClick={() => onEdit(t)}
                  className="flex items-center gap-3 min-w-0 flex-1 pr-2 cursor-pointer"
                  title="Clicca per modificare questo movimento"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500'
                        : 'bg-red-950/20 border-red-500/30 text-red-500'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs text-app-main font-medium truncate">
                        {t.description}
                      </span>
                      {t.category && (
                        <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-app-subtle border border-app text-app-muted shrink-0">
                          {t.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono-code text-app-muted flex-wrap">
                      <span>{formatShortDate(t.date)}</span>

                      {t.location && (
                        <span className="flex items-center gap-0.5 text-app-sub">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[120px]">{t.location}</span>
                        </span>
                      )}

                      {t.receiptImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewReceiptUrl(t.receiptImage || null);
                          }}
                          className="flex items-center gap-0.5 text-amber-500 hover:underline cursor-pointer"
                        >
                          <ImageIcon className="w-2.5 h-2.5" />
                          <span>Scontrino</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount + Edit & Delete Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    onClick={() => onEdit(t)}
                    className="text-right cursor-pointer"
                    title="Clicca per modificare"
                  >
                    <div
                      className={`font-mono-code text-sm font-bold tracking-tight ${
                        isIncome ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatEUR(t.amount)}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(t)}
                    className="p-1.5 rounded-lg text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer"
                    title="Modifica movimento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDelete(t.id)}
                        className="px-2 py-1 rounded bg-red-600 text-white font-mono-code text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Elimina
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 text-app-muted hover:text-app-main text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-app-subtle transition-colors cursor-pointer"
                      title="Elimina movimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scontrino Photo Viewer Lightbox */}
      {viewReceiptUrl && (
        <div
          onClick={() => setViewReceiptUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-app-modal border border-app rounded-3xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-app mb-3">
              <span className="text-xs font-mono-code text-app-main font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Foto Scontrino</span>
              </span>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1 text-app-muted hover:text-app-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={viewReceiptUrl}
                alt="Scontrino allegato"
                className="w-full h-auto object-contain max-h-[65vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
