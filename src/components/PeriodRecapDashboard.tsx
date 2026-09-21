/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { TimeFilterPeriod, Transaction } from '../types.ts';

interface PeriodRecapDashboardProps {
  transactions: Transaction[];
  currentPeriod: TimeFilterPeriod;
  onPeriodChange: (period: TimeFilterPeriod) => void;
}

export const PeriodRecapDashboard: React.FC<PeriodRecapDashboardProps> = ({
  transactions,
  currentPeriod,
  onPeriodChange,
}) => {
  const now = new Date();

  // Filter transactions based on selected period
  const filtered = transactions.filter((t) => {
    if (currentPeriod === 'all') return true;

    const txDate = new Date(t.date);
    if (isNaN(txDate.getTime())) return true;

    if (currentPeriod === 'month') {
      return (
        txDate.getFullYear() === now.getFullYear() &&
        txDate.getMonth() === now.getMonth()
      );
    }

    if (currentPeriod === 'year') {
      return txDate.getFullYear() === now.getFullYear();
    }

    if (currentPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      return txDate >= oneWeekAgo;
    }

    return true;
  });

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const count = filtered.length;

  const periods: { key: TimeFilterPeriod; label: string; sub: string }[] = [
    { key: 'month', label: 'Mese', sub: 'Corrente' },
    { key: 'year', label: 'Anno', sub: String(now.getFullYear()) },
    { key: 'all', label: 'Tutto', sub: 'Globale' },
  ];

  return (
    <div className="space-y-3.5">
      {/* Time Period Segmented Control (Nothing OS minimal) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-zinc-950/70 border border-white/5 rounded-2xl backdrop-blur-sm shadow-inner">
        {periods.map((p) => {
          const isActive = currentPeriod === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`flex-1 py-1.5 px-2 text-center rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800/90 text-white font-mono-code font-bold shadow border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 font-mono-code text-xs'
              }`}
            >
              <div className="text-[11px] tracking-wider uppercase">{p.label}</div>
              <div
                className={`text-[9px] font-mono-code ${
                  isActive ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {p.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Balance & Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Net Balance Card */}
        <div className="sm:col-span-1 p-4 rounded-3xl border border-white/10 bg-zinc-900/40 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-code text-[10px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-zinc-400" />
              <span>BILANCIO</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code bg-zinc-900/90 border border-white/5 text-zinc-400">
              {count} {count === 1 ? 'op' : 'ops'}
            </span>
          </div>

          <div className="my-1.5">
            <div
              className={`font-mono-code text-2xl sm:text-3xl font-bold tracking-tight ${
                balance >= 0 ? 'text-zinc-100' : 'text-red-400'
              }`}
            >
              {balance >= 0 ? '+€' : '-€'}
              {Math.abs(balance).toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono-code mt-0.5">
              {balance >= 0 ? 'In attivo nel periodo' : 'Disavanzo registrato'}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono-code text-zinc-400">
            <span>Rapporto E/U:</span>
            <span className="text-zinc-200">
              {totalExpense > 0
                ? ((totalIncome / totalExpense) * 100).toFixed(0) + '%'
                : totalIncome > 0
                ? '∞'
                : '0%'}
            </span>
          </div>
        </div>

        {/* Incomes and Expenses Totals (Clean, lightweight, NO redundant buttons!) */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-2.5">
          {/* Entrate */}
          <div className="p-4 rounded-3xl border border-white/5 bg-zinc-900/30 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENTRATE</span>
              </span>
              <span className="text-[10px] font-mono-code text-zinc-500">
                {filtered.filter((t) => t.type === 'income').length}
              </span>
            </div>
            <div className="font-mono-code text-lg sm:text-2xl font-bold text-emerald-400 tracking-tight my-1">
              +€
              {totalIncome.toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] font-mono-code text-zinc-500">
              Totale accreditato
            </div>
          </div>

          {/* Uscite */}
          <div className="p-4 rounded-3xl border border-white/5 bg-zinc-900/30 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-red-500 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                <span>USCITE</span>
              </span>
              <span className="text-[10px] font-mono-code text-zinc-500">
                {filtered.filter((t) => t.type === 'expense').length}
              </span>
            </div>
            <div className="font-mono-code text-lg sm:text-2xl font-bold text-red-500 tracking-tight my-1">
              -€
              {totalExpense.toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] font-mono-code text-zinc-500">
              Totale addebitato
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
