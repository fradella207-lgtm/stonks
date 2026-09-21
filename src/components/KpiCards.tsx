/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { Transaction } from '../types.ts';

interface KpiCardsProps {
  transactions: Transaction[];
  currentMonth: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ transactions }) => {
  // Compute monthly totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const isNetPositive = netBalance >= 0;

  // Format currency with euro symbol and comma for decimals in display
  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-2">
      {/* 3 KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Entrate Card */}
        <div
          id="kpi-income"
          className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 flex flex-col justify-between transition-all"
        >
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500/80" />
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400">
              Entrate
            </span>
            <div className="p-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div className="font-mono-code text-sm sm:text-base font-bold text-emerald-400 tracking-tight break-all">
              {formatEUR(totalIncome)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono-code">
              +{transactions.filter((t) => t.type === 'income').length} ops
            </div>
          </div>
        </div>

        {/* Uscite Card */}
        <div
          id="kpi-expense"
          className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 flex flex-col justify-between transition-all"
        >
          {/* Subtle top accent bar - Nothing iconic red */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-600/90" />
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400">
              Uscite
            </span>
            <div className="p-1 rounded-full bg-red-950/50 border border-red-900/40 text-red-500">
              <ArrowDownRight className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div className="font-mono-code text-sm sm:text-base font-bold text-red-500 tracking-tight break-all">
              {formatEUR(totalExpense)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono-code">
              -{transactions.filter((t) => t.type === 'expense').length} ops
            </div>
          </div>
        </div>

        {/* Netto Card (Colore dinamico: verde se positivo, rosso se negativo) */}
        <div
          id="kpi-net"
          className={`relative overflow-hidden rounded-xl border p-3 flex flex-col justify-between transition-all ${
            isNetPositive
              ? 'border-emerald-500/30 bg-emerald-950/15'
              : 'border-red-600/30 bg-red-950/15'
          }`}
        >
          {/* Dynamic top bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] ${
              isNetPositive ? 'bg-emerald-500' : 'bg-red-600'
            }`}
          />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400">
              Netto
            </span>
            <div
              className={`p-1 rounded-full border ${
                isNetPositive
                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                  : 'bg-red-950/60 border-red-800/50 text-red-400'
              }`}
            >
              <Scale className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div
              className={`font-mono-code text-sm sm:text-base font-bold tracking-tight break-all ${
                isNetPositive ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {isNetPositive ? `+${formatEUR(netBalance)}` : formatEUR(netBalance)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono-code">
              {isNetPositive ? 'In attivo' : 'In passivo'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
