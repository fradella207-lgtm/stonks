/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Transaction } from '../types.ts';

interface WeeklyRecapCardProps {
  transactions: Transaction[];
  onOpenAdd?: () => void;
}

export const WeeklyRecapCard: React.FC<WeeklyRecapCardProps> = ({
  transactions,
  onOpenAdd,
}) => {
  // Build 7 calendar days array [6 days ago, ..., today]
  const daysData = useMemo(() => {
    const list: {
      dateIso: string;
      label: string;
      fullDateLabel: string;
      isToday: boolean;
      income: number;
      expense: number;
      balance: number;
      count: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateIso = d.toISOString().split('T')[0];

      // Format weekday in Italian (e.g. "Lun", "Mar")
      const weekdayStr = d.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('it-IT', { month: 'short' });
      const label = i === 0 ? 'Oggi' : `${weekdayStr.toUpperCase()} ${dayNum}`;
      const fullDateLabel = `${d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}`;

      const dayTxs = transactions.filter((t) => t.date === dateIso);
      const income = dayTxs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      list.push({
        dateIso,
        label,
        fullDateLabel,
        isToday: i === 0,
        income,
        expense,
        balance: income - expense,
        count: dayTxs.length,
      });
    }

    return list;
  }, [transactions]);

  // Selected day index (default: today, which is index 6)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);

  // Overall 7-day metrics
  const totalIncome = useMemo(
    () => daysData.reduce((sum, d) => sum + d.income, 0),
    [daysData]
  );
  const totalExpense = useMemo(
    () => daysData.reduce((sum, d) => sum + d.expense, 0),
    [daysData]
  );
  const totalBalance = totalIncome - totalExpense;
  const totalTransactionsCount = useMemo(
    () => daysData.reduce((sum, d) => sum + d.count, 0),
    [daysData]
  );

  // Daily average expense
  const dailyAverageExpense = totalExpense / 7;

  // Peak expense day
  const peakExpenseDay = useMemo(() => {
    let peak = daysData[0];
    for (const d of daysData) {
      if (d.expense > peak.expense) peak = d;
    }
    return peak.expense > 0 ? peak : null;
  }, [daysData]);

  // Max volume for proportional sparkline scaling
  const maxDayVolume = useMemo(() => {
    let max = 0;
    for (const d of daysData) {
      const vol = Math.max(d.income, d.expense);
      if (vol > max) max = vol;
    }
    return max > 0 ? max : 100;
  }, [daysData]);

  const activeDay = daysData[selectedDayIdx] || daysData[6];

  // Savings rate
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div
      id="hero-weekly-telemetry"
      className="relative overflow-hidden rounded-3xl border border-app bg-app-card p-4 sm:p-5 shadow-2xl transition-all"
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-red-600/10 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />

      {/* 1. Futuristic Header HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-app-subtle">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="font-mono-code text-[11px] uppercase tracking-widest text-app-main font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            <span>RADAR FLUSSO SETTIMANALE</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-app-subtle text-[9px] font-mono-code text-app-muted border border-app">
            7 GIORNI
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-code text-app-muted">
            {totalTransactionsCount}{' '}
            {totalTransactionsCount === 1 ? 'operazione' : 'operazioni'}
          </span>
          {onOpenAdd && (
            <button
              onClick={onOpenAdd}
              className="px-2.5 py-1 rounded-xl bg-app-subtle hover:bg-app-hover border border-app text-app-main text-[10px] font-mono-code transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>+ Movimento</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary Balance HUD & Key Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        {/* Main Balance Display (Hero Left) */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-app-subtle/50 border border-app flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-app-muted" />
              <span>BILANCIO NETTO 7GG</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono-code font-bold border ${
                totalBalance >= 0
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-950/40 text-red-400 border-red-500/30'
              }`}
            >
              {totalBalance >= 0 ? '● FLUSSO POSITIVO' : '● DEFICIT 7GG'}
            </span>
          </div>

          <div className="my-2.5">
            <div
              className={`font-mono-code text-3xl sm:text-4xl font-extrabold tracking-tight ${
                totalBalance >= 0 ? 'text-app-main' : 'text-red-500'
              }`}
            >
              {totalBalance >= 0 ? '+€ ' : '-€ '}
              {Math.abs(totalBalance).toLocaleString('it-IT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] font-mono-code text-app-muted mt-1 flex items-center gap-2">
              <span>Media uscite: {formatEUR(dailyAverageExpense)} / gg</span>
            </div>
          </div>

          {/* Micro Telemetry Tags */}
          <div className="pt-2.5 border-t border-app-subtle flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-code text-app-muted">
            <div className="flex items-center gap-1">
              <span>Risparmio:</span>
              <span className="text-app-main font-bold">
                {totalIncome > 0 ? `${savingsRate}%` : 'N/D'}
              </span>
            </div>
            {peakExpenseDay && (
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown className="w-3 h-3" />
                <span>
                  Picco: {peakExpenseDay.label} ({formatEUR(peakExpenseDay.expense)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Income & Expense Twin Blocks (Hero Right) */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-2.5">
          {/* Entrate */}
          <div className="p-3.5 rounded-2xl bg-app-subtle/50 border border-app flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code uppercase font-bold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENTRATE 7GG</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="my-2 font-mono-code text-lg sm:text-2xl font-bold text-emerald-400 tracking-tight">
              +€ {totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-mono-code text-app-muted">
              {daysData.reduce((acc, d) => acc + (d.income > 0 ? 1 : 0), 0)} accrediti
            </div>
          </div>

          {/* Uscite */}
          <div className="p-3.5 rounded-2xl bg-app-subtle/50 border border-app flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code uppercase font-bold text-red-500 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                <span>USCITE 7GG</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </div>
            <div className="my-2 font-mono-code text-lg sm:text-2xl font-bold text-red-500 tracking-tight">
              -€ {totalExpense.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-mono-code text-app-muted">
              {daysData.reduce((acc, d) => acc + (d.expense > 0 ? 1 : 0), 0)} addebiti
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive 7-Day Sparkline Bar Radar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-app-subtle/40 border border-app space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono-code uppercase text-app-muted tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-app-muted" />
            <span>ATTIVITÀ GIORNALIERA (TOCCA UN GIORNO PER ISPEZIONARE)</span>
          </span>
          <span className="text-[10px] font-mono-code text-app-main font-bold">
            {activeDay.fullDateLabel}
          </span>
        </div>

        {/* 7 Interactive Columns */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-1">
          {daysData.map((d, idx) => {
            const isSelected = selectedDayIdx === idx;
            // Height calculation: scale between 15% and 100%
            const expHeight =
              d.expense > 0
                ? Math.min(100, Math.max(16, (d.expense / maxDayVolume) * 100))
                : 0;
            const incHeight =
              d.income > 0
                ? Math.min(100, Math.max(16, (d.income / maxDayVolume) * 100))
                : 0;

            return (
              <button
                key={d.dateIso}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex flex-col items-center justify-end p-1 sm:p-2 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-app-card border-red-500 shadow-md scale-[1.02]'
                    : 'bg-app-card/60 hover:bg-app-card border-app/60'
                }`}
              >
                {/* Visual Bar Container */}
                <div className="w-full h-20 sm:h-24 flex items-end justify-center gap-1 pb-1">
                  {/* Expense Bar */}
                  <div className="w-2 sm:w-3.5 bg-app-subtle rounded-t-sm flex items-end h-full">
                    {expHeight > 0 ? (
                      <div
                        style={{ height: `${expHeight}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isSelected ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-red-500/70 group-hover:bg-red-500'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-1 bg-app-muted/20 rounded-full mb-0.5" />
                    )}
                  </div>

                  {/* Income Bar */}
                  <div className="w-2 sm:w-3.5 bg-app-subtle rounded-t-sm flex items-end h-full">
                    {incHeight > 0 ? (
                      <div
                        style={{ height: `${incHeight}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isSelected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-emerald-500/70 group-hover:bg-emerald-400'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-1 bg-app-muted/20 rounded-full mb-0.5" />
                    )}
                  </div>
                </div>

                {/* Day Label */}
                <span
                  className={`mt-1 font-mono-code text-[9px] sm:text-[10px] tracking-tight ${
                    isSelected
                      ? 'text-app-main font-bold'
                      : d.isToday
                      ? 'text-red-400 font-bold'
                      : 'text-app-muted'
                  }`}
                >
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Micro-HUD Inspector */}
        <div className="mt-2 p-2.5 rounded-xl bg-app-card border border-app flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-bold text-app-main capitalize">{activeDay.fullDateLabel}:</span>
            <span className="text-app-muted">
              {activeDay.count} {activeDay.count === 1 ? 'movimento' : 'movimenti'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeDay.income > 0 && (
              <span className="text-emerald-400 font-bold">
                +€ {activeDay.income.toFixed(2)}
              </span>
            )}
            {activeDay.expense > 0 && (
              <span className="text-red-500 font-bold">
                -€ {activeDay.expense.toFixed(2)}
              </span>
            )}
            {activeDay.income === 0 && activeDay.expense === 0 && (
              <span className="text-app-muted italic">Nessun movimento in questo giorno</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
