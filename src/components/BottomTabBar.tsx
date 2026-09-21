/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, ListOrdered, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TransactionType } from '../types.ts';

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200"
        />
      )}

      {/* Floating Speed Dial Mini-Menu (Animated above the + button) */}
      {isSpeedDialOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Uscita Option */}
          <button
            id="btn-speed-dial-uscita"
            onClick={() => handleSelectOption('expense')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-app-modal border border-red-500/40 text-app-main shadow-[0_8px_25px_rgba(220,38,38,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer group backdrop-blur-md"
          >
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center font-mono-code font-bold text-xs group-hover:bg-red-600 group-hover:text-white transition-colors">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono-code text-xs font-bold tracking-wider uppercase text-red-500">
              Uscita
            </span>
          </button>

          {/* Entrata Option */}
          <button
            id="btn-speed-dial-entrata"
            onClick={() => handleSelectOption('income')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-app-modal border border-emerald-500/40 text-app-main shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer group backdrop-blur-md"
          >
            <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center font-mono-code font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono-code text-xs font-bold tracking-wider uppercase text-emerald-500">
              Entrata
            </span>
          </button>
        </div>
      )}

      {/* Main Bottom Bar with Safe-Area padding for iOS Home Indicator & Android Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-app-tabbar backdrop-blur-xl border-t border-app px-4 py-2 pb-safe transition-colors shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between px-3">
          {/* Tab 1: Movimenti */}
          <button
            id="btn-tab-history"
            onClick={() => {
              setIsSpeedDialOpen(false);
              onSelectView('history');
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-4 min-w-[76px] transition-all duration-150 cursor-pointer active:scale-95 ${
              activeView === 'history'
                ? 'text-app-main font-bold'
                : 'text-app-muted hover:text-app-sub'
            }`}
          >
            <div className="relative">
              <ListOrdered className={`w-5 h-5 ${activeView === 'history' ? 'scale-110' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 bg-amber-500 text-black font-mono-code text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono-code tracking-wider uppercase mt-1">
              Movimenti
            </span>
            {activeView === 'history' && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
            )}
          </button>

          {/* Center Prominent "+" Action Button */}
          <div className="relative -top-3">
            <button
              id="btn-main-add"
              onClick={() => setIsSpeedDialOpen((prev) => !prev)}
              aria-label="Aggiungi movimento"
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer border ${
                isSpeedDialOpen
                  ? 'bg-app-card text-app-main border-app rotate-45 scale-105'
                  : 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_18px_rgba(220,38,38,0.35)]'
              }`}
            >
              <Plus className="w-6 h-6 stroke-[2.5] transition-transform duration-200" />
            </button>
          </div>

          {/* Tab 2: Report & Analisi */}
          <button
            id="btn-tab-reports"
            onClick={() => {
              setIsSpeedDialOpen(false);
              onSelectView('reports');
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-4 min-w-[76px] transition-all duration-150 cursor-pointer active:scale-95 ${
              activeView === 'reports'
                ? 'text-app-main font-bold'
                : 'text-app-muted hover:text-app-sub'
            }`}
          >
            <PieChart className={`w-5 h-5 ${activeView === 'reports' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-mono-code tracking-wider uppercase mt-1">
              Report
            </span>
            {activeView === 'reports' && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
