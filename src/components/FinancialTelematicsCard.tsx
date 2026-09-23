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

interface FinancialTelematicsCardProps {
  transactions: Transaction[];
  monthlyBudget: number;
  onUpdateMonthlyBudget: (amount: number) => void;
  onOpenAdd?: (type?: 'income' | 'expense') => void;
  onNavigateReports?: () => void;
}

export const FinancialTelematicsCard: React.FC<FinancialTelematicsCardProps> = ({
  transactions,
  monthlyBudget,
  onUpdateMonthlyBudget,
  onOpenAdd,
}) => {
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

  // Financial Status Assessment
  const statusInfo = useMemo(() => {
    if (monthTransactions.length === 0) {
      return {
        titleLines: ['SYSTEM', 'READY'],
        badge: 'INITIALIZED',
        badgeClass: 'bg-app-subtle text-app-muted border-app',
        accentColor: 'text-app-main',
        comment: 'No transactions recorded this month. Your ledger is ready to track spending and income.',
        icon: Sparkles,
      };
    }

    if (totalExpense > monthlyBudget && monthlyBudget > 0) {
      return {
        titleLines: ['BUDGET', 'EXCEEDED'],
        badge: 'LIMIT SURPASSED',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
        accentColor: 'text-red-500',
        comment: `Monthly spending limit surpassed by €${(totalExpense - monthlyBudget).toFixed(2)}. Restrict unnecessary expenses.`,
        icon: AlertOctagon,
      };
    }

    if (netBalance >= 0 && (savingsRate >= 20 || totalExpense === 0)) {
      return {
        titleLines: ['ALL', 'GOOD'],
        badge: 'OPTIMAL STATUS',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        accentColor: 'text-emerald-500',
        comment: `Healthy surplus: +${savingsRate}% savings margin relative to current monthly income.`,
        icon: CheckCircle2,
      };
    }

    if (netBalance >= 0 && savingsRate < 20) {
      return {
        titleLines: ['ON', 'TRACK'],
        badge: 'BALANCED',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        accentColor: 'text-teal-500',
        comment: `Balanced budget (+€${netBalance.toFixed(0)}). Expenses are aligned with available cashflow.`,
        icon: ShieldCheck,
      };
    }

    if (netBalance < 0 && netBalance >= -350) {
      return {
        titleLines: ['WARNING', 'EXPENSES'],
        badge: 'HIGH OUTFLOW',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        accentColor: 'text-amber-500',
        comment: `Outflow exceeds inflow by €${Math.abs(netBalance).toFixed(2)}. Monitor spending over the next ${daysRemaining} days.`,
        icon: AlertTriangle,
      };
    }

    return {
      titleLines: ['DEFICIT', 'ALERT'],
      badge: 'ACTIVE DEFICIT',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      accentColor: 'text-red-500',
      comment: `Negative imbalance of -€${Math.abs(netBalance).toFixed(2)}. Discretionary expenses should be trimmed.`,
      icon: AlertOctagon,
    };
  }, [monthTransactions.length, totalExpense, monthlyBudget, netBalance, savingsRate, daysRemaining]);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full rounded-3xl border border-app bg-app-card text-app-main p-5 sm:p-6 md:p-8 shadow-sm transition-colors"
    >
      {/* Tablet / Desktop Grid: Left for Status & Balance & Buttons, Right for Budget & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
        
        {/* Left Column (Mobile: Full, Tablet: 6/12 or 7/12) */}
        <div className="md:col-span-6 lg:col-span-6 space-y-4">
          {/* 1. Header: Bold Status Typography */}
          <div className="border-b border-app-subtle pb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${statusInfo.badgeClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {statusInfo.badge}
              </span>
              <span className="text-[10px] font-mono-code text-app-muted uppercase">
                {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="select-none pt-0.5">
              <div className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.88] text-app-main uppercase font-sans">
                {statusInfo.titleLines[0]}
              </div>
              <div className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.88] text-app-main uppercase font-sans mt-1">
                {statusInfo.titleLines[1]}
              </div>
            </div>
            <p className="text-xs text-app-sub font-mono-code leading-relaxed pt-2.5">
              {statusInfo.comment}
            </p>
          </div>

          {/* 2. Hero Net Balance */}
          <div className="p-4 rounded-2xl bg-app-subtle border border-app">
            <div className="flex items-center justify-between text-xs font-mono-code text-app-muted mb-1">
              <span className="uppercase tracking-wider font-bold text-[10px]">
                Net Balance
              </span>
              <span className="font-bold text-[10px] text-app-main">
                {savingsRate >= 0 ? `Savings +${savingsRate}%` : `Deficit ${savingsRate}%`}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div
                className={`text-3xl sm:text-4xl font-mono-code font-black tracking-tight ${
                  netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {netBalance >= 0 ? '+' : ''}
                {formatEUR(netBalance)}
              </div>
              <div className="text-[11px] font-mono-code text-app-muted">
                {monthTransactions.length} {monthTransactions.length === 1 ? 'transaction' : 'transactions'}
              </div>
            </div>

            {/* Elegant Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-app-card overflow-hidden mt-3 border border-app-subtle">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  netBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${
                    totalIncome > 0
                      ? Math.min(100, Math.max(5, Math.round((netBalance / totalIncome) * 100)))
                      : totalExpense > 0
                      ? 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 3. Centered, Balanced Income & Expense Buttons (Requirement: tasti entrata e uscita centrati) */}
          <div className="pt-1">
            <div className="flex items-center justify-center gap-3 w-full">
              {/* Centered Expense Button */}
              <button
                id="btn-quick-expense"
                type="button"
                onClick={() => onOpenAdd?.('expense')}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 shadow-sm active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-xl bg-red-600/20 group-hover:bg-white/20 text-red-500 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-mono-code font-bold text-xs uppercase tracking-wider">
                  - Expense
                </span>
              </button>

              {/* Centered Income Button */}
              <button
                id="btn-quick-income"
                type="button"
                onClick={() => onOpenAdd?.('income')}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/30 hover:border-emerald-500 shadow-sm active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-xl bg-emerald-600/20 group-hover:bg-white/20 text-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-mono-code font-bold text-xs uppercase tracking-wider">
                  + Income
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Mobile: Full, Tablet: 6/12) */}
        <div className="md:col-span-6 lg:col-span-6 space-y-4">
          {/* 4. Monthly Spending Limit Widget (Requirement: Limite spesa mensile) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-app-subtle border border-app space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-app-muted" />
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold text-app-main">
                  Monthly Budget Limit
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
                  title="Edit spending limit"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Set Limit</span>
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
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-code text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
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
                    {budgetSpentPercent}% USED
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
                        {formatEUR(budgetRemaining)} remaining
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold">
                        {formatEUR(totalExpense - monthlyBudget)} over limit
                      </span>
                    )}
                  </span>
                  <span>
                    ~{formatEUR(dailyRemainingBudget)}/day left
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Income & Expense 2-Column Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Income Card */}
            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
              <div className="flex items-center justify-between text-app-muted mb-1">
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
                  Income
                </span>
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono-code font-black text-emerald-500">
                +{formatEUR(totalIncome)}
              </div>
              <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
                {monthTransactions.filter((t) => t.type === 'income').length} deposits
              </div>
            </div>

            {/* Expenses Card */}
            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
              <div className="flex items-center justify-between text-app-muted mb-1">
                <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
                  Expenses
                </span>
                <div className="w-5 h-5 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-mono-code font-black text-red-500">
                -{formatEUR(totalExpense)}
              </div>
              <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
                Avg {formatEUR(dailyBurnRate)}/day
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
