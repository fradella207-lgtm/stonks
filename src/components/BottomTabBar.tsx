/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Activity, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TransactionType } from '../types.ts';
import { useLanguage } from '../services/i18n.ts';

interface BottomTabBarProps {
  activeView: 'history' | 'reports';
  onSelectView: (view: 'history' | 'reports') => void;
  onOpenAdd: (type: TransactionType) => void;
  pendingCount: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeView,
  onSelectView,
  onOpenAdd,
  pendingCount,
}) => {
  const { t } = useLanguage();
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const handleSelectOption = (type: TransactionType) => {
    setIsSpeedDialOpen(false);
    onOpenAdd(type);
  };

  return (
    <>
      {/* Backdrop for closing speed dial when open */}
      {isSpeedDialOpen && (
        <div
          onClick={() => setIsSpeedDialOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Floating Speed Dial Mini-Menu - Perfectly Centered and Symmetrical */}
      {isSpeedDialOpen && (
        <div className="fixed bottom-[calc(max(0.5rem,env(safe-area-inset-bottom,0px))+68px)] left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 w-full max-w-sm px-4 pointer-events-auto">
          {/* Expense Option (- Expense) */}
          <button
            id="btn-speed-dial-expense"
            type="button"
            onClick={() => handleSelectOption('expense')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-app-modal border border-red-500/40 text-app-main shadow-[0_8px_30px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer group backdrop-blur-xl"
          >
            <span className="w-6 h-6 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center font-mono-code font-bold text-xs group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </span>
            <span className="font-mono-code text-xs font-bold tracking-wider uppercase text-red-500">
              {t('record_expense')}
            </span>
          </button>

          {/* Income Option (+ Income) */}
          <button
            id="btn-speed-dial-income"
            type="button"
            onClick={() => handleSelectOption('income')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-app-modal border border-emerald-500/40 text-app-main shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer group backdrop-blur-xl"
          >
            <span className="w-6 h-6 rounded-xl bg-emerald-600/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center font-mono-code font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <span className="font-mono-code text-xs font-bold tracking-wider uppercase text-emerald-500">
              {t('record_income')}
            </span>
          </button>
        </div>
      )}

      {/* Main Bottom Bar with Safe-Area padding for iOS Home Indicator & Android Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-app-tabbar backdrop-blur-2xl border-t border-app pb-safe transition-colors shadow-2xl">
        {/* Extended background bleed downwards below bottom edge so color NEVER stops short on Android */}
        <div className="absolute top-0 -bottom-48 left-0 right-0 bg-app-tabbar -z-10 pointer-events-none" />

        <div className="max-w-xl md:max-w-2xl mx-auto w-full flex items-center justify-between px-6 sm:px-12 h-[58px] sm:h-[64px]">
          {/* Tab 1: Activity */}
          <button
            id="btn-tab-history"
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              onSelectView('history');
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-4 min-w-[88px] sm:min-w-[110px] transition-all duration-150 cursor-pointer active:scale-95 ${
              activeView === 'history'
                ? 'text-app-main font-bold'
                : 'text-app-muted hover:text-app-sub'
            }`}
          >
            <div className="relative">
              <Activity className={`w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2.2] transition-transform ${activeView === 'history' ? 'scale-110' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 bg-amber-500 text-black font-mono-code text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono-code font-bold tracking-wider uppercase mt-1">
              {t('tab_activity')}
            </span>
            {activeView === 'history' && (
              <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.85)]" />
            )}
          </button>

          {/* Center Prominent "+" Action Button */}
          <div className="relative -top-2.5">
            <button
              id="btn-main-add"
              type="button"
              onClick={() => setIsSpeedDialOpen((prev) => !prev)}
              aria-label={t('tab_add')}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer border ${
                isSpeedDialOpen
                  ? 'bg-app-card text-app-main border-app rotate-45 scale-105'
                  : 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
              }`}
            >
              <Plus className="w-7 h-7 stroke-[2.5] transition-transform duration-200" />
            </button>
          </div>

          {/* Tab 2: Reports */}
          <button
            id="btn-tab-reports"
            type="button"
            onClick={() => {
              setIsSpeedDialOpen(false);
              onSelectView('reports');
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-4 min-w-[88px] sm:min-w-[110px] transition-all duration-150 cursor-pointer active:scale-95 ${
              activeView === 'reports'
                ? 'text-app-main font-bold'
                : 'text-app-muted hover:text-app-sub'
            }`}
          >
            <PieChart className={`w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2.2] transition-transform ${activeView === 'reports' ? 'scale-110' : ''}`} />
            <span className="text-[11px] font-mono-code font-bold tracking-wider uppercase mt-1">
              {t('tab_reports')}
            </span>
            {activeView === 'reports' && (
              <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.85)]" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
