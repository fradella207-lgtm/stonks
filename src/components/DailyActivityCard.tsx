/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { Transaction } from '../types.ts';
import { useLanguage } from '../services/i18n.ts';

interface DailyActivityCardProps {
  transactions: Transaction[];
}

export const DailyActivityCard: React.FC<DailyActivityCardProps> = ({ transactions }) => {
  const { language, t } = useLanguage();

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

  // Build 7 calendar days array [6 days ago, ..., today]
  const daysData = useMemo(() => {
    const list: {
      dateIso: string;
      label: string;
      fullDateLabel: string;
      isToday: boolean;
      income: number;
      expense: number;
      count: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateIso = d.toISOString().split('T')[0];

      const weekdayStr = d.toLocaleDateString(locale, { weekday: 'short' });
      const dayNum = d.getDate();
      const label =
        i === 0
          ? language === 'it'
            ? 'Oggi'
            : language === 'es'
            ? 'Hoy'
            : language === 'fr'
            ? "Auj."
            : language === 'de'
            ? 'Heute'
            : 'Today'
          : `${weekdayStr.toUpperCase()} ${dayNum}`;

      const fullDateLabel = d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });

      const dayTxs = transactions.filter((tx) => tx.date === dateIso);
      const income = dayTxs
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = dayTxs
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      list.push({
        dateIso,
        label,
        fullDateLabel,
        isToday: i === 0,
        income,
        expense,
        count: dayTxs.length,
      });
    }

    return list;
  }, [transactions, locale, language]);

  // Selected day index (default: today, which is index 6)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);

  // Max volume for proportional sparkline scaling
  const maxDayVolume = useMemo(() => {
    let max = 0;
    for (const d of daysData) {
      const vol = Math.max(d.income, d.expense);
      if (vol > max) max = vol;
    }
    return max > 0 ? max : 100;
  }, [daysData]);

  const activeDay = daysData[selectedDayIdx] || daysData[6];

  const formatEUR = (val: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div
      id="daily-activity-chart"
      className="rounded-3xl border border-app bg-app-card p-4 sm:p-5 shadow-sm transition-all space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-app-subtle pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[11px] font-mono-code uppercase text-app-main font-bold tracking-wider">
            {t('daily_activity_title')}
          </span>
        </div>
        <span className="text-[10px] font-mono-code text-app-muted capitalize hidden sm:inline-block">
          {activeDay.fullDateLabel}
        </span>
      </div>

      {/* 7 Interactive Columns */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-1">
        {daysData.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          const expHeight =
            d.expense > 0 ? Math.min(100, Math.max(16, (d.expense / maxDayVolume) * 100)) : 0;
          const incHeight =
            d.income > 0 ? Math.min(100, Math.max(16, (d.income / maxDayVolume) * 100)) : 0;

          return (
            <button
              key={d.dateIso}
              type="button"
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center justify-end p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-app-subtle border-red-500 shadow-xs scale-[1.02]'
                  : 'bg-app-card hover:bg-app-subtle border-app'
              }`}
            >
              {/* Visual Bar Container */}
              <div className="w-full h-20 sm:h-24 flex items-end justify-center gap-1 pb-1">
                {/* Expense Bar */}
                <div className="w-2 sm:w-3.5 bg-app-subtle rounded-t-sm flex items-end h-full">
                  {expHeight > 0 ? (
                    <div
                      style={{ height: `${expHeight}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isSelected
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                          : 'bg-red-500/70 group-hover:bg-red-500'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-1 bg-app-muted/20 rounded-full mb-0.5" />
                  )}
                </div>

                {/* Income Bar */}
                <div className="w-2 sm:w-3.5 bg-app-subtle rounded-t-sm flex items-end h-full">
                  {incHeight > 0 ? (
                    <div
                      style={{ height: `${incHeight}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isSelected
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : 'bg-emerald-500/70 group-hover:bg-emerald-400'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-1 bg-app-muted/20 rounded-full mb-0.5" />
                  )}
                </div>
              </div>

              {/* Day Label */}
              <span
                className={`mt-1 font-mono-code text-[9px] sm:text-[10px] tracking-tight ${
                  isSelected
                    ? 'text-app-main font-bold'
                    : d.isToday
                    ? 'text-red-500 font-bold'
                    : 'text-app-muted'
                }`}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Inspector */}
      <div className="mt-2 p-3 rounded-2xl bg-app-subtle border border-app flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-bold text-app-main capitalize">{activeDay.fullDateLabel}:</span>
          <span className="text-app-muted">
            {activeDay.count} {activeDay.count === 1 ? t('transaction_singular') : t('transaction_plural')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeDay.income > 0 && (
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">
              +{formatEUR(activeDay.income)}
            </span>
          )}
          {activeDay.expense > 0 && (
            <span className="text-red-500 dark:text-red-400 font-bold">
              -{formatEUR(activeDay.expense)}
            </span>
          )}
          {activeDay.income === 0 && activeDay.expense === 0 && (
            <span className="text-app-muted italic">0.00€</span>
          )}
        </div>
      </div>
    </div>
  );
};
