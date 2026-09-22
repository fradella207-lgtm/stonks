/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank,
  Tag,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Edit2,
  Filter,
  Globe,
  History,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction, TimeFilterPeriod } from '../types.ts';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ReportsTabProps {
  transactions: Transaction[];
  currentPeriod: TimeFilterPeriod;
  onPeriodChange: (period: TimeFilterPeriod) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  onEditTransaction,
}) => {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthNumStr = String(now.getMonth() + 1).padStart(2, '0');

  // Multi-Year & Multi-Month Global Selectors
  const [selectedYear, setSelectedYear] = useState<string>('all'); // 'all' or '2026', '2025', etc.
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '01', '02', ..., '12'
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // 1. Dynamically extract all unique years from transactions
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearStr);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 4) {
        const yr = t.date.substring(0, 4);
        if (/^\d{4}$/.test(yr)) {
          set.add(yr);
        }
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [transactions, currentYearStr]);

  // 2. Month label mappings in Italian
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

  // Quick preset filters
  const applyPreset = (preset: 'global' | 'currentYear' | 'currentMonth' | 'prevYear') => {
    if (preset === 'global') {
      setSelectedYear('all');
      setSelectedMonth('all');
    } else if (preset === 'currentYear') {
      setSelectedYear(currentYearStr);
      setSelectedMonth('all');
    } else if (preset === 'currentMonth') {
      setSelectedYear(currentYearStr);
      setSelectedMonth(currentMonthNumStr);
    } else if (preset === 'prevYear') {
      const prevYearStr = String(now.getFullYear() - 1);
      setSelectedYear(prevYearStr);
      setSelectedMonth('all');
    }
  };

  // 3. Dynamically filtered transactions based on Global Year & Month selection
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return true;
      const [yr, mo] = t.date.split('-');
      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Financial aggregates for current filtered scope
  const totalIncome = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filtered]);

  const netBalance = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;

  const incomePct = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 0;
  const expensePct = totalVolume > 0 ? Math.round((totalExpense / totalVolume) * 100) : 0;

  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  // Approximate days count for daily average calculation
  const periodDays = useMemo(() => {
    if (selectedMonth !== 'all') {
      return 30;
    }
    if (selectedYear !== 'all') {
      return 365;
    }
    // Global: calculate days between earliest and latest transaction, min 30
    if (transactions.length > 1) {
      const dates = transactions
        .map((t) => new Date(t.date).getTime())
        .filter((ts) => !isNaN(ts));
      if (dates.length > 0) {
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const diffDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
        return Math.max(30, diffDays);
      }
    }
    return 365;
  }, [selectedMonth, selectedYear, transactions]);

  const dailyAverageExpense = totalExpense / (periodDays || 30);

  // 4. Multi-Year Comparative Statistics Matrix
  const multiYearStats = useMemo(() => {
    return availableYears.map((yr) => {
      const yearTxs = transactions.filter((t) => t.date && t.date.startsWith(yr));
      const inc = yearTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = yearTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
      return {
        year: yr,
        income: inc,
        expense: exp,
        net,
        savingsRate: rate,
        count: yearTxs.length,
      };
    });
  }, [availableYears, transactions]);

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
    .slice(0, 8);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Group all filtered movements by Year/Month
  const groupedMovements = useMemo(() => {
    const list = filtered.filter((t) => {
      if (movementTypeFilter === 'all') return true;
      return t.type === movementTypeFilter;
    });

    const groups: Record<
      string,
      {
        year: string;
        month: string;
        label: string;
        items: Transaction[];
        incomeTotal: number;
        expenseTotal: number;
        netTotal: number;
      }
    > = {};

    list.forEach((tx) => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;

      const yr = String(d.getFullYear());
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yr}-${mo}`;

      const monthName =
        monthLabels.find((m) => m.id === mo)?.name ||
        d.toLocaleDateString('it-IT', { month: 'long' });
      const groupLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${yr}`;

      if (!groups[key]) {
        groups[key] = {
          year: yr,
          month: mo,
          label: groupLabel,
          items: [],
          incomeTotal: 0,
          expenseTotal: 0,
          netTotal: 0,
        };
      }

      groups[key].items.push(tx);
      if (tx.type === 'income') {
        groups[key].incomeTotal += tx.amount;
        groups[key].netTotal += tx.amount;
      } else {
        groups[key].expenseTotal += tx.amount;
        groups[key].netTotal -= tx.amount;
      }
    });

    // Sort items inside each group
    Object.values(groups).forEach((g) => {
      g.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return groups;
  }, [filtered, movementTypeFilter, monthLabels]);

  const sortedPeriodKeys = Object.keys(groupedMovements).sort().reverse();

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Human-readable scope label
  const currentScopeDescription = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return 'Storico Globale (Tutti gli anni & mesi)';
    }
    if (selectedYear !== 'all' && selectedMonth === 'all') {
      return `Anno Intero ${selectedYear}`;
    }
    const mName = monthLabels.find((m) => m.id === selectedMonth)?.name || selectedMonth;
    if (selectedYear === 'all') {
      return `Tutti i ${mName} di ogni anno`;
    }
    return `${mName} ${selectedYear}`;
  }, [selectedYear, selectedMonth, monthLabels]);

  return (
    <div id="tab-reports" className="w-full space-y-4 pb-4">
      {/* 1. Global Navigation & Scope Filter Control */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-app-subtle border border-app flex items-center justify-center text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono-code uppercase tracking-wider text-app-main font-bold flex items-center gap-1.5">
                <span>AMBITO ANALISI REPORT</span>
                <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-mono-code font-normal">
                  Globale
                </span>
              </div>
              <div className="text-[10px] text-app-muted font-mono-code truncate max-w-[220px] sm:max-w-xs">
                {currentScopeDescription}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono-code font-bold text-app-main">
              {filtered.length}
            </span>
            <span className="text-[9px] font-mono-code text-app-muted block">
              movimenti
            </span>
          </div>
        </div>

        {/* Quick Scope Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-app-subtle">
          <button
            type="button"
            onClick={() => applyPreset('global')}
            className={`py-1.5 px-2 rounded-xl text-center text-[10px] font-mono-code transition-all cursor-pointer ${
              selectedYear === 'all' && selectedMonth === 'all'
                ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/40 shadow-sm'
                : 'text-app-muted hover:text-app-main border border-transparent hover:border-app'
            }`}
          >
            🌐 Tutto (Globale)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('currentYear')}
            className={`py-1.5 px-2 rounded-xl text-center text-[10px] font-mono-code transition-all cursor-pointer ${
              selectedYear === currentYearStr && selectedMonth === 'all'
                ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/40 shadow-sm'
                : 'text-app-muted hover:text-app-main border border-transparent hover:border-app'
            }`}
          >
            📅 Quest'anno ({currentYearStr})
          </button>
          <button
            type="button"
            onClick={() => applyPreset('currentMonth')}
            className={`py-1.5 px-2 rounded-xl text-center text-[10px] font-mono-code transition-all cursor-pointer ${
              selectedYear === currentYearStr && selectedMonth === currentMonthNumStr
                ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/40 shadow-sm'
                : 'text-app-muted hover:text-app-main border border-transparent hover:border-app'
            }`}
          >
            🗓️ Questo Mese
          </button>
          <button
            type="button"
            onClick={() => applyPreset('prevYear')}
            className={`py-1.5 px-2 rounded-xl text-center text-[10px] font-mono-code transition-all cursor-pointer ${
              selectedYear === String(now.getFullYear() - 1) && selectedMonth === 'all'
                ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/40 shadow-sm'
                : 'text-app-muted hover:text-app-main border border-transparent hover:border-app'
            }`}
          >
            ⏪ Anno Scorso ({now.getFullYear() - 1})
          </button>
        </div>

        {/* Detailed Dropdowns for specific year and month */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-app-subtle">
          <div className="flex items-center gap-1.5 text-app-muted text-[10px] font-mono-code">
            <Filter className="w-3 h-3" />
            <span>Filtro Diretto:</span>
          </div>

          {/* Year selector with all historical years */}
          <select
            id="select-report-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-app-subtle border border-app text-xs font-mono-code text-app-main outline-none cursor-pointer focus:border-emerald-500 transition-colors"
          >
            <option value="all">Tutti gli anni (Storico)</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Anno {yr}
              </option>
            ))}
          </select>

          {/* Month selector */}
          <select
            id="select-report-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-app-subtle border border-app text-xs font-mono-code text-app-main outline-none cursor-pointer focus:border-emerald-500 transition-colors"
          >
            <option value="all">Tutti i mesi (Annuale)</option>
            {monthLabels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {(selectedYear !== 'all' || selectedMonth !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className="flex items-center gap-1 text-[10px] font-mono-code text-red-500 hover:text-red-400 hover:underline cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Azzera</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Donut Chart Card */}
      <div className="rounded-3xl border border-app bg-app-card p-5 shadow-sm backdrop-blur-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted font-bold">
            RAPPORTO ENTRATE // USCITE
          </div>
          <div className="text-[10px] font-mono-code px-2.5 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {currentScopeDescription}
          </div>
        </div>

        {/* Doughnut with center statistics */}
        <div className="relative h-48 w-full flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />

          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] font-mono-code uppercase tracking-widest text-app-muted">
              Bilancio Netto
            </span>
            <div
              className={`font-mono-code text-lg font-bold ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatEUR(netBalance)}
            </div>
            <span className="text-[10px] text-app-muted font-mono-code">
              {totalVolume > 0 ? `Vol: ${formatEUR(totalVolume)}` : 'Nessun dato'}
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
            Calcolo su ~{periodDays} gg
          </p>
        </div>
      </div>

      {/* 4. Multi-Year Comparative Matrix (Panoramica Storica per Anno) */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-app-subtle border border-app flex items-center justify-center text-app-muted">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-main font-bold">
                STORICO PLURIENNALE // COMPARAZIONE ANNI
              </div>
              <div className="text-[9px] text-app-muted font-mono-code">
                Confronto delle prestazioni anno per anno
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {availableYears.length} {availableYears.length === 1 ? 'anno' : 'anni'}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {multiYearStats.map((st) => {
            const isSelected = selectedYear === st.year;
            return (
              <div
                key={st.year}
                onClick={() => {
                  setSelectedYear(st.year);
                  setSelectedMonth('all');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/10 shadow-sm'
                    : 'border-app bg-app-subtle hover:bg-app-hover hover:border-app-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono-code font-bold text-app-main">
                      {st.year}
                    </span>
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded-full bg-app-card border border-app text-app-muted">
                      {st.count} mov.
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold">
                        Attivo
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-mono-code font-bold ${
                        st.net >= 0 ? 'text-emerald-400' : 'text-red-500'
                      }`}
                    >
                      {st.net >= 0 ? '+' : ''}
                      {formatEUR(st.net)}
                    </span>
                    <span className="text-[9px] font-mono-code text-app-muted block">
                      Risparmio: {st.savingsRate}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-app/50 text-[10px] font-mono-code">
                  <div className="flex items-center justify-between text-emerald-400/90">
                    <span>Entrate:</span>
                    <span>+{formatEUR(st.income)}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-400/90">
                    <span>Uscite:</span>
                    <span>-{formatEUR(st.expense)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Category Breakdown */}
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

      {/* 6. Detailed Movement Explorer by Month & Year */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-sm transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-app-subtle border border-app flex items-center justify-center text-app-muted">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono-code uppercase tracking-widest text-app-main font-bold">
                ESPLORA MOVIMENTI // TUTTI I MESI
              </div>
              <div className="text-[9px] text-app-muted font-mono-code">
                Raggruppati per mese e anno con modifica rapida
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {filtered.length} voci
          </span>
        </div>

        {/* Filter by Type inside Explorer */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-app-subtle">
          {(
            [
              { key: 'all', label: 'Tutti' },
              { key: 'expense', label: 'Solo Uscite (-)' },
              { key: 'income', label: 'Solo Entrate (+)' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setMovementTypeFilter(item.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer whitespace-nowrap ${
                movementTypeFilter === item.key
                  ? 'bg-app-card text-app-main border border-emerald-500 font-bold shadow-sm'
                  : 'bg-app-subtle text-app-muted hover:text-app-main border border-app'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Grouped Month/Year Accordions */}
        <div className="space-y-2 pt-1">
          {sortedPeriodKeys.length === 0 ? (
            <div className="text-center py-6 text-app-muted text-xs font-mono-code">
              Nessun movimento registrato per il periodo selezionato.
            </div>
          ) : (
            sortedPeriodKeys.map((key) => {
              const group = groupedMovements[key];
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

                    <div className="text-right">
                      <div
                        className={`text-xs font-mono-code font-bold ${
                          group.netTotal >= 0 ? 'text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {group.netTotal >= 0 ? '+' : ''}
                        {formatEUR(group.netTotal)}
                      </div>
                    </div>
                  </button>

                  {/* Group items list */}
                  {isExpanded && (
                    <div className="px-2 pb-2.5 space-y-1.5 border-t border-app-subtle pt-2">
                      {group.items.map((item) => {
                        const isIncome = item.type === 'income';
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-app-card border border-app hover:border-app-hover transition-colors group"
                          >
                            <div className="min-w-0 pr-2 flex items-center gap-2.5">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${
                                  isIncome
                                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-950/20 border-red-500/30 text-red-400'
                                }`}
                              >
                                {isIncome ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
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
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-xs font-mono-code font-bold ${
                                  isIncome ? 'text-emerald-400' : 'text-red-500'
                                }`}
                              >
                                {isIncome ? '+' : '-'}
                                {formatEUR(item.amount)}
                              </span>

                              {onEditTransaction && (
                                <button
                                  type="button"
                                  onClick={() => onEditTransaction(item)}
                                  className="p-1.5 rounded-lg bg-app-subtle hover:bg-app-hover text-app-muted hover:text-app-main border border-app transition-colors cursor-pointer"
                                  title="Modifica Movimento"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
