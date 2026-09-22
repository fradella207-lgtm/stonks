/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  BarChart3,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Gauge,
  Calendar,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';

interface FinancialTelematicsCardProps {
  transactions: Transaction[];
  onOpenAdd?: (type?: TransactionType) => void;
  onNavigateReports?: () => void;
}

export const FinancialTelematicsCard: React.FC<FinancialTelematicsCardProps> = ({
  transactions,
  onOpenAdd,
  onNavigateReports,
}) => {
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

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

  // Fuel gauge equivalent: financial coverage autonomy percentage (0 - 100%)
  const fuelCoveragePercent = useMemo(() => {
    if (totalIncome === 0 && totalExpense === 0) return 100;
    if (totalIncome === 0) return 0;
    if (totalExpense === 0) return 100;
    // Ratio of remaining budget / income
    const ratio = Math.max(0, Math.min(100, Math.round((netBalance / totalIncome) * 100)));
    return ratio;
  }, [totalIncome, totalExpense, netBalance]);

  // Telematics Diagnostic Status (BMW style: huge stacked title, comments and telemetry)
  const diagnostics = useMemo(() => {
    if (monthTransactions.length === 0) {
      return {
        level: 'idle',
        titleLines: ['SISTEMA', 'PRONTO'],
        badge: 'STANDBY ATTIVO',
        badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        accentGlow: 'from-blue-600/30 via-sky-500/20 to-transparent',
        carColor: '#38bdf8',
        stripeColors: ['bg-sky-400/30', 'bg-blue-600/30', 'bg-indigo-500/30'],
        comment:
          'Nessun movimento registrato questo mese. Il cockpit è pronto per tracciare le tue finanze con latenza zero.',
        healthScore: 100,
        advice: 'Inserisci le tue prime entrate e uscite per calcolare l’autonomia di spesa.',
        icon: Zap,
        fuelLabel: 'Capacità Disponibile',
        fuelValue: '100 % / Inizializzato',
      };
    }

    if (netBalance >= 0 && (savingsRate >= 20 || totalExpense === 0)) {
      return {
        level: 'optimal',
        titleLines: ['TUTTO', 'OK'],
        badge: 'STATO OTTIMALE',
        badgeColor: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/50',
        accentGlow: 'from-cyan-500/30 via-blue-600/25 to-emerald-500/20',
        carColor: '#34d399',
        stripeColors: ['bg-cyan-400/40', 'bg-blue-600/40', 'bg-emerald-500/35'],
        comment: `Gestione eccellente: entrate ad alta copertura. Margine di risparmio registrato del ${savingsRate}% rispetto alle uscite.`,
        healthScore: Math.min(100, 78 + Math.round(savingsRate / 4)),
        advice: `Stai risparmiando il ${savingsRate}% delle entrate. Ottimo ritmo per raggiungere i tuoi obiettivi.`,
        icon: CheckCircle2,
        fuelLabel: 'Autonomia Finanziaria',
        fuelValue: `${fuelCoveragePercent} % / +€${netBalance.toFixed(0)}`,
      };
    }

    if (netBalance >= 0 && savingsRate < 20) {
      return {
        level: 'stable',
        titleLines: ['TUTTO IN', 'ORDINE'],
        badge: 'EQUILIBRIO ATTIVO',
        badgeColor: 'bg-teal-950/70 text-teal-300 border-teal-500/50',
        accentGlow: 'from-blue-600/30 via-teal-500/25 to-transparent',
        carColor: '#2dd4bf',
        stripeColors: ['bg-sky-400/35', 'bg-blue-600/35', 'bg-teal-500/30'],
        comment: `Pareggio attivo conservato (+€${netBalance.toFixed(
          0
        )}). Spese in linea con le disponibilità del periodo.`,
        healthScore: 78,
        advice: `Mantieni monitorate le spese variabili per preservare il cuscinetto di sicurezza.`,
        icon: ShieldCheck,
        fuelLabel: 'Livello Risparmio',
        fuelValue: `${fuelCoveragePercent} % / In pareggio`,
      };
    }

    if (netBalance < 0 && netBalance >= -350) {
      return {
        level: 'warning',
        titleLines: ['ATTENZIONE', 'SPESE'],
        badge: 'USCITE ELEVATE',
        badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-500/50',
        accentGlow: 'from-amber-500/30 via-orange-600/25 to-transparent',
        carColor: '#fbbf24',
        stripeColors: ['bg-amber-400/40', 'bg-orange-600/40', 'bg-red-500/30'],
        comment: `Le uscite superano le entrate di €${Math.abs(netBalance).toFixed(
          2
        )}. Monitorare le spese discrezionali nei prossimi ${daysRemaining} giorni.`,
        healthScore: Math.max(35, 60 - Math.round(Math.abs(netBalance) / 10)),
        advice: `Consiglio: riduci le spese discrezionali per i restanti ${daysRemaining} giorni del mese.`,
        icon: AlertTriangle,
        fuelLabel: 'Livello Riserva',
        fuelValue: `Attenzione / -€${Math.abs(netBalance).toFixed(0)}`,
      };
    }

    // Critical disavanzo
    return {
      level: 'critical',
      titleLines: ['ALLERTA', 'DISAVANZO'],
      badge: 'DISAVANZO ATTIVO',
      badgeColor: 'bg-red-950/80 text-red-300 border-red-500/60',
      accentGlow: 'from-red-600/40 via-rose-600/30 to-amber-500/20',
      carColor: '#f87171',
      stripeColors: ['bg-red-500/50', 'bg-rose-600/45', 'bg-orange-500/40'],
      comment: `Sbilanciamento di -€${Math.abs(netBalance).toFixed(
        2
      )}. Il flusso in uscita richiede una revisione per rientrare in equilibrio.`,
      healthScore: Math.max(10, 38 - Math.round(Math.abs(netBalance) / 20)),
      advice: `Consiglio urgente: blocca le spese non essenziali e verifica le ricorrenze attive.`,
      icon: AlertOctagon,
      fuelLabel: 'Allerta Riserva',
      fuelValue: `Critico / -€${Math.abs(netBalance).toFixed(0)}`,
    };
  }, [
    monthTransactions.length,
    netBalance,
    savingsRate,
    totalExpense,
    daysRemaining,
    fuelCoveragePercent,
  ]);

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [now]);

  const formattedTime = useMemo(() => {
    return now.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [now]);

  return (
    <div className="w-full space-y-3">
      {/* ========================================================================= */}
      {/* 1. HERO BMW-STYLE COCKPIT CARD (Large Stacked Typography + Vehicle Visual) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl border border-app bg-slate-950 text-white shadow-xl transition-all"
      >
        {/* Dynamic BMW M Style Diagonal Stripes Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Ambient Corner Glow */}
          <div
            className={`absolute top-0 right-0 w-96 h-80 bg-gradient-to-br ${diagnostics.accentGlow} blur-3xl opacity-75`}
          />

          {/* Diagonal Livery Bands (Inspired by BMW M livery in user photo) */}
          <div className="absolute -top-12 right-6 w-72 h-80 pointer-events-none opacity-40 sm:opacity-60 transform rotate-[28deg]">
            <div
              className={`absolute top-0 right-0 w-8 h-full ${diagnostics.stripeColors[0]} blur-sm`}
            />
            <div
              className={`absolute top-0 right-10 w-9 h-full ${diagnostics.stripeColors[1]} blur-sm`}
            />
            <div
              className={`absolute top-0 right-22 w-11 h-full ${diagnostics.stripeColors[2]} blur-sm`}
            />
          </div>

          {/* Vignette bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        {/* Top Mini HUD Header (Clock, Vehicle Indicator, Profile Dot) */}
        <div className="relative z-10 px-5 pt-4 pb-1 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            <span className="font-bold text-slate-200 tracking-wider">STONKS COCKPIT</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 font-bold">
              {daysRemaining} gg al termine
            </span>
          </div>
        </div>

        {/* Hero Section: Giant Stacked Typography (Left) + Aerodynamic Speed Machine (Right) */}
        <div className="relative z-10 px-5 pt-3 pb-2 flex items-center justify-between gap-2">
          {/* Big Bold Stacked Typography (matching user BMW image "TUTTO \n OK") */}
          <div className="flex flex-col justify-center select-none py-1">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.85] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-sans">
              {diagnostics.titleLines[0]}
            </h1>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.85] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-sans mt-1">
              {diagnostics.titleLines[1]}
            </h1>

            {/* Health Score Pill Badge */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={`text-[10px] font-mono-code uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${diagnostics.badgeColor}`}
              >
                {diagnostics.badge}
              </span>
              <span className="text-[10px] font-mono-code text-slate-400">
                Score: {diagnostics.healthScore}/100
              </span>
            </div>
          </div>

          {/* Aerodynamic Sports Vehicle / Telemetry Asset with Road Reflection */}
          <div className="relative w-44 sm:w-56 h-28 sm:h-32 flex items-end justify-center shrink-0 pointer-events-none">
            {/* Ground Reflection & Shadow */}
            <div className="absolute bottom-1 w-36 sm:w-44 h-4 bg-black/80 rounded-full blur-md" />
            <div
              className="absolute bottom-2 w-28 h-2 rounded-full blur-sm opacity-60"
              style={{ backgroundColor: diagnostics.carColor }}
            />

            {/* Futuristic Sports Vehicle SVG (Inspired by BMW 1-Series in photo) */}
            <svg
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
              viewBox="0 0 240 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Speed / Wind Trails */}
              <path
                d="M10 50 Q 60 48 100 55"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 70 Q 70 68 110 72"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeLinecap="round"
              />

              {/* Vehicle Body Shadow */}
              <ellipse cx="120" cy="102" rx="90" ry="8" fill="rgba(0,0,0,0.85)" />

              {/* Main Silhouette (Modern Hatchback / Coupe) */}
              <path
                d="M30 92 C32 80 40 70 56 68 C70 67 85 54 105 45 C125 36 155 36 180 46 C195 52 205 66 215 75 C222 82 225 88 225 93 C225 97 220 98 210 98 L36 98 C31 98 29 95 30 92 Z"
                fill="#1e293b"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />

              {/* Roof & Windshield Glass */}
              <path
                d="M88 64 C96 55 110 46 128 42 C146 38 165 38 178 47 C182 50 186 56 188 64 Z"
                fill="#0f172a"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />

              {/* Glass Reflection Highlight */}
              <path
                d="M105 58 L140 43 L146 43 L118 60 Z"
                fill="rgba(255,255,255,0.25)"
              />

              {/* Aerodynamic Shoulder Crease */}
              <path
                d="M34 84 Q 120 78 218 84"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Headlights (Iconic Angel Eyes / LED Halo) */}
              <ellipse
                cx="214"
                cy="80"
                rx="6"
                ry="3"
                fill={diagnostics.carColor}
                className="animate-pulse"
              />
              <path
                d="M210 79 Q 235 83 238 88"
                stroke={diagnostics.carColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Taillights */}
              <path
                d="M32 82 Q 38 84 45 84"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Front Wheel & Alloy Rim */}
              <g transform="translate(180, 92)">
                <circle cx="0" cy="0" r="15" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                {/* 5-Spoke M Performance Wheels */}
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-8" y1="-3" x2="8" y2="3" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-5" y1="7" x2="5" y2="-7" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="2.5" fill={diagnostics.carColor} />
              </g>

              {/* Rear Wheel & Alloy Rim */}
              <g transform="translate(62, 92)">
                <circle cx="0" cy="0" r="15" fill="#090d16" stroke="#475569" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-8" y1="-3" x2="8" y2="3" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-5" y1="7" x2="5" y2="-7" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="2.5" fill={diagnostics.carColor} />
              </g>
            </svg>
          </div>
        </div>

        {/* 2. "CONTROLLA STATO >" Button & Timestamp (matching BMW image) */}
        <div className="relative z-10 px-5 pt-1 pb-3 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="group flex items-center gap-1.5 text-xs font-mono-code font-black tracking-wider text-slate-100 uppercase hover:text-emerald-400 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-white/5 active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONTROLLA STATO FINANZE</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <span className="text-[10px] font-mono-code text-slate-400 mt-0.5">
            Aggiornato in tempo reale • {formattedDate} {formattedTime}
          </span>
        </div>

        {/* 3. Horizontal Telemetry Gauge Bar (matching BMW Fuel Gauge: "Livello carburante 63% / 371 km") */}
        <div className="relative z-10 px-5 pb-4">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2 text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-[11px] uppercase tracking-wider">
                  {diagnostics.fuelLabel}
                </span>
              </div>
              <div className="font-black text-slate-100">
                <span className="text-emerald-400 font-bold">{fuelCoveragePercent}%</span>
                <span className="text-slate-400 font-normal"> / </span>
                <span className={netBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {netBalance >= 0 ? `+€${netBalance.toFixed(0)}` : `-€${Math.abs(netBalance).toFixed(0)}`}
                </span>
              </div>
            </div>

            {/* Segmented Two-Tone Gauge Track */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/10 flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  netBalance >= 0
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                }`}
                style={{ width: `${Math.max(5, fuelCoveragePercent)}%` }}
              />
            </div>

            {/* Dynamic Intelligent Context Comment */}
            <p className="text-[11px] text-slate-300 font-mono-code leading-relaxed pt-1">
              {diagnostics.comment}
            </p>
          </div>
        </div>

        {/* 4. Quick Action Dock (matching BMW 4-Button Capsule: Lock, Unlock, Lights, Horn) */}
        <div className="relative z-10 px-5 pb-5">
          <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            {/* Quick Action 1: Nuova Spesa */}
            <button
              type="button"
              onClick={() => onOpenAdd?.('expense')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-200 hover:text-red-400 border border-white/5 hover:border-red-500/40 transition-all active:scale-95 cursor-pointer"
              title="Registra Spesa"
            >
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-1">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono-code font-bold tracking-tight">
                + Spesa
              </span>
            </button>

            {/* Quick Action 2: Nuova Entrata */}
            <button
              type="button"
              onClick={() => onOpenAdd?.('income')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
              title="Registra Entrata"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono-code font-bold tracking-tight">
                + Entrata
              </span>
            </button>

            {/* Quick Action 3: Scontrino */}
            <button
              type="button"
              onClick={() => onOpenAdd?.('expense')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/40 transition-all active:scale-95 cursor-pointer"
              title="Scatta o carica scontrino"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono-code font-bold tracking-tight">
                Scontrino
              </span>
            </button>

            {/* Quick Action 4: Report & Trend */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateReports) {
                  onNavigateReports();
                } else {
                  setShowStatusModal(true);
                }
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-blue-500/20 text-slate-200 hover:text-blue-400 border border-white/5 hover:border-blue-500/40 transition-all active:scale-95 cursor-pointer"
              title="Esplora Report"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono-code font-bold tracking-tight">
                Report
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. VIVID LIVE BALANCE COCKPIT (Immediate Balance Overview Upon Opening App) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Net Monthly Balance (Hero Metric) */}
        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted font-bold">
              RISULTATO NETTO MESE
            </span>
            <span
              className={`text-[9px] font-mono-code font-bold px-2 py-0.5 rounded-full border ${
                netBalance >= 0
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                  : 'bg-red-950/40 text-red-400 border-red-500/40'
              }`}
            >
              {netBalance >= 0 ? 'ATTIVO' : 'DISAVANZO'}
            </span>
          </div>

          <div className="my-2">
            <div
              className={`text-2xl sm:text-3xl font-mono-code font-black tracking-tight ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatEUR(netBalance)}
            </div>
            <span className="text-[10px] font-mono-code text-app-muted">
              Margine di risparmio: {savingsRate}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-app-subtle overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                netBalance >= 0 ? 'bg-emerald-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(8, Math.min(100, Math.abs(savingsRate)))}%` }}
            />
          </div>
        </div>

        {/* Total Income */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              ENTRATE TOTALI
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-mono-code font-black text-emerald-400">
              +{formatEUR(totalIncome)}
            </div>
            <span className="text-[10px] font-mono-code text-app-muted mt-0.5 block">
              {monthTransactions.filter((t) => t.type === 'income').length} accrediti
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-app-subtle overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-3xl border border-app bg-app-card p-4 backdrop-blur-md shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-app-muted mb-1">
            <span className="text-[10px] font-mono-code uppercase tracking-wider font-bold">
              USCITE TOTALI
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-mono-code font-black text-red-500">
              -{formatEUR(totalExpense)}
            </div>
            <span className="text-[10px] font-mono-code text-app-muted mt-0.5 block">
              Media: {formatEUR(dailyBurnRate)}/gg
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-app-subtle overflow-hidden mt-2">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{
                width: `${
                  totalIncome > 0
                    ? Math.min(100, Math.round((totalExpense / totalIncome) * 100))
                    : 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DIAGNOSTICS & TELEMETRY MODAL (When clicking "CONTROLLA STATO")        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-900 p-5 text-white shadow-2xl space-y-4"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-mono-code font-black tracking-wider uppercase text-white">
                    TELEMETRIA DI BORDO
                  </h3>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    Diagnostica finanziaria live
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-code font-bold text-white uppercase">
                    {diagnostics.titleLines.join(' ')}
                  </span>
                  <span
                    className={`text-[9px] font-mono-code px-2 py-0.5 rounded-full font-bold ${diagnostics.badgeColor}`}
                  >
                    {diagnostics.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono-code leading-relaxed">
                  {diagnostics.comment}
                </p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono-code">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] uppercase text-slate-400 block">Autonomia Risparmio</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">{savingsRate}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] uppercase text-slate-400 block">Consumo Giornaliero</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                    {formatEUR(dailyBurnRate)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] uppercase text-slate-400 block">Movimenti Registrati</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                    {monthTransactions.length} voci
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] uppercase text-slate-400 block">Indice Efficienza</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                    {diagnostics.healthScore}/100
                  </span>
                </div>
              </div>

              {/* Advice Box */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] font-mono-code text-emerald-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{diagnostics.advice}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-mono-code text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                CHIUDI DIAGNOSTICA
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
