/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Palette,
  Moon,
  Sun,
  Laptop,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  MessageSquarePlus,
  Lightbulb,
  ChevronRight,
  Target,
  Languages,
} from 'lucide-react';
import { AppSyncState, ThemeMode, UserProfile } from '../types.ts';
import { FeedbackModal } from './FeedbackModal.tsx';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../services/i18n.ts';

interface UnifiedMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  syncState: AppSyncState;
  pendingCount: number;
  onManualSync: () => void;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDataTransfer: () => void;
  onClearData: () => void;
  monthlyBudget?: number;
  onUpdateMonthlyBudget?: (amount: number) => void;
}

export const UnifiedMenuModal: React.FC<UnifiedMenuModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  syncState,
  pendingCount,
  onManualSync,
  user,
  onLogin,
  onLogout,
  onOpenDataTransfer,
  onClearData,
  monthlyBudget,
  onUpdateMonthlyBudget,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [clearStep, setClearStep] = useState<0 | 1 | 2>(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetValue, setBudgetValue] = useState<string>(String(monthlyBudget || 1500));

  if (!isOpen) return null;

  const themes: {
    id: ThemeMode;
    name: string;
    desc: string;
    icon: React.ReactNode;
    previewBg: string;
    borderCol: string;
  }[] = [
    {
      id: 'dark',
      name: 'Dark Obsidian',
      desc: 'High contrast Nothing OS dark style',
      icon: <Moon className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-[#121216]',
      borderCol: 'border-zinc-700',
    },
    {
      id: 'black',
      name: 'Pure OLED',
      desc: 'Deep #000000 black battery saver',
      icon: <Laptop className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-black',
      borderCol: 'border-zinc-800',
    },
    {
      id: 'light',
      name: 'Minimal White',
      desc: 'Clean, crisp and legible light theme',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      previewBg: 'bg-white',
      borderCol: 'border-zinc-300',
    },
  ];

  const getSyncBadge = () => {
    if (syncState === 'syncing') {
      return {
        text: pendingCount > 0 ? `Syncing (${pendingCount})...` : 'Syncing...',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-500/30',
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />,
      };
    }
    if (syncState === 'offline' || syncState === 'error') {
      return {
        text: 'Offline (Local Active)',
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-500/30',
        icon: <CloudOff className="w-3.5 h-3.5 text-rose-400" />,
      };
    }
    return {
      text: user ? 'Synced with Cloud' : 'Local Storage Only',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/30',
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
    };
  };

  const syncBadge = getSyncBadge();

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetValue.replace(',', '.'));
    if (!isNaN(val) && val > 0 && onUpdateMonthlyBudget) {
      onUpdateMonthlyBudget(val);
      setIsEditingBudget(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-app-modal border border-app rounded-[32px] p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-app-main max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-subtle pb-3">
          <div>
            <span className="font-mono-code text-xs font-bold uppercase tracking-widest text-app-main block">
              {t('control_center')}
            </span>
            <span className="text-[10px] text-app-muted font-mono-code">
              {t('control_center_subtitle')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-app-muted hover:text-app-main transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 font-mono-code">
          {/* 1. Account & Sync Section */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-app-muted" />
              <span>{t('account_sync')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${syncBadge.bg} ${syncBadge.color}`}
                >
                  {syncBadge.icon}
                  <span>{syncBadge.text}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onManualSync()}
                  disabled={syncState === 'syncing'}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-app-card border border-app text-app-sub hover:text-app-main text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  <span>Sync</span>
                </button>
              </div>

              {/* User Account / Google Sign-in */}
              <div className="pt-2 border-t border-app-subtle flex items-center justify-between gap-3">
                {user ? (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-7 h-7 rounded-full border border-app shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-app-main truncate">
                          {user.displayName || 'Connected Account'}
                        </div>
                        <div className="text-[9px] text-app-muted truncate">{user.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLogout()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-900/40 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>{t('sign_out')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 w-full flex-wrap sm:flex-nowrap">
                    <div className="text-[10px] text-app-muted min-w-0 flex-1">
                      {t('sign_in_google_desc')}
                    </div>
                    <button
                      type="button"
                      onClick={() => onLogin()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-[0_0_10px_rgba(220,38,38,0.3)] shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t('sign_in_google')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Language Selection (Requirement: Lingua opzionale con Italiano, Inglese, Spagnolo, Francese, Tedesco) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-app-muted" />
                <span>{t('language_title')}</span>
              </div>
              <span className="text-[9px] text-red-500 uppercase font-bold">
                {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {SUPPORTED_LANGUAGES.map((langOpt) => {
                const isSelected = language === langOpt.code;
                return (
                  <button
                    key={langOpt.code}
                    type="button"
                    onClick={() => setLanguage(langOpt.code)}
                    className={`py-2 px-1.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-app-card border-red-500 shadow-md ring-1 ring-red-500/40 text-app-main'
                        : 'bg-app-subtle border-app text-app-muted hover:text-app-main hover:bg-app-hover'
                    }`}
                  >
                    <span className="text-base leading-none mb-1">{langOpt.flag}</span>
                    <span className="text-[10px] font-bold uppercase">{langOpt.code}</span>
                    <span className="text-[8px] text-app-muted truncate w-full">
                      {langOpt.nativeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Monthly Spending Limit (Budget) */}
          {onUpdateMonthlyBudget && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-app-muted" />
                <span>{t('spending_limit_title')}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-app-subtle border border-app space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-app-main">
                      €{(monthlyBudget || 1500).toFixed(2)} / month
                    </div>
                    <div className="text-[10px] text-app-muted">
                      {t('spending_limit_desc')}
                    </div>
                  </div>

                  {!isEditingBudget ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetValue(String(monthlyBudget || 1500));
                        setIsEditingBudget(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-app-card border border-app text-app-main hover:bg-app-hover text-[10px] font-bold cursor-pointer"
                    >
                      {t('change_limit')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(false)}
                      className="text-app-muted hover:text-app-main p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isEditingBudget && (
                  <form onSubmit={handleSaveBudget} className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted text-xs">
                        €
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        className="w-full bg-app-card border border-app rounded-xl pl-7 pr-3 py-1.5 text-xs text-app-main font-mono-code outline-none focus:border-red-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                    >
                      {t('save')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 4. Theme Selection */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-app-muted" />
              <span>{t('appearance_title')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {themes.map((themeItem) => {
                const isSelected = currentTheme === themeItem.id;
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => onThemeChange(themeItem.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-app-card border-red-500 shadow-md ring-1 ring-red-500/30'
                        : 'bg-app-subtle border-app hover:bg-app-hover'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border mb-2 ${themeItem.previewBg} ${themeItem.borderCol}`}
                    >
                      {themeItem.icon}
                    </div>
                    <div className="text-[11px] font-bold text-app-main leading-tight truncate w-full px-0.5">
                      {themeItem.name}
                    </div>
                    <div className="text-[9px] text-app-muted mt-0.5 leading-tight">
                      {themeItem.id === 'light' ? 'Light' : themeItem.id === 'black' ? 'OLED' : 'Dark'}
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Import / Export Data */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-app-muted" />
              <span>{t('backup_title')}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDataTransfer();
              }}
              className="w-full p-3 rounded-2xl bg-app-subtle hover:bg-app-hover border border-app flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-app-card border border-app flex items-center justify-center text-app-main shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-app-main">{t('manage_data_btn')}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold shrink-0">
                      Sheets / CSV
                    </span>
                  </div>
                  <div className="text-[10px] text-app-muted mt-0.5 leading-relaxed">
                    {t('backup_desc')}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-app-muted shrink-0" />
            </button>
          </div>

          {/* 6. Feedback & Feature Requests */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-red-500" />
              <span>{t('feedback_title')}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="w-full p-3 rounded-2xl bg-app-subtle hover:bg-app-hover border border-app flex items-center justify-between gap-3 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-app-card border border-app flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform shrink-0">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-app-main">{t('send_feedback_btn')}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-red-600/15 border border-red-500/30 text-red-600 dark:text-red-400 text-[8px] font-bold shrink-0">
                      Ideas & Bugs
                    </span>
                  </div>
                  <div className="text-[10px] text-app-muted mt-0.5 leading-relaxed">
                    {t('feedback_desc')}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-app-muted group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>

          {/* 7. Clear Local Data */}
          <div className="pt-2 border-t border-app-subtle">
            {clearStep === 1 && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2.5 font-mono-code">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{t('clear_data_confirm_1')}</span>
                </div>
                <p className="text-[10px] text-app-muted">
                  {t('clear_data_confirm_2')}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearData();
                      setClearStep(0);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {t('delete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearStep(0)}
                    className="px-4 py-2 rounded-xl bg-app-card border border-app text-app-muted text-xs cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {clearStep === 0 && (
              <button
                type="button"
                onClick={() => setClearStep(1)}
                className="w-full py-2.5 px-3 rounded-2xl border border-app-subtle hover:border-red-500/30 bg-app-subtle/40 hover:bg-red-950/10 text-app-muted hover:text-red-400 text-xs font-mono-code flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clear_data_btn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback & Suggestion Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={user}
      />
    </div>
  );
};
