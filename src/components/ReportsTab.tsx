/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import {
  PiggyBank,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  Edit2,
  CalendarDays,
  Filter,
} from 'lucide-react';
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
  onEditTransaction?: (tx: Transaction) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  currentPeriod,
  onPeriodChange,
  onEditTransaction,
}) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filter transactions based on current selected period (Mese, Anno, Tutto - NO WEEK)
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

  // Days in period
  const periodDays = currentPeriod === 'year' ? 365 : 30;
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

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Available Periods (NO SETTIMANA)
  const periods: { key: TimeFilterPeriod; label: string; sub: string }[] = [
    { key: 'month', label: 'Mese', sub: 'Corrente' },
    { key: 'year', label: 'Anno', sub: String(now.getFullYear()) },
    { key: 'all', label: 'Tutto', sub: 'Globale' },
  ];

  // --- SEZIONE TUTTE LE SPESE PER MESE E ANNO (CON MODIFICA) ---
  const allExpenses = transactions.filter((t) => t.type === 'expense');

  // Extract available years
  const availableYears = Array.from(
    new Set(
      allExpenses
        .map((t) => {
          const d = new Date(t.date);
          return isNaN(d.getTime()) ? '' : String(d.getFullYear());
        })
        .filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  // Months map for labels
  const monthLabels = [
    { id: '01', name: 'Gennaio' },
    { id: '02', name: 'Febbraio' },
    { id: '03', name: 'Marzo' },
    { id: '04', name: 'Aprile' },
    { id: '05', name: 'Maggio' },
    { id: '06', name: 'Giugno' },
    { id: '07', name: 'Luglio' },
    { id: '08', name: 'Agosto' },
    { id: '09', name: 'Settembre' },
    { id: '10', name: 'Ottobre' },
    { id: '11', name: 'Novembre' },
    { id: '12', name: 'Dicembre' },
  ];

  // Filtered list for the explorer
  const explorerExpenses = allExpenses.filter((t) => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return true;
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');

    if (selectedYear !== 'all' && y !== selectedYear) return false;
    if (selectedMonth !== 'all' && m !== selectedMonth) return false;
    return true;
  });

  // Group explorer expenses by "YYYY-MM"
  const groupedByPeriod: Record<string, { label: string; total: number; items: Transaction[] }> = {};

  explorerExpenses.forEach((tx) => {
    const d = new Date(tx.date);
    const key = isNaN(d.getTime()) ? 'Altro' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    let label = key;
    if (key !== 'Altro') {
      const [y, m] = key.split('-');
      const foundMonth = monthLabels.find((ml) => ml.id === m);
      label = `${foundMonth ? foundMonth.name : m} ${y}`;
    }

    if (!groupedByPeriod[key]) {
      groupedByPeriod[key] = { label, total: 0, items: [] };
    }
    groupedByPeriod[key].total += tx.amount;
    groupedByPeriod[key].items.push(tx);
  });

  const sortedPeriodKeys = Object.keys(groupedByPeriod).sort((a, b) => b.localeCompare(a));

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div id="tab-reports" className="w-full space-y-4 pb-4">
      {/* 1. Period Selector (Mese / Anno / Tutto - Settimana rimossa come richiesto) */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-app-card border border-app rounded-2xl shadow-sm">
        {periods.map((p) => {
          const isActive = currentPeriod === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`flex-1 py-2 px-3 text-center rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-app-subtle text-app-main font-mono-code font-bold shadow-sm border border-app'
                  : 'text-app-muted hover:text-app-main font-mono-code text-xs'
              }`}
            >
              <div className="text-[11px] tracking-wider uppercase font-bold">{p.label}</div>
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

      {/* 2. Donut Chart Card */}
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

      {/* 3. Metric Highlights */}
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

      {/* 4. Category Breakdown */}
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

      {/* 5. SEZIONE COMPLETA: TUTTE LE SPESE PER MESE E ANNO (CON MODIFICA) */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-center text-red-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-main font-bold">
                TUTTE LE SPESE // MESE & ANNO
              </div>
              <div className="text-[9px] text-app-muted font-mono-code">
                Visualizza, raggruppa e modifica ogni singola uscita
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {allExpenses.length} spese
          </span>
        </div>

        {/* Year and Month Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-app-subtle">
          <div className="flex items-center gap-1.5 text-app-muted text-[10px] font-mono-code">
            <Filter className="w-3 h-3 text-app-muted" />
            <span>Filtra:</span>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-app-subtle border border-app text-[11px] font-mono-code text-app-main outline-none cursor-pointer"
          >
            <option value="all">Tutti gli anni</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-app-subtle border border-app text-[11px] font-mono-code text-app-main outline-none cursor-pointer"
          >
            <option value="all">Tutti i mesi</option>
            {monthLabels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {(selectedYear !== 'all' || selectedMonth !== 'all') && (
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className="text-[10px] font-mono-code text-red-500 hover:underline cursor-pointer"
            >
              Azzera filtri
            </button>
          )}
        </div>

        {/* Grouped Month/Year Accordions */}
        <div className="space-y-2 pt-1">
          {sortedPeriodKeys.length === 0 ? (
            <div className="text-center py-6 text-app-muted text-xs font-mono-code">
              Nessuna spesa trovata per i criteri selezionati.
            </div>
          ) : (
            sortedPeriodKeys.map((key) => {
              const group = groupedByPeriod[key];
              const isExpanded = expandedGroups[key] !== false; // Default expanded

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-app bg-app-subtle overflow-hidden transition-all"
                >
                  {/* Group header button */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-app-hover transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-app-muted" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-app-muted" />
                      )}
                      <span className="text-xs font-mono-code font-bold text-app-main">
                        {group.label}
                      </span>
                      <span className="text-[10px] font-mono-code text-app-muted">
                        ({group.items.length})
                      </span>
                    </div>

                    <div className="text-xs font-mono-code font-bold text-red-500">
                      -{formatEUR(group.total)}
                    </div>
                  </button>

                  {/* Group items list */}
                  {isExpanded && (
                    <div className="px-2 pb-2.5 space-y-1.5 border-t border-app-subtle pt-2">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-app-card border border-app hover:border-app-hover transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono-code font-medium text-app-main truncate">
                                {item.description}
                              </span>
                              {item.category && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-app-subtle text-app-muted font-mono-code border border-app-subtle">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono-code text-app-muted flex items-center gap-2 mt-0.5">
                              <span>{item.date}</span>
                              {item.location && <span>• {item.location}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono-code font-bold text-red-500">
                              -{formatEUR(item.amount)}
                            </span>

                            {onEditTransaction && (
                              <button
                                type="button"
                                onClick={() => onEditTransaction(item)}
                                className="p-1.5 rounded-lg bg-app-subtle hover:bg-app-hover text-app-muted hover:text-app-main border border-app transition-colors cursor-pointer"
                                title="Modifica Spesa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
