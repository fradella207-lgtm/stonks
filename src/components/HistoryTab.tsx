/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Calendar,
  Filter,
  Check,
  AlertTriangle,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';
import { DailyActivityCard } from './DailyActivityCard.tsx';
import { FinancialTelematicsCard } from './FinancialTelematicsCard.tsx';

interface HistoryTabProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAdd: (type?: TransactionType) => void;
  onNavigateReports?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  transactions,
  onEdit,
  onDelete,
  onOpenAdd,
  onNavigateReports,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [timeFilter, setTimeFilter] = useState<'week' | 'currentMonth' | 'all'>('currentMonth');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  const currentMonthPrefix = useMemo(() => {
    return new Date().toISOString().substring(0, 7);
  }, []);

  // Filter transactions by search query, type, and period
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        // Period filter (Settimana vs Questo mese vs Tutto)
        if (timeFilter === 'week') {
          if (!t.date) return false;
          const now = new Date();
          const day = now.getDay();
          const diffToMon = (day === 0 ? -6 : 1) - day;
          const monday = new Date(now);
          monday.setDate(now.getDate() + diffToMon);
          monday.setHours(0, 0, 0, 0);

          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);

          const tDate = new Date(`${t.date}T00:00:00`);
          if (tDate < monday || tDate > sunday) return false;
        } else if (timeFilter === 'currentMonth') {
          if (!t.date || !t.date.startsWith(currentMonthPrefix)) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Search text
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
  }, [transactions, timeFilter, currentMonthPrefix, typeFilter, searchQuery]);

  // Group transactions by day for smooth scannability
  const groupedByDay = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groups: {
      date: string;
      title: string;
      items: Transaction[];
      dayNet: number;
    }[] = [];

    const dateMap = new Map<string, Transaction[]>();

    filtered.forEach((t) => {
      const day = t.date || 'Senza data';
      if (!dateMap.has(day)) {
        dateMap.set(day, []);
      }
      dateMap.get(day)!.push(t);
    });

    dateMap.forEach((items, day) => {
      let title = day;
      if (day === todayStr) {
        title = 'Oggi';
      } else if (day === yesterdayStr) {
        title = 'Ieri';
      } else {
        try {
          const [y, m, d] = day.split('-');
          const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
          title = dateObj.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          });
        } catch {
          title = day;
        }
      }

      const dayNet = items.reduce((acc, it) => {
        return it.type === 'income' ? acc + it.amount : acc - it.amount;
      }, 0);

      groups.push({
        date: day,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        items,
        dayNet,
      });
    });

    return groups;
  }, [filtered]);

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
      {/* 1. BMW-Style Instant Financial Cockpit ("Tutto Ok" + Vivace Live Balance & Quick Dock) */}
      <FinancialTelematicsCard
        transactions={transactions}
        onOpenAdd={onOpenAdd}
        onNavigateReports={onNavigateReports}
      />

      {/* 2. Fixed Daily Activity Chart (Attività Giornaliera) */}
      <DailyActivityCard transactions={transactions} />

      {/* 3. Fluid Controls: Search, Quick Period, Type Filters */}
      <div className="space-y-2.5 pt-1">
        {/* Search bar with clear button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Cerca per voce, categoria, luogo o importo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-app-card border border-app rounded-2xl pl-10 pr-9 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/60 outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-main p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="px-3 py-2 rounded-2xl bg-app-card border border-app text-[11px] font-mono-code text-app-muted shrink-0">
            {filtered.length} {filtered.length === 1 ? 'attività' : 'attività'}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {/* Period Toggle */}
          <div className="flex items-center gap-1 bg-app-card p-0.5 rounded-full border border-app shrink-0">
            <button
              type="button"
              onClick={() => setTimeFilter('week')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer ${
                timeFilter === 'week'
                  ? 'bg-app-subtle text-app-main font-bold border border-app shadow-xs'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              Settimana
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('currentMonth')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer ${
                timeFilter === 'currentMonth'
                  ? 'bg-app-subtle text-app-main font-bold border border-app shadow-xs'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              Mese
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-app-subtle text-app-main font-bold border border-app shadow-xs'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              Tutto
            </button>
          </div>

          {/* Type Filter Pills: Tutti, Solo Uscite, Solo Entrate */}
          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                { key: 'all', label: 'Tutti' },
                { key: 'expense', label: 'Uscite (-)' },
                { key: 'income', label: 'Entrate (+)' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTypeFilter(item.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === item.key
                    ? 'bg-app-card text-app-main border border-emerald-500 font-bold shadow-xs'
                    : 'bg-app-subtle text-app-muted hover:text-app-main border border-app'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Fluid Feed List with Day Grouping */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 text-center border border-dashed border-app rounded-3xl bg-app-card/60 p-6"
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-app-subtle border border-app flex items-center justify-center text-app-muted mb-2">
            <ReceiptText className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono-code text-app-main font-medium">
            Nessun movimento trovato
          </p>
          <p className="text-[11px] text-app-muted mt-1 max-w-xs mx-auto">
            {searchQuery
              ? 'Nessun risultato corrisponde alla ricerca corrente.'
              : timeFilter === 'currentMonth'
              ? 'Nessun movimento registrato in questo mese.'
              : 'Nessun movimento registrato nello storico.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAdd('expense')}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono-code font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            + Aggiungi Movimento
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {groupedByDay.map((group) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                {/* Sticky Day Subheader */}
                <div className="flex items-center justify-between px-1.5 py-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-app-muted" />
                    <span className="text-[11px] font-mono-code font-bold text-app-sub uppercase tracking-wider">
                      {group.title}
                    </span>
                    <span className="text-[10px] font-mono-code text-app-muted">
                      ({group.items.length})
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono-code font-bold ${
                      group.dayNet >= 0 ? 'text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    {group.dayNet >= 0 ? '+' : ''}
                    {formatEUR(group.dayNet)}
                  </span>
                </div>

                {/* Day's Transactions List */}
                <div className="space-y-1.5">
                  {group.items.map((t) => {
                    const isIncome = t.type === 'income';
                    const isConfirming = confirmDeleteId === t.id;

                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-app bg-app-card hover:bg-app-hover hover:border-app-hover transition-all duration-150 active:scale-[0.995]"
                      >
                        {/* Left Side: Clickable area for modification */}
                        <div
                          onClick={() => onEdit(t)}
                          className="flex items-center gap-3 min-w-0 flex-1 pr-2 cursor-pointer"
                          title="Clicca per modificare questo movimento"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${
                              isIncome
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                : 'bg-red-950/20 border-red-500/30 text-red-500 shadow-[0_0_8px_rgba(220,38,38,0.15)]'
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
                              <span>{t.date}</span>

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
                                  className="flex items-center gap-0.5 text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                                >
                                  <ImageIcon className="w-2.5 h-2.5" />
                                  <span>Scontrino</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Amount + Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            onClick={() => onEdit(t)}
                            className="text-right cursor-pointer"
                            title="Clicca per modificare"
                          >
                            <div
                              className={`font-mono-code text-sm font-bold tracking-tight ${
                                isIncome ? 'text-emerald-400' : 'text-red-500'
                              }`}
                            >
                              {isIncome ? '+' : '-'}
                              {formatEUR(t.amount)}
                            </div>
                          </div>

                          {/* Quick Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(t)}
                            className="p-1.5 rounded-lg text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer active:scale-90"
                            title="Modifica movimento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete with inline confirmation */}
                          {isConfirming ? (
                            <div className="flex items-center gap-1 bg-red-950/40 border border-red-500/50 rounded-xl p-1 animate-in">
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(t.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                title="Conferma eliminazione"
                              >
                                <Check className="w-3 h-3" />
                                <span>Elimina</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 text-app-muted hover:text-app-main transition-colors cursor-pointer"
                                title="Annulla"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(t.id)}
                              className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-red-950/20 transition-colors cursor-pointer active:scale-90"
                              title="Elimina movimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Scontrino / Receipt Preview Modal with smooth backdrop */}
      <AnimatePresence>
        {viewReceiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setViewReceiptUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-sm w-full bg-app-card border border-app rounded-3xl p-4 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-app">
                <span className="font-mono-code text-xs font-bold text-app-main flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scontrino Allegato</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewReceiptUrl(null)}
                  className="p-1 rounded-lg text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-app bg-app-subtle max-h-96 flex items-center justify-center">
                <img
                  src={viewReceiptUrl}
                  alt="Scontrino"
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>

              <button
                type="button"
                onClick={() => setViewReceiptUrl(null)}
                className="w-full mt-3 py-2 rounded-xl bg-app-subtle hover:bg-app-hover border border-app font-mono-code text-xs text-app-main transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
