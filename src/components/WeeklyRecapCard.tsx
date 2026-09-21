/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { Transaction } from '../types.ts';

interface WeeklyRecapCardProps {
  transactions: Transaction[];
}

export const WeeklyRecapCard: React.FC<WeeklyRecapCardProps> = ({ transactions }) => {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);

  // Filter strictly for the last 7 days (weekly)
  const weeklyTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    if (isNaN(txDate.getTime())) return false;
    return txDate >= oneWeekAgo;
  });

  const totalIncome = weeklyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = weeklyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const count = weeklyTransactions.length;

  return (
    <div className="w-full space-y-2">
      {/* Title badge indicating this is the fixed weekly recap */}
      <div className="flex items-center justify-between px-1">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-app-muted flex items-center gap-1.5 font-bold">
          <Calendar className="w-3.5 h-3.5 text-red-500" />
          <span>RECAP SETTIMANALE (ULTIMI 7 GIORNI)</span>
        </span>
        <span className="text-[10px] font-mono-code text-app-muted">
          {count} {count === 1 ? 'operazione' : 'operazioni'}
        </span>
      </div>

      {/* Main Weekly Balance & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Weekly Net Balance */}
        <div className="sm:col-span-1 p-4 rounded-3xl border border-app bg-app-card flex flex-col justify-between relative overflow-hidden backdrop-blur-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-code text-[10px] uppercase tracking-widest text-app-muted flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-app-muted" />
              <span>BILANCIO 7GG</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
          </div>

          <div className="my-1">
            <div
              className={`font-mono-code text-2xl sm:text-3xl font-bold tracking-tight ${
                balance >= 0 ? 'text-app-main' : 'text-red-500'
              }`}
            >
              {balance >= 0 ? '+€' : '-€'}
              {Math.abs(balance).toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-app-muted font-mono-code mt-0.5">
              {balance >= 0 ? 'Saldo positivo questa settimana' : 'Uscite superiori alle entrate'}
            </div>
          </div>

          <div className="pt-2 border-t border-app-subtle flex items-center justify-between text-[10px] font-mono-code text-app-muted">
            <span>Rapporto E/U:</span>
            <span className="text-app-main font-bold">
              {totalExpense > 0
                ? ((totalIncome / totalExpense) * 100).toFixed(0) + '%'
                : totalIncome > 0
                ? '∞'
                : '0%'}
            </span>
          </div>
        </div>

        {/* Weekly Income and Expense */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-2.5">
          {/* Income */}
          <div className="p-4 rounded-3xl border border-app bg-app-card flex flex-col justify-between backdrop-blur-sm transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-emerald-500 flex items-center gap-1 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span>ENTRATE 7GG</span>
              </span>
              <span className="text-[10px] font-mono-code text-app-muted">
                {weeklyTransactions.filter((t) => t.type === 'income').length}
              </span>
            </div>
            <div className="font-mono-code text-lg sm:text-2xl font-bold text-emerald-500 tracking-tight my-1">
              +€
              {totalIncome.toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] font-mono-code text-app-muted">
              Totale accreditato
            </div>
          </div>

          {/* Expense */}
          <div className="p-4 rounded-3xl border border-app bg-app-card flex flex-col justify-between backdrop-blur-sm transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-red-500 flex items-center gap-1 font-bold">
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                <span>USCITE 7GG</span>
              </span>
              <span className="text-[10px] font-mono-code text-app-muted">
                {weeklyTransactions.filter((t) => t.type === 'expense').length}
              </span>
            </div>
            <div className="font-mono-code text-lg sm:text-2xl font-bold text-red-500 tracking-tight my-1">
              -€
              {totalExpense.toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] font-mono-code text-app-muted">
              Totale speso
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
