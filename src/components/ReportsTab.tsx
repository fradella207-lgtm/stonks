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
  Trash2,
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
  onDeleteTransaction?: (id: string) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());

  // Multi-Year & Multi-Month State
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Search & Multi-Select Category Filters for Reports
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState<boolean>(false);

  // Delete confirmation state for individual items
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  // Dynamically extract all available years
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

  // English Months definition
  const months = [
    { id: 'all', short: 'All' },
    { id: '01', short: 'Jan' },
    { id: '02', short: 'Feb' },
    { id: '03', short: 'Mar' },
    { id: '04', short: 'Apr' },
    { id: '05', short: 'May' },
    { id: '06', short: 'Jun' },
    { id: '07', short: 'Jul' },
    { id: '08', short: 'Aug' },
    { id: '09', short: 'Sep' },
    { id: '10', short: 'Oct' },
    { id: '11', short: 'Nov' },
    { id: '12', short: 'Dec' },
  ];

  // Filtered data according to chosen year & month
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
    labels: ['Income', 'Expenses'],
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
      const cat = t.category || t.description || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Grouped monthly breakdowns
  const groupedMonths = useMemo(() => {
    const list = filteredTransactions.filter((t) => {
      // Filter by movement type
      if (movementTypeFilter !== 'all' && t.type !== movementTypeFilter) return false;

      // Filter by selected categories
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
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = { label, items: [], netTotal: 0 };
      }
      groups[key].items.push(t);
      groups[key].netTotal += t.type === 'income' ? t.amount : -t.amount;
    });

    return groups;
  }, [filteredTransactions, movementTypeFilter, selectedCategories, reportSearchQuery]);

  const sortedGroupKeys = Object.keys(groupedMonths).sort().reverse();

  return (
    <div id="tab-reports" className="w-full space-y-4 pb-12">
      {/* 1. Sleek Minimalist Scope Selector */}
      <div className="rounded-3xl border border-app bg-app-card p-3.5 sm:p-4 backdrop-blur-md shadow-sm transition-all space-y-2.5">
        {/* Year Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] font-mono-code uppercase text-app-muted font-bold tracking-wider mr-1 shrink-0">
            YEAR:
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
            All Years
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
            MONTH:
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

      {/* Tablet 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Column: Visual Analytics & Doughnut (Mobile: full, Tablet: 5/12) */}
        <div className="md:col-span-5 space-y-4">
          {/* Doughnut Chart Card */}
          <div className="rounded-3xl border border-app bg-app-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-app-subtle pb-3">
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-app-main flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Cashflow Breakdown
              </span>
              <span className="text-[10px] font-mono-code text-app-muted">
                {savingsRate >= 0 ? `+${savingsRate}% saved` : `${savingsRate}%`}
              </span>
            </div>

            {/* Doughnut Canvas */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono-code uppercase text-app-muted">Net Result</span>
                <span className={`text-base sm:text-lg font-mono-code font-black ${netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {netBalance >= 0 ? '+' : ''}{formatEUR(netBalance)}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-app-subtle">
              <div className="p-2.5 rounded-xl bg-app-subtle border border-app">
                <div className="text-[9px] font-mono-code uppercase text-app-muted">Total Income</div>
                <div className="text-xs font-mono-code font-bold text-emerald-500 mt-0.5">
                  +{formatEUR(totalIncome)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-app-subtle border border-app">
                <div className="text-[9px] font-mono-code uppercase text-app-muted">Total Outflow</div>
                <div className="text-xs font-mono-code font-bold text-red-500 mt-0.5">
                  -{formatEUR(totalExpense)}
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories Breakdown */}
          {sortedCategories.length > 0 && (
            <div className="rounded-3xl border border-app bg-app-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-app-subtle pb-2.5">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-app-main flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-app-muted" />
                  Top Spending Categories
                </span>
                <span className="text-[10px] font-mono-code text-app-muted">
                  {sortedCategories.length} tracked
                </span>
              </div>

              <div className="space-y-2">
                {sortedCategories.map(([category, amount]) => {
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono-code">
                        <span className="text-app-sub truncate max-w-[150px]">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-app-muted">{pct}%</span>
                          <span className="font-bold text-red-400">-{formatEUR(amount)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1 rounded-full bg-app-subtle overflow-hidden">
                        <div
                          className="h-full bg-red-500/80 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Full Itemized Ledger & Filter Controls (Mobile: full, Tablet: 7/12) */}
        <div className="md:col-span-7 space-y-3">
          {/* Search & Category Filter Controls */}
          <div className="p-3.5 rounded-3xl bg-app-card border border-app space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                placeholder="Search description, category, place, amount..."
                className="w-full bg-app-subtle border border-app rounded-2xl pl-10 pr-9 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/60 outline-none focus:border-red-500 transition-colors"
              />
              {reportSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReportSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-main cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type & Category Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'expense', label: 'Expenses' },
                    { key: 'income', label: 'Income' },
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

              {/* Category Filter Toggle */}
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
                      ? `Categories (${selectedCategories.length})`
                      : 'Categories'}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isCategoryFilterOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Category Dropdown Selection Panel */}
            {isCategoryFilterOpen && allCategories.length > 0 && (
              <div className="p-3 rounded-2xl bg-app-subtle border border-app space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-mono-code">
                  <span className="text-app-muted font-bold uppercase tracking-wider text-[10px]">
                    Filter by Categories
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                      >
                        Reset
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
                      {selectedCategories.length === allCategories.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar pt-1">
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
          </div>

          {/* Month Accordion List */}
          <div className="space-y-2">
            {sortedGroupKeys.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-app rounded-3xl bg-app-card/60 p-6 text-app-muted text-xs font-mono-code">
                No transactions found for the selected timeframe and filters.
              </div>
            ) : (
              sortedGroupKeys.map((key) => {
                const group = groupedMonths[key];
                // Default expanded for current / first month if only 1, otherwise user controls
                const isExpanded = expandedMonths[key] ?? (sortedGroupKeys.length === 1);

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-app bg-app-card overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMonths((prev) => ({
                          ...prev,
                          [key]: !isExpanded,
                        }))
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-app-subtle transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-app-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-app-muted" />
                        )}
                        <span className="text-xs font-mono-code font-bold text-app-main capitalize">
                          {group.label}
                        </span>
                        <span className="text-[10px] font-mono-code text-app-muted">
                          ({group.items.length})
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono-code font-bold ${
                          group.netTotal >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {group.netTotal >= 0 ? '+' : ''}
                        {formatEUR(group.netTotal)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-1.5 border-t border-app-subtle pt-2">
                        {group.items.map((item) => {
                          const isConfirming = confirmDeleteId === item.id;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-app-subtle border border-app hover:border-app-subtle transition-all"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-mono-code text-app-main font-semibold truncate">
                                  {item.description}
                                </div>
                                <div className="text-[10px] font-mono-code text-app-muted flex items-center gap-1.5 mt-0.5">
                                  <span>{item.date}</span>
                                  {item.category && <span>• {item.category}</span>}
                                  {item.location && <span>• {item.location}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-xs font-mono-code font-bold ${
                                    item.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                                  }`}
                                >
                                  {item.type === 'income' ? '+' : '-'}
                                  {formatEUR(item.amount)}
                                </span>

                                {/* Quick Edit Button */}
                                {onEditTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onEditTransaction(item)}
                                    className="p-1.5 rounded-lg text-app-muted hover:text-app-main hover:bg-app-card transition-colors cursor-pointer"
                                    title="Edit Transaction"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Robust Delete Button with Inline Confirmation (Requirement: sistemare tasto elimina) */}
                                {onDeleteTransaction && (
                                  <>
                                    {isConfirming ? (
                                      <div className="flex items-center gap-1 bg-red-950/40 border border-red-500/50 rounded-xl p-1 animate-in">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onDeleteTransaction(item.id);
                                            setConfirmDeleteId(null);
                                          }}
                                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-mono-code font-bold transition-all cursor-pointer flex items-center gap-0.5 active:scale-95"
                                          title="Confirm Delete"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Delete</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="p-1 text-app-muted hover:text-app-main transition-colors cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(item.id)}
                                        className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-red-950/20 transition-colors cursor-pointer"
                                        title="Delete Transaction"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
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
    </div>
  );
};
