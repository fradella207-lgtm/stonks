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
  Tag,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  BarChart3,
  Search,
  Filter,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { Transaction, TimeFilterPeriod } from '../types.ts';
import { useLanguage } from '../services/i18n.ts';

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
  const { language, t } = useLanguage();
  const now = new Date();
  const currentYearStr = String(now.getFullYear());

  const locale = useMemo(() => {
    return language === 'it'
      ? 'it-IT'
      : language === 'es'
      ? 'es-ES'
      : language === 'fr'
      ? 'fr-FR'
      : language === 'de'
      ? 'de-DE'
      : 'en-US';
  }, [language]);

  // Multi-Year & Multi-Month State
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [isDateFilterOpen, setIsDateFilterOpen] = useState<boolean>(false); // Closed by default as requested

  // Search & Multi-Select Category Filters for Reports
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState<boolean>(false);

  // Delete confirmation state for individual items
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all distinct categories available across transactions
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category && tx.category.trim()) {
        cats.add(tx.category.trim());
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
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 4) {
        const yr = tx.date.substring(0, 4);
        if (/^\d{4}$/.test(yr)) {
          years.add(yr);
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions, currentYearStr]);

  // Localized Months definition
  const months = useMemo(() => {
    const list = [{ id: 'all', short: t('filter_all') }];
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, m, 1);
      const id = String(m + 1).padStart(2, '0');
      const short = d.toLocaleDateString(locale, { month: 'short' });
      list.push({ id, short });
    }
    return list;
  }, [locale, t]);

  // Filtered data according to chosen year & month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return true;
      const [yr, mo] = tx.date.split('-');
      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedMonth !== 'all' && mo !== selectedMonth) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Aggregates
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;
  const totalVolume = totalIncome + totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  // Doughnut Chart Data
  const doughnutData = {
    labels: [t('income'), t('expenses')],
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
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const cat = tx.category || tx.description || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + tx.amount;
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Grouped monthly breakdowns
  const groupedMonths = useMemo(() => {
    const list = filteredTransactions.filter((tx) => {
      // Filter by movement type
      if (movementTypeFilter !== 'all' && tx.type !== movementTypeFilter) return false;

      // Filter by selected categories
      if (selectedCategories.length > 0) {
        if (!tx.category || !selectedCategories.includes(tx.category.trim())) return false;
      }

      // Filter by search query
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = tx.category && tx.category.toLowerCase().includes(q);
        const matchLoc = tx.location && tx.location.toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        const matchDate = tx.date.includes(q);
        if (!matchDesc && !matchCat && !matchLoc && !matchAmt && !matchDate) return false;
      }

      return true;
    });

    const groups: Record<
      string,
      { label: string; items: Transaction[]; netTotal: number }
    > = {};

    list.forEach((tx) => {
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const key = tx.date.substring(0, 7);
      const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = { label, items: [], netTotal: 0 };
      }
      groups[key].items.push(tx);
      groups[key].netTotal += tx.type === 'income' ? tx.amount : -tx.amount;
    });

    return groups;
  }, [filteredTransactions, movementTypeFilter, selectedCategories, reportSearchQuery, locale]);

  const sortedGroupKeys = Object.keys(groupedMonths).sort().reverse();

  return (
    <div id="tab-reports" className="w-full space-y-4 pb-12">
      {/* 1. Sleek Minimalist Scope Selector - Closed by default as requested */}
      <div className="rounded-3xl border border-app bg-app-card backdrop-blur-md shadow-sm transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setIsDateFilterOpen((prev) => !prev)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-app-subtle/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-app-subtle border border-app flex items-center justify-center text-emerald-500 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-app-main block">
                {t('filter_month_year')}
              </span>
              <span className="text-[10px] font-mono-code text-app-muted">
                {selectedYear === 'all' && selectedMonth === 'all'
                  ? t('filter_all')
                  : `${selectedMonth !== 'all' ? months.find((m) => m.id === selectedMonth)?.short : t('filter_all')} • ${selectedYear !== 'all' ? selectedYear : t('filter_all')}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(selectedYear !== 'all' || selectedMonth !== 'all') && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold">
                {selectedYear !== 'all' ? selectedYear : ''} {selectedMonth !== 'all' ? months.find((m) => m.id === selectedMonth)?.short : ''}
              </span>
            )}
            {isDateFilterOpen ? (
              <ChevronDown className="w-4 h-4 text-app-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-app-muted" />
            )}
          </div>
        </button>

        {isDateFilterOpen && (
          <div className="p-3.5 sm:p-4 pt-1 border-t border-app-subtle space-y-2.5 animate-in fade-in duration-150">
            {/* Year Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[10px] font-mono-code uppercase text-app-muted font-bold tracking-wider mr-1 shrink-0">
                {t('filter_year')}:
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
                {t('filter_all')}
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

            {/* Month Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1.5 border-t border-app-subtle">
              <span className="text-[10px] font-mono-code uppercase text-app-muted font-bold tracking-wider mr-1 shrink-0">
                {t('filter_month')}:
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
        )}
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
                {t('breakdown_by_category')}
              </span>
              <span className="text-[10px] font-mono-code text-app-muted">
                {savingsRate >= 0 ? `+${savingsRate}%` : `${savingsRate}%`}
              </span>
            </div>

            {/* Doughnut Canvas */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono-code uppercase text-app-muted">{t('net_balance')}</span>
                <span className={`text-base sm:text-lg font-mono-code font-black ${netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {netBalance >= 0 ? '+' : ''}{formatEUR(netBalance)}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-app-subtle">
              <div className="p-2.5 rounded-xl bg-app-subtle border border-app">
                <div className="text-[9px] font-mono-code uppercase text-app-muted">{t('total_inflow')}</div>
                <div className="text-xs font-mono-code font-bold text-emerald-500 mt-0.5">
                  +{formatEUR(totalIncome)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-app-subtle border border-app">
                <div className="text-[9px] font-mono-code uppercase text-app-muted">{t('total_outflow')}</div>
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
                  {t('breakdown_by_category')}
                </span>
                <span className="text-[10px] font-mono-code text-app-muted">
                  {sortedCategories.length}
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

        {/* Right Column: Full Itemized Ledger & Filter Controls */}
        <div className="md:col-span-7 space-y-3">
          {/* Search & Category Filter Controls */}
          <div className="p-3.5 rounded-3xl bg-app-card border border-app space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
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
                    { key: 'all', label: t('filter_all') },
                    { key: 'expense', label: t('expenses') },
                    { key: 'income', label: t('income') },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMovementTypeFilter(item.key)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-mono-code transition-all cursor-pointer ${
                      movementTypeFilter === item.key
                        ? 'bg-app-subtle text-app-main font-bold border border-app'
                        : 'text-app-muted hover:text-app-main'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {allCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCategoryFilterOpen((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono-code border transition-colors cursor-pointer shrink-0 ${
                    selectedCategories.length > 0
                      ? 'bg-red-950/30 border-red-500/40 text-red-400 font-bold'
                      : 'bg-app-subtle border-app text-app-muted hover:text-app-main'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{t('category_label')}</span>
                  {selectedCategories.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Category Dropdown Multi-Select */}
            {isCategoryFilterOpen && allCategories.length > 0 && (
              <div className="pt-2 border-t border-app-subtle flex flex-wrap gap-1.5 animate-in fade-in">
                {allCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-code transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white font-bold'
                          : 'bg-app-subtle text-app-muted hover:text-app-main border border-app'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ledger Months List */}
          <div className="space-y-2.5">
            {sortedGroupKeys.length === 0 ? (
              <div className="p-8 rounded-3xl bg-app-card border border-app text-center text-app-muted font-mono-code text-xs">
                {t('no_transactions_found')}
              </div>
            ) : (
              sortedGroupKeys.map((key) => {
                const group = groupedMonths[key];
                const isExpanded = !!expandedMonths[key]; // collapsed by default as requested

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-app bg-app-card overflow-hidden shadow-xs"
                  >
                    {/* Month Group Header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMonths((prev) => ({
                          ...prev,
                          [key]: !isExpanded,
                        }))
                      }
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-app-subtle/50 transition-colors cursor-pointer"
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
                                    title={t('edit')}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Button with Inline Confirmation */}
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
                                          title={t('confirm_delete')}
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>{t('delete_action')}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="p-1 text-app-muted hover:text-app-main transition-colors cursor-pointer"
                                          title={t('cancel_action')}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(item.id)}
                                        className="p-1.5 rounded-lg text-app-muted hover:text-red-500 hover:bg-red-950/20 transition-colors cursor-pointer"
                                        title={t('delete')}
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
