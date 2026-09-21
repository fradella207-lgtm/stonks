/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PiggyBank, Calendar, Tag } from 'lucide-react';
import { TimeFilterPeriod, Transaction } from '../types.ts';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ReportsTabProps {
  transactions: Transaction[];
  currentPeriod: TimeFilterPeriod;
  onPeriodChange: (period: TimeFilterPeriod) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  currentPeriod,
  onPeriodChange,
}) => {
  const now = new Date();

  // Filter transactions based on current selected period
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
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalVolume = totalIncome + totalExpense;

  const incomePct = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 0;
  const expensePct = totalVolume > 0 ? Math.round((totalExpense / totalVolume) * 100) : 0;

  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  // Approximate days in period for daily average
  const periodDays = currentPeriod === 'week' ? 7 : currentPeriod === 'year' ? 365 : 30;
  const dailyAverageExpense = totalExpense / periodDays;

  // Chart.js Doughnut Data
  const doughnutData = {
    labels: ['Entrate', 'Uscite'],
    datasets: [
      {
        data: totalVolume > 0 ? [totalIncome, totalExpense] : [1, 1],
        backgroundColor:
          totalVolume > 0
            ? ['#10b981', '#dc2626']
            : ['rgba(150,150,150,0.15)', 'rgba(150,150,150,0.2)'],
        borderColor: 'transparent',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: totalVolume > 0,
        backgroundColor: '#121215',
        titleColor: '#f4f4f5',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            const pct = totalVolume > 0 ? Math.round((val / totalVolume) * 100) : 0;
            return ` ${context.label}: € ${val.toFixed(2)} (${pct}%)`;
          },
        },
      },
    },
  };

  // Group expenses by category
  const categoryMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const tag = t.category || t.description || 'Altro';
      categoryMap[tag] = (categoryMap[tag] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top 4 largest individual expenses
  const topExpenses = [...filtered]
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const periods: { key: TimeFilterPeriod; label: string; sub: string }[] = [
    { key: 'week', label: 'Settimana', sub: '7 gg' },
    { key: 'month', label: 'Mese', sub: 'Corrente' },
    { key: 'year', label: 'Anno', sub: String(now.getFullYear()) },
    { key: 'all', label: 'Tutto', sub: 'Globale' },
  ];

  return (
    <div id="tab-reports" className="w-full space-y-3.5">
      {/* Interactive Time Period Selector in Reports (Settimana / Mese / Anno / Tutto) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-app-card border border-app rounded-2xl shadow-sm">
        {periods.map((p) => {
          const isActive = currentPeriod === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`flex-1 py-1.5 px-2 text-center rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-app-subtle text-app-main font-mono-code font-bold shadow-sm border border-app'
                  : 'text-app-muted hover:text-app-main font-mono-code text-xs'
              }`}
            >
              <div className="text-[11px] tracking-wider uppercase">{p.label}</div>
              <div
                className={`text-[9px] font-mono-code ${
                  isActive ? 'text-app-main' : 'text-app-muted'
                }`}
              >
                {p.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Donut Chart Card */}
      <div className="rounded-3xl border border-app bg-app-card p-5 shadow-sm backdrop-blur-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted font-bold">
            RAPPORTO ENTRATE // USCITE
          </div>
          <div className="text-[10px] font-mono-code px-2.5 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {filtered.length} movimenti
          </div>
        </div>

        {/* Doughnut with center statistics */}
        <div className="relative h-48 w-full flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />

          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] font-mono-code uppercase tracking-widest text-app-muted">
              Ripartizione
            </span>
            <div className="flex items-center gap-1 font-mono-code text-base font-bold text-app-main">
              <span className="text-emerald-500">{incomePct}%</span>
              <span className="text-app-muted">/</span>
              <span className="text-red-500">{expensePct}%</span>
            </div>
            <span className="text-[10px] text-app-muted font-mono-code">
              {totalVolume > 0 ? formatEUR(totalVolume) : 'Nessun dato'}
            </span>
          </div>
        </div>

        {/* Legend pills below chart */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 pt-3 border-t border-app-subtle">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-app-subtle border border-app">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span className="text-xs font-mono-code text-app-main">Entrate</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono-code font-bold text-emerald-500">
                {incomePct}%
              </span>
              <div className="text-[10px] text-app-muted font-mono-code">
                {formatEUR(totalIncome)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-app-subtle border border-app">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
              <span className="text-xs font-mono-code text-app-main">Uscite</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono-code font-bold text-red-500">
                {expensePct}%
              </span>
              <div className="text-[10px] text-app-muted font-mono-code">
                {formatEUR(totalExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Tasso di Risparmio */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-app-muted mb-1.5">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Tasso Risparmio
            </span>
            <PiggyBank className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div
            className={`font-mono-code text-2xl font-bold ${
              savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {savingsRate}%
          </div>
          <p className="text-[10px] text-app-muted mt-1 font-mono-code">
            {savingsRate >= 20
              ? 'Margine eccellente'
              : savingsRate >= 0
              ? 'In pareggio attivo'
              : 'Disavanzo registrato'}
          </p>
        </div>

        {/* Media Giornaliera Uscite */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-app-muted mb-1.5">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Media Giornaliera
            </span>
            <Calendar className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div className="font-mono-code text-2xl font-bold text-app-main">
            {formatEUR(dailyAverageExpense)}
          </div>
          <p className="text-[10px] text-app-muted mt-1 font-mono-code">
            Calcolo su {periodDays} gg
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted flex items-center gap-1.5 font-bold">
              <Tag className="w-3.5 h-3.5 text-app-muted" />
              <span>SPESE PER CATEGORIA</span>
            </span>
            <span className="text-[10px] font-mono-code text-app-muted">
              Top {sortedCategories.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedCategories.map(([cat, amount]) => {
              const pctOfExpense =
                totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono-code">
                    <span className="text-app-main font-medium">{cat}</span>
                    <span className="text-red-500 font-bold">
                      {formatEUR(amount)} ({pctOfExpense}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-app-subtle overflow-hidden border border-app-subtle">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${pctOfExpense}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 4 Spese Rilevanti */}
      {topExpenses.length > 0 && (
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors">
          <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted mb-2.5 font-bold">
            USCITE PIÙ RILEVANTI
          </div>

          <div className="space-y-1.5">
            {topExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-app-subtle border border-app"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-mono-code text-app-main truncate font-medium">
                    {exp.description}
                  </div>
                  <div className="text-[10px] font-mono-code text-app-muted">
                    {exp.category || 'Altro'} • {exp.date}
                  </div>
                </div>
                <div className="text-xs font-mono-code font-bold text-red-500 shrink-0">
                  -{formatEUR(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
