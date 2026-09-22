/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { Transaction } from '../types.ts';

interface FinancialTelematicsCardProps {
  transactions: Transaction[];
  onOpenAdd?: (type?: 'income' | 'expense') => void;
  onNavigateReports?: () => void;
}

export const FinancialTelematicsCard: React.FC<FinancialTelematicsCardProps> = ({
  transactions,
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
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  // Daily burn rate
  const dailyBurnRate = currentDay > 0 ? totalExpense / currentDay : 0;

  // Savings rate
  const savingsRate =
    totalIncome > 0
      ? Math.max(-100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : totalExpense > 0
      ? -100
      : 0;

  // Financial Coverage / Status Assessment
  const statusInfo = useMemo(() => {
    if (monthTransactions.length === 0) {
      return {
        titleLines: ['SISTEMA', 'PRONTO'],
        badge: 'INIZIALIZZATO',
        badgeClass: 'bg-app-subtle text-app-muted border-app',
        accentColor: 'text-app-main',
        comment: 'Nessun movimento registrato questo mese. Il bilancio è pronto per tracciare le tue finanze.',
        icon: Sparkles,
        netTag: 'IN ATTESA',
      };
    }

    if (netBalance >= 0 && (savingsRate >= 20 || totalExpense === 0)) {
      return {
        titleLines: ['TUTTO', 'OK'],
        badge: 'STATO OTTIMALE',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        accentColor: 'text-emerald-500',
        comment: `Gestione eccellente: margine di risparmio del ${savingsRate}% rispetto alle entrate registrate.`,
        icon: CheckCircle2,
        netTag: 'ATTIVO',
      };
    }

    if (netBalance >= 0 && savingsRate < 20) {
      return {
        titleLines: ['IN', 'ORDINE'],
        badge: 'PAREGGIO ATTIVO',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
        accentColor: 'text-teal-500',
        comment: `Bilancio in pareggio (+€${netBalance.toFixed(0)}). Spese allineate con le disponibilità del mese.`,
        icon: ShieldCheck,
        netTag: 'IN PAREGGIO',
      };
    }

    if (netBalance < 0 && netBalance >= -350) {
      return {
        titleLines: ['ATTENZIONE', 'SPESE'],
        badge: 'USCITE ELEVATE',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        accentColor: 'text-amber-500',
        comment: `Uscite superiori alle entrate di €${Math.abs(netBalance).toFixed(2)}. Monitorare le spese nei restanti ${daysRemaining} giorni.`,
        icon: AlertTriangle,
        netTag: 'DISAVANZO',
      };
    }

    return {
      titleLines: ['ALLERTA', 'DISAVANZO'],
      badge: 'DISAVANZO ATTIVO',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      accentColor: 'text-red-500',
      comment: `Sbilanciamento di -€${Math.abs(netBalance).toFixed(2)}. Si consiglia di contenere le uscite non essenziali.`,
      icon: AlertOctagon,
      netTag: 'CRITICO',
    };
  }, [monthTransactions.length, netBalance, savingsRate, totalExpense, daysRemaining]);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full rounded-3xl border border-app bg-app-card text-app-main p-5 sm:p-6 shadow-sm transition-colors"
    >
      {/* 1. Header: Big Bold Status Typography & Badge */}
      <div className="flex items-start justify-between gap-3 border-b border-app-subtle pb-4">
        <div className="space-y-1">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold tracking-wider border ${statusInfo.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3 shrink-0" />
              <span>{statusInfo.badge}</span>
            </span>
            <span className="text-[10px] font-mono-code text-app-muted">
              {daysRemaining} gg a fine mese
            </span>
          </div>

          {/* Big Stacked Headline Inspired by Reference */}
          <div className="pt-1 select-none">
            <div className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.9] text-app-main uppercase font-sans">
              {statusInfo.titleLines[0]}
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.9] text-app-main uppercase font-sans mt-0.5">
              {statusInfo.titleLines[1]}
            </div>
          </div>
        </div>

        {/* Dynamic Metric Tag */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-app-muted text-[11px] font-mono-code">
            <Scale className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-semibold">Stato Mese</span>
          </div>
          <div
            className={`text-sm sm:text-base font-mono-code font-black mt-1 ${
              netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {statusInfo.netTag}
          </div>
        </div>
      </div>

      {/* 2. Contextual Commentary */}
      <p className="text-xs text-app-sub font-mono-code leading-relaxed pt-3 pb-4">
        {statusInfo.comment}
      </p>

      {/* 3. Reclaimed Hero Section: Prominent Net Balance */}
      <div className="p-4 rounded-2xl bg-app-subtle border border-app mb-3">
        <div className="flex items-center justify-between text-xs font-mono-code text-app-muted mb-1">
          <span className="uppercase tracking-wider font-bold text-[10px]">
            Risultato Netto
          </span>
          <span className="font-bold text-[10px] text-app-main">
            {savingsRate >= 0 ? `Risparmio +${savingsRate}%` : `Deficit ${savingsRate}%`}
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
            {monthTransactions.length} movimenti
          </div>
        </div>

        {/* Thin Elegant Progress Track */}
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

      {/* 4. Directly Below: Totale Entrate and Totale Uscite in Clean 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Entrate */}
        <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Entrate
            </span>
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono-code font-black text-emerald-600 dark:text-emerald-400">
            +{formatEUR(totalIncome)}
          </div>
          <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
            {monthTransactions.filter((t) => t.type === 'income').length} accrediti
          </div>
        </div>

        {/* Uscite */}
        <div className="p-3.5 rounded-2xl bg-app-subtle border border-app">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              Uscite
            </span>
            <div className="w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-mono-code font-black text-red-600 dark:text-red-400">
            -{formatEUR(totalExpense)}
          </div>
          <div className="text-[10px] font-mono-code text-app-muted mt-0.5">
            Media {formatEUR(dailyBurnRate)}/gg
          </div>
        </div>
      </div>
    </motion.div>
  );
};
