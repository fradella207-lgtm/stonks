/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Palette,
  Download,
  Upload,
  Database,
  Smartphone,
  ShieldCheck,
  Trash2,
  Check,
  Cloud,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { ThemeMode } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenDataTransfer: () => void;
  onClearData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  onOpenDataTransfer,
  onClearData,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const themes: { id: ThemeMode; name: string; desc: string; icon: React.ReactNode; previewBg: string; borderCol: string }[] = [
    {
      id: 'dark',
      name: 'Dark Obsidian',
      desc: 'Stile Nothing OS default con contrasto calibrato',
      icon: <Moon className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-[#08080a]',
      borderCol: 'border-zinc-800',
    },
    {
      id: 'black',
      name: 'Pure OLED',
      desc: 'Nero assoluto #000000 per display AMOLED',
      icon: <Laptop className="w-4 h-4 text-zinc-300" />,
      previewBg: 'bg-black',
      borderCol: 'border-zinc-700',
    },
    {
      id: 'light',
      name: 'Paper Minimal',
      desc: 'Interfaccia chiara con accenti ad alto contrasto',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      previewBg: 'bg-[#f5f6f8]',
      borderCol: 'border-zinc-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)]" />
            <h2 className="text-xs font-mono-code font-bold uppercase tracking-widest text-zinc-100">
              IMPOSTAZIONI // STONKS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 no-scrollbar">
          {/* 1. Theme Selection Section */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
              <span>Aspetto & Temi</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-zinc-900/90 border-white/30 shadow-md'
                        : 'bg-zinc-950/40 border-white/5 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${t.previewBg} ${t.borderCol}`}
                      >
                        {t.icon}
                      </div>
                      <div>
                        <div className="text-xs font-mono-code font-bold text-zinc-200 flex items-center gap-2">
                          <span>{t.name}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono-code text-zinc-500">
                          {t.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-zinc-200 mr-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dati & Sincronizzazione Section */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <span>Gestione Dati & Flussi</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-mono-code font-bold text-zinc-200">
                      Offline-First Engine (0ms)
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono-code">
                      Sincronizzazione automatica attiva
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-code bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                  PRONTO
                </span>
              </div>

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenDataTransfer();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 font-mono-code text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Importa o Esporta Dati (CSV / JSON)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Android Studio & PWA Info */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
              <span>Architettura Android & Web</span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/40 border border-white/5 text-[11px] font-mono-code text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">Ottimizzato per Android Studio</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                PWA manifest, safe-area insets, viewport adattivo per pubblicazione Web/Play Store/TWA.
              </p>
            </div>
          </div>

          {/* 4. Danger Zone / Svuota Dati */}
          {onClearData && (
            <div className="pt-2 border-t border-white/5">
              {confirmClear ? (
                <div className="p-3 rounded-2xl bg-red-950/30 border border-red-800/40 space-y-2">
                  <p className="text-[11px] font-mono-code text-red-400">
                    Sei sicuro di voler azzerare tutti i dati locali?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearData();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-code text-xs font-bold transition-colors"
                    >
                      Sì, Cancella Tutto
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 font-mono-code text-xs"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2 px-3 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-950/20 font-mono-code text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Azzera Dati Locali</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
