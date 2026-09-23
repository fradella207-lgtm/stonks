/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Target,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { Transaction } from '../types.ts';
import { useLanguage } from '../services/i18n.ts';

interface FinancialTelematicsCardProps {
  transactions: Transaction[];
  monthlyBudget: number;
  onUpdateMonthlyBudget: (amount: number) => void;
}

export const FinancialTelematicsCard: React.FC<FinancialTelematicsCardProps> = ({
  transactions,
  monthlyBudget,
  onUpdateMonthlyBudget,
}) => {
  const { language, t } = useLanguage();
  const now = new Date();

  const currentMonthStr = useMemo(() => {
    return now.toISOString().substring(0, 7);
  }, [now]);

  // Current month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.month === currentMonthStr || (t.date && t.date.startsWith(currentMonthStr))
    );
  }, [transactions, currentMonthStr]);

  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const netBalance = totalIncome - totalExpense;

  // Days in month calculation
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Daily burn rate
  const dailyBurnRate = currentDay > 0 ? totalExpense / currentDay : 0;

  // Budget calculations
  const budgetSpentPercent = monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 100) : 0;
  const budgetRemaining = Math.max(0, monthlyBudget - totalExpense);
  const dailyRemainingBudget = budgetRemaining / daysRemaining;
  const initialDailyBudget = monthlyBudget / daysInMonth;
  const overBudgetAmount = Math.max(0, totalExpense - monthlyBudget);

  // Editing monthly budget state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));

  const handleSaveBudget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(budgetInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onUpdateMonthlyBudget(val);
      setIsEditingBudget(false);
    }
  };

  // Savings rate
  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : totalExpense > 0
      ? -100
      : 0;

  // Currency Formatter matching language locale
  const formatEUR = (val: number) => {
    const locale =
      language === 'it'
        ? 'it-IT'
        : language === 'es'
        ? 'es-ES'
        : language === 'fr'
        ? 'fr-FR'
        : language === 'de'
        ? 'de-DE'
        : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Adaptive, contextual financial intelligence tailored to user's exact budget
  const statusInfo = useMemo(() => {
    const formattedBudget = formatEUR(monthlyBudget);
    const formattedSpent = formatEUR(totalExpense);
    const formattedRemaining = formatEUR(budgetRemaining);
    const formattedDailyRemaining = formatEUR(dailyRemainingBudget);
    const formattedInitialDaily = formatEUR(initialDailyBudget);
    const formattedOverBudget = formatEUR(overBudgetAmount);

    if (monthTransactions.length === 0) {
      return {
        title: t('status_system_ready'),
        badge: t('badge_initialized'),
        badgeClass: 'bg-app-subtle text-app-muted border-app',
        accentColor: 'text-app-main',
        comment: t('comment_no_transactions', {
          budget: formattedBudget,
          dailyBudget: formattedInitialDaily,
          daysInMonth,
        }),
        icon: Sparkles,
      };
    }

    // 1. Budget Exceeded
    if (monthlyBudget > 0 && totalExpense > monthlyBudget) {
      return {
        title: t('status_budget_exceeded'),
        badge: t('badge_limit_surpassed'),
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
        accentColor: 'text-red-500',
        comment: t('comment_budget_exceeded', {
          budget: formattedBudget,
          overBudget: formattedOverBudget,
          spent: formattedSpent,
          daysRemaining,
        }),
        icon: AlertOctagon,
      };
    }

    // 2. Budget Near Limit (>= 85%)
    if (monthlyBudget > 0 && budgetSpentPercent >= 85) {
      return {
        title: t('status_budget_near_limit'),
        badge: t('badge_near_limit'),
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        accentColor: 'text-amber-500',
        comment: t('comment_budget_near_limit', {
          percent: budgetSpentPercent,
          budget: formattedBudget,
          spent: formattedSpent,
          remaining: formattedRemaining,
          dailyRemaining: formattedDailyRemaining,
          daysRemaining,
        }),
        icon: AlertTriangle,
      };
    }

    // 3. Balanced / In Rhythm (60% - 84% of budget)
    if (monthlyBudget > 0 && budgetSpentPercent >= 60) {
      return {
        title: t('status_on_track'),
        badge: t('badge_balanced'),
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        accentColor: 'text-teal-500',
        comment: t('comment_balanced', {
          budget: formattedBudget,
          spent: formattedSpent,
          percent: budgetSpentPercent,
          remaining: formattedRemaining,
          dailyRemaining: formattedDailyRemaining,
          daysRemaining,
        }),
        icon: ShieldCheck,
      };
    }

    // 4. Well Within Budget (< 60% of budget or general optimal state)
    // As explicitly requested: income is secondary; "TUTTO OK" is shown whenever within budget!
    return {
      title: t('status_optimal'),
      badge: t('badge_optimal'),
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      accentColor: 'text-emerald-500',
      comment: t('comment_optimal', {
        budget: formattedBudget,
        spent: formattedSpent,
        percent: budgetSpentPercent,
        remaining: formattedRemaining,
        dailyRemaining: formattedDailyRemaining,
        daysRemaining,
      }),
      icon: CheckCircle2,
    };
  }, [
    monthTransactions.length,
    totalExpense,
    monthlyBudget,
    netBalance,
    savingsRate,
    daysRemaining,
    budgetSpentPercent,
    budgetRemaining,
    dailyRemainingBudget,
    initialDailyBudget,
    overBudgetAmount,
    language,
    t,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full rounded-3xl border border-app bg-app-card text-app-main p-5 sm:p-6 md:p-8 shadow-sm transition-colors"
    >
      {/* Responsive Grid: Status & Net Balance on Left, Budget Limit & Overview on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-stretch">
        {/* Left Column (Status & Telematics) */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-app-subtle border border-app space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${statusInfo.badgeClass}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {statusInfo.badge}
              </span>
              <span className="text-[10px] font-mono-code text-app-muted uppercase">
                {now.toLocaleDateString(
                  language === 'it'
                    ? 'it-IT'
                    : language === 'es'
                    ? 'es-ES'
                    : language === 'fr'
                    ? 'fr-FR'
                    : language === 'de'
                    ? 'de-DE'
                    : 'en-US',
                  { month: 'long', year: 'numeric' }
                )}
              </span>
            </div>

            <div className="select-none pt-1">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[0.95] text-app-main uppercase font-sans">
                {statusInfo.title}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-app-sub font-mono-code leading-relaxed pt-3">
              {statusInfo.comment}
            </p>
          </div>

          <div className="pt-3 border-t border-app flex items-center justify-between text-[11px] font-mono-code text-app-muted">
            <span className="uppercase tracking-wider text-[10px] font-bold text-app-muted">
              {t('transactions_ledger')}
            </span>
            <span>
              {monthTransactions.length}{' '}
              {monthTransactions.length === 1
                ? t('transaction_singular')
                : t('transaction_plural')}
            </span>
          </div>
        </div>

        {/* Right Column (Monthly Budget Limit & Income/Expense Breakdown) */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between space-y-4">
          {/* Monthly Spending Limit Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-app-subtle border border-app space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-app-muted" />
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold text-app-main">
                  {t('monthly_budget_limit')}
                </span>
              </div>

              {!isEditingBudget ? (
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(String(monthlyBudget));
                    setIsEditingBudget(true);
                  }}
                  className="p-1 rounded-lg text-app-muted hover:text-app-main hover:bg-app-card transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono-code"
                  title={t('set_limit')}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{t('change_limit')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="p-1 rounded-lg text-app-muted hover:text-app-main cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inline Budget Editor */}
            {isEditingBudget ? (
              <form onSubmit={handleSaveBudget} className="flex items-center gap-2 py-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-code text-app-muted">
                    €
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="e.g. 1500"
                    autoFocus
                    className="w-full bg-app-card border border-app rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono-code text-app-main outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-code text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('save')}</span>
                </button>
              </form>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xl sm:text-2xl font-mono-code font-black text-app-main">
                    {formatEUR(totalExpense)}
                    <span className="text-xs text-app-muted font-normal ml-1">
                      / {formatEUR(monthlyBudget)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full border ${
                      budgetSpentPercent > 100
                        ? 'bg-red-500/20 text-red-500 border-red-500/40'
                        : budgetSpentPercent > 80
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    }`}
                  >
                    {budgetSpentPercent}% {t('budget_used')}
                  </span>
                </div>

                {/* Visual Limit Progress Bar */}
                <div className="w-full h-2 rounded-full bg-app-card overflow-hidden mt-2.5 border border-app-subtle">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetSpentPercent > 100
                        ? 'bg-red-500'
                        : budgetSpentPercent > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, budgetSpentPercent))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono-code text-app-muted mt-2">
                  <span>
                    {totalExpense <= monthlyBudget ? (
                      <span className="text-emerald-500 font-bold">
                        {formatEUR(budgetRemaining)} {t('remaining')}
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold">
                        {formatEUR(overBudgetAmount)} {t('over_limit')}
                      </span>
                    )}
                  </span>
                  <span>
                    ~{formatEUR(dailyRemainingBudget)}/{t('per_day_left')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Symmetrical Income & Expense 2-Column Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Income Card */}
            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
              <div className="flex items-center justify-between text-app-muted mb-1">
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
                  {t('income')}
                </span>
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono-code font-black text-emerald-500">
                +{formatEUR(totalIncome)}
              </div>
              <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
                {monthTransactions.filter((t) => t.type === 'income').length} {t('deposits')}
              </div>
            </div>

            {/* Expenses Card */}
            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
              <div className="flex items-center justify-between text-app-muted mb-1">
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
                  {t('expenses')}
                </span>
                <div className="w-5 h-5 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono-code font-black text-red-500">
                -{formatEUR(totalExpense)}
              </div>
              <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
                {t('avg_per_day')} {formatEUR(dailyBurnRate)}/d
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
