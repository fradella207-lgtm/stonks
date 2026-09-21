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
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  UserCheck,
  FileSpreadsheet,
  Smartphone,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { AppSyncState, ThemeMode, UserProfile } from '../types.ts';

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
  onOpenMobileExport: () => void;
  onClearData: () => void;
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
  onOpenMobileExport,
  onClearData,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

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
      desc: 'Stile Nothing OS default ad alto contrasto',
      icon: <Moon className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-[#121216]',
      borderCol: 'border-zinc-700',
    },
    {
      id: 'black',
      name: 'Pure OLED',
      desc: 'Nero profondo #000000 a risparmio energetico',
      icon: <Laptop className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-black',
      borderCol: 'border-zinc-800',
    },
    {
      id: 'light',
      name: 'Bianco Minimal',
      desc: 'Tema chiaro elegante, pulito e leggibile',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      previewBg: 'bg-white',
      borderCol: 'border-zinc-300',
    },
  ];

  const getSyncBadge = () => {
    if (syncState === 'syncing') {
      return {
        text: pendingCount > 0 ? `Sincronizzazione (${pendingCount})` : 'Sincronizzazione...',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-500/30',
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />,
      };
    }
    if (syncState === 'offline' || syncState === 'error') {
      return {
        text: 'Offline (Archivio Locale Attivo)',
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-500/30',
        icon: <CloudOff className="w-3.5 h-3.5 text-rose-400" />,
      };
    }
    return {
      text: user ? 'Cloud Sincronizzato' : 'Archivio Locale (0ms)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/30',
      icon: <Cloud className="w-3.5 h-3.5 text-emerald-400" />,
    };
  };

  const syncInfo = getSyncBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-app-modal border border-app rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-app-main">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-subtle bg-app-subtle/50">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-app bg-app-card text-[10px] font-mono-code font-bold">
              <span>S</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.7)]" />
            </div>
            <h2 className="text-xs font-mono-code font-bold uppercase tracking-widest text-app-main">
              STONKS // CENTRO CONTROLLO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 no-scrollbar text-xs font-mono-code">
          {/* 1. Account & Cloud Synchronization */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-app-muted" />
              <span>Sincronizzazione & Cloud</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-app-subtle border border-app space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${syncInfo.bg}`}>
                    {syncInfo.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-app-main">{syncInfo.text}</div>
                    <div className="text-[10px] text-app-muted">
                      {pendingCount > 0 ? `${pendingCount} modifiche in attesa` : '0ms latenza locale garantita'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onManualSync}
                  className="px-2.5 py-1 rounded-lg bg-app-card border border-app text-app-main hover:bg-app-hover transition-colors text-[10px] font-bold cursor-pointer"
                  title="Verifica rete e sincronizza"
                >
                  Sync
                </button>
              </div>

              {/* User Account Login / Logout */}
              <div className="pt-2 border-t border-app-subtle flex items-center justify-between">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-6 h-6 rounded-full border border-app"
                        />
                      ) : (
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                      )}
                      <div className="truncate max-w-[170px]">
                        <div className="text-[11px] font-bold text-app-main truncate">
                          {user.displayName || 'Account Connesso'}
                        </div>
                        <div className="text-[9px] text-app-muted truncate">{user.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onLogout();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-900/40 text-[10px] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Esci</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-[10px] text-app-muted">
                      Accedi per salvare su Google Cloud
                    </div>
                    <button
                      onClick={() => {
                        onLogin();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Accedi con Google</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Theme Selection (including White / Bianco Minimal) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-app-muted" />
              <span>Tema Interfaccia (Scuro / Nero / Bianco)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-app-card border-red-500 shadow-md ring-1 ring-red-500/30'
                        : 'bg-app-subtle border-app hover:bg-app-hover'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border mb-2 ${t.previewBg} ${t.borderCol}`}
                    >
                      {t.icon}
                    </div>
                    <div className="text-[11px] font-bold text-app-main leading-tight">
                      {t.name}
                    </div>
                    <div className="text-[9px] text-app-muted mt-0.5 leading-tight">
                      {t.id === 'light' ? 'Chiaro' : t.id === 'black' ? 'OLED' : 'Dark'}
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Export Mobile App: Android Studio & Apple Devices */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-app-muted" />
              <span>Esporta per Android Studio & Apple iOS</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenMobileExport();
              }}
              className="w-full p-3 rounded-2xl bg-app-subtle hover:bg-app-hover border border-app flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-app-main flex items-center gap-1.5">
                    <span>Scarica Progetto Android Studio / Apple</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[8px]">
                      Safe-Area OK
                    </span>
                  </div>
                  <div className="text-[10px] text-app-muted">
                    Pacchetto ZIP con Kotlin, Gradle, status bar protetta e guida Apple PWA
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-app-muted" />
            </button>
          </div>

          {/* 4. Import / Export Data (CSV, JSON) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-app-muted" />
              <span>Gestione Dati, Backup & Fogli di Calcolo</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenDataTransfer();
              }}
              className="w-full p-3 rounded-2xl bg-app-subtle hover:bg-app-hover border border-app flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-app-card border border-app flex items-center justify-center text-app-main">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-app-main">
                    Importa / Esporta CSV & JSON
                  </div>
                  <div className="text-[10px] text-app-muted">
                    Compatibile con Excel, Fogli Google e backup offline
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-app-muted" />
            </button>
          </div>

          {/* 5. Clear Local Data */}
          <div className="pt-2 border-t border-app-subtle">
            {confirmClear ? (
              <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
                <p className="text-[11px] text-red-400">
                  Vuoi davvero eliminare tutti i movimenti memorizzati sul dispositivo?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClearData();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Sì, Cancella Dati
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 rounded-xl bg-app-card border border-app text-app-muted text-xs cursor-pointer"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 px-3 rounded-xl text-app-muted hover:text-red-500 hover:bg-red-950/20 text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Azzera Dati Locali</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
