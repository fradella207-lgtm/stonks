/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  PiggyBank,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  Edit2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Search,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { Transaction, TimeFilterPeriod } from '../types.ts';

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

interface ReportsTabProps {
  transactions: Transaction[];
  currentPeriod?: TimeFilterPeriod;
  onPeriodChange?: (period: TimeFilterPeriod) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  onEditTransaction,
}) => {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthNumStr = String(now.getMonth() + 1).padStart(2, '0');

  // Multi-Year & Multi-Month State
  const [selectedYear, setSelectedYear] = useState<string>('all'); // 'all' | '2026' | '2025' ...
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' | '01' ... '12'
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Search & Multi-Select Category Filters for Reports
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState<boolean>(false);

  // Extract all distinct categories available across transactions
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category && t.category.trim()) {
        cats.add(t.category.trim());
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Toggle multi-select category
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // 1. Dynamically extract all available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYearStr);
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 4) {
        const yr = t.date.substring(0, 4);
        if (/^\d{4}$/.test(yr)) {
          years.add(yr);
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions, currentYearStr]);

  // Months definition
  const months = [
    { id: 'all', short: 'Tutto' },
    { id: '01', short: 'Gen' },
    { id: '02', short: 'Feb' },
    { id: '03', short: 'Mar' },
    { id: '04', short: 'Apr' },
    { id: '05', short: 'Mag' },
    { id: '06', short: 'Giu' },
    { id: '07', short: 'Lug' },
    { id: '08', short: 'Ago' },
    { id: '09', short: 'Set' },
    { id: '10', short: 'Ott' },
    { id: '11', short: 'Nov' },
    { id: '12', short: 'Dic' },
  ];

  // 2. Filtered data according to chosen year & month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return true;
      const [yr, mo] = t.date.split('-');
      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Aggregates
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  const daysCount = useMemo(() => {
    if (selectedMonth !== 'all') return 30;
    if (selectedYear !== 'all') return 365;
    return Math.max(30, availableYears.length * 365);
  }, [selectedMonth, selectedYear, availableYears]);

  const dailyAverageExpense = totalExpense / daysCount;

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Entrate', 'Uscite'],
    datasets: [
      {
        data: totalVolume > 0 ? [totalIncome, totalExpense] : [1, 1],
        backgroundColor:
          totalVolume > 0
            ? ['#10b981', '#ef4444']
            : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.08)'],
        borderColor: '#121214',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: totalVolume > 0,
        backgroundColor: '#18181b',
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

  // Top Categories
  const categoryMap: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || t.description || 'Altro';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Multi-Year Summary Matrix
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

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Grouped monthly breakdowns
  const groupedMonths = useMemo(() => {
    const list = filteredTransactions.filter((t) => {
      // Filter by movement type (all, expense, income)
      if (movementTypeFilter !== 'all' && t.type !== movementTypeFilter) return false;

      // Filter by selected categories (multi-select)
      if (selectedCategories.length > 0) {
        if (!t.category || !selectedCategories.includes(t.category.trim())) return false;
      }

      // Filter by search query
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category && t.category.toLowerCase().includes(q);
        const matchLoc = t.location && t.location.toLowerCase().includes(q);
        const matchAmt = t.amount.toString().includes(q);
        const matchDate = t.date.includes(q);
        if (!matchDesc && !matchCat && !matchLoc && !matchAmt && !matchDate) return false;
      }

      return true;
    });

    const groups: Record<
      string,
      { label: string; items: Transaction[]; netTotal: number }
    > = {};

    list.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = t.date.substring(0, 7);
      const label = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = { label: label.charAt(0).toUpperCase() + label.slice(1), items: [], netTotal: 0 };
      }
      groups[key].items.push(t);
      groups[key].netTotal += t.type === 'income' ? t.amount : -t.amount;
    });

    return groups;
  }, [filteredTransactions, movementTypeFilter, selectedCategories, reportSearchQuery]);

  const totalMatchingExplorerItems = useMemo(() => {
    return Object.values(groupedMonths).reduce((acc, g) => acc + g.items.length, 0);
  }, [groupedMonths]);

  const sortedGroupKeys = Object.keys(groupedMonths).sort().reverse();

  return (
    <div id="tab-reports" className="w-full space-y-4 pb-6">
      {/* 1. Sleek Minimalist Scope Selector */}
      <div className="rounded-3xl border border-app bg-app-card p-3.5 backdrop-blur-md shadow-sm transition-all space-y-2.5">
        {/* Year Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] font-mono-code uppercase text-app-muted font-bold tracking-wider mr-1 shrink-0">
            ANNO:
          </span>

          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono-code transition-all cursor-pointer whitespace-nowrap ${
              selectedYear === 'all'
                ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/50 shadow-xs'
                : 'text-app-muted hover:text-app-main border border-transparent'
            }`}
          >
            Globale (Tutti)
          </button>

          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-code transition-all cursor-pointer whitespace-nowrap ${
                selectedYear === yr
                  ? 'bg-app-subtle text-app-main font-bold border border-emerald-500/50 shadow-xs'
                  : 'text-app-muted hover:text-app-main border border-transparent'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Month Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1.5 border-t border-app-subtle">
          <span className="text-[10px] font-mono-code uppercase text-app-muted font-bold tracking-wider mr-1 shrink-0">
            MESE:
          </span>
          {months.map((m) => {
            const isSelected = selectedMonth === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMonth(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-code transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-app-subtle text-app-main font-bold border border-app shadow-xs'
                    : 'text-app-muted hover:text-app-main'
                }`}
              >
                {m.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hero Chart Card: Doughnut + Central Net Typography */}
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-app bg-app-card p-5 backdrop-blur-md shadow-sm transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted font-bold">
            FLUSSO ECONOMICO // BILANCIO
          </span>
          <span className="text-[10px] font-mono-code px-2.5 py-0.5 rounded-full bg-app-subtle border border-app text-app-sub">
            {selectedYear === 'all' && selectedMonth === 'all'
              ? 'Tutto lo Storico'
              : selectedMonth === 'all'
              ? `Anno ${selectedYear}`
              : `${months.find((m) => m.id === selectedMonth)?.short} ${selectedYear}`}
          </span>
        </div>

        {/* Circular Chart with Center HUD */}
        <div className="relative h-48 w-full flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />

          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] font-mono-code uppercase tracking-widest text-app-muted">
              Risultato Netto
            </span>
            <div
              className={`font-mono-code text-2xl font-black tracking-tight ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatEUR(netBalance)}
            </div>
            <span className="text-[10px] text-app-muted font-mono-code mt-0.5">
              Volume: {formatEUR(totalVolume)}
            </span>
          </div>
        </div>

        {/* Legend Tiles (Stacked layout with amount under title to eliminate horizontal squeeze) */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-app-subtle">
          <div className="p-3 rounded-2xl bg-app-subtle border border-app flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0" />
              <span className="text-xs font-mono-code text-app-muted uppercase font-bold tracking-wider truncate">
                Entrate
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono-code font-bold text-emerald-400 truncate">
              +{formatEUR(totalIncome)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-app-subtle border border-app flex flex-col justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] shrink-0" />
              <span className="text-xs font-mono-code text-app-muted uppercase font-bold tracking-wider truncate">
                Uscite
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono-code font-bold text-red-500 truncate">
              -{formatEUR(totalExpense)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. KPI Highlights Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Tasso di Risparmio */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Tasso Risparmio
            </span>
            <PiggyBank className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div
            className={`font-mono-code text-2xl font-black ${
              savingsRate >= 0 ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {savingsRate}%
          </div>
          <p className="text-[10px] text-app-muted font-mono-code mt-1">
            {savingsRate >= 20 ? 'Ottimo margine' : savingsRate >= 0 ? 'In pareggio' : 'In disavanzo'}
          </p>
        </div>

        {/* Media Die Spesa */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Media Giornaliera
            </span>
            <Calendar className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div className="font-mono-code text-2xl font-black text-app-main">
            {formatEUR(dailyAverageExpense)}
          </div>
          <p className="text-[10px] text-app-muted font-mono-code mt-1">
            Spesa media calcolata
          </p>
        </div>
      </div>

      {/* 4. Multi-Year Historical Performance (Storico Annuale Comparativo) */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-app-main font-bold flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-app-muted" />
            <span>STORICO ANNUALE COMPARATIVO</span>
          </span>
          <span className="text-[10px] font-mono-code text-app-muted">
            {availableYears.length} anni
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {multiYearStats.map((st) => {
            const isSelected = selectedYear === st.year;
            return (
              <div
                key={st.year}
                onClick={() => {
                  setSelectedYear(st.year);
                  setSelectedMonth('all');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-950/15 shadow-xs'
                    : 'border-app bg-app-subtle hover:bg-app-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code font-bold text-app-main">
                    {st.year}
                  </span>
                  <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-app-card border border-app text-app-muted">
                    {st.count} mov.
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold">
                      Attivo
                    </span>
                  )}
                </div>

                <div className="text-right flex items-center gap-3">
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
                  <ChevronRight className="w-3.5 h-3.5 text-app-muted" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Category Breakdown with Visual Bars */}
      {sortedCategories.length > 0 && (
        <div className="rounded-3xl border border-app bg-app-card p-4.5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-code uppercase tracking-widest text-app-muted font-bold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-app-muted" />
              <span>SPESE PER CATEGORIA</span>
            </span>
            <span className="text-[10px] font-mono-code text-app-muted">
              Top {sortedCategories.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedCategories.map(([cat, amount]) => {
              const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono-code gap-2">
                    <span className="text-app-main font-medium truncate flex-1 min-w-0">{cat}</span>
                    <span className="text-red-400 font-bold shrink-0">
                      {formatEUR(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-app-subtle overflow-hidden border border-app-subtle">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Grouped Movements by Month Explorer */}
      <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-app-main font-bold">
            DETTAGLIO MENSILE // LISTA
          </span>
          <span className="text-[10px] font-mono-code text-app-muted">
            {totalMatchingExplorerItems} voci
          </span>
        </div>

        {/* Search input in Reports */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-muted" />
          <input
            id="input-search-reports"
            type="text"
            placeholder="Cerca per voce, categoria, luogo o importo..."
            value={reportSearchQuery}
            onChange={(e) => setReportSearchQuery(e.target.value)}
            className="w-full bg-app-subtle border border-app rounded-2xl pl-9 pr-8 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/60 outline-none focus:border-emerald-500 transition-colors"
          />
          {reportSearchQuery && (
            <button
              type="button"
              onClick={() => setReportSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-main p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls row: Type pills + Multi-Category selector button */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-app-subtle">
          {/* Type pills inside explorer */}
          <div className="flex items-center gap-1">
            {(
              [
                { key: 'all', label: 'Tutti' },
                { key: 'expense', label: 'Uscite' },
                { key: 'income', label: 'Entrate' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMovementTypeFilter(item.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code transition-all cursor-pointer ${
                  movementTypeFilter === item.key
                    ? 'bg-app-card text-app-main border border-emerald-500 font-bold shadow-xs'
                    : 'bg-app-subtle text-app-muted hover:text-app-main border border-app'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Category Multi-Select Button */}
          {allCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCategoryFilterOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono-code border transition-all cursor-pointer ${
                selectedCategories.length > 0
                  ? 'bg-red-600/15 border-red-500/50 text-red-500 font-bold shadow-xs'
                  : isCategoryFilterOpen
                  ? 'bg-app-card border-app text-app-main'
                  : 'bg-app-subtle border-app text-app-muted hover:text-app-main'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>
                {selectedCategories.length > 0
                  ? `Categorie (${selectedCategories.length})`
                  : 'Filtro Categoria'}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  isCategoryFilterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>

        {/* Category Multi-Select Panel */}
        {isCategoryFilterOpen && allCategories.length > 0 && (
          <div className="p-3 rounded-2xl bg-app-subtle border border-app space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-mono-code">
              <span className="text-app-muted font-bold uppercase tracking-wider text-[10px]">
                Categorie selezionate ({selectedCategories.length}/{allCategories.length})
              </span>
              <div className="flex items-center gap-2">
                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                  >
                    Resetta
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategories(
                      selectedCategories.length === allCategories.length ? [] : [...allCategories]
                    )
                  }
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  {selectedCategories.length === allCategories.length
                    ? 'Deseleziona tutti'
                    : 'Seleziona tutti'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar pt-0.5">
              {allCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono-code transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white font-bold shadow-xs'
                        : 'bg-app-card text-app-muted hover:text-app-main border border-app'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month Accordion List (Default Closed) */}
        <div className="space-y-1.5 pt-1">
          {sortedGroupKeys.length === 0 ? (
            <div className="text-center py-6 text-app-muted text-xs font-mono-code">
              Nessun movimento trovato con i filtri attuali.
            </div>
          ) : (
            sortedGroupKeys.map((key) => {
              const group = groupedMonths[key];
              // Default to closed: only open if user explicitly toggled it to true
              const isExpanded = !!expandedMonths[key];

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-app bg-app-subtle overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMonths((prev) => ({
                        ...prev,
                        [key]: !isExpanded,
                      }))
                    }
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

                    <span
                      className={`text-xs font-mono-code font-bold ${
                        group.netTotal >= 0 ? 'text-emerald-400' : 'text-red-500'
                      }`}
                    >
                      {group.netTotal >= 0 ? '+' : ''}
                      {formatEUR(group.netTotal)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-2 pb-2 space-y-1 border-t border-app-subtle pt-1.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-app-card border border-app"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-mono-code text-app-main font-medium truncate block">
                              {item.description}
                            </span>
                            <span className="text-[10px] font-mono-code text-app-muted">
                              {item.date} {item.category && `• ${item.category}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-mono-code font-bold ${
                                item.type === 'income' ? 'text-emerald-400' : 'text-red-500'
                              }`}
                            >
                              {item.type === 'income' ? '+' : '-'}
                              {formatEUR(item.amount)}
                            </span>

                            {onEditTransaction && (
                              <button
                                type="button"
                                onClick={() => onEditTransaction(item)}
                                className="p-1 rounded-md text-app-muted hover:text-app-main hover:bg-app-subtle"
                                title="Modifica"
                              >
                                <Edit2 className="w-3 h-3" />
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
