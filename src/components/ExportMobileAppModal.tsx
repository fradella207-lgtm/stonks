/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Download,
  CheckCircle2,
  ExternalLink,
  Shield,
  X,
  Code2,
  Sparkles,
} from 'lucide-react';
import { generateMobileAppZip } from '../services/mobileExport.ts';

interface ExportMobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportMobileAppModal: React.FC<ExportMobileAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'apple'>('android');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stonks.app';

  const handleDownloadZip = async () => {
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      const blob = await generateMobileAppZip(currentUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stonks-mobile-project-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Errore generazione pacchetto mobile:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0f0f14] theme-light:bg-white text-zinc-100 theme-light:text-zinc-900 border border-white/10 theme-light:border-zinc-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 theme-light:border-zinc-200 bg-zinc-950/60 theme-light:bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)]" />
            <span className="font-mono-code text-xs uppercase tracking-widest font-bold">
              Esporta App Mobile (Android & Apple)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white theme-light:hover:text-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono-code">
          {/* Status bar & safe area reassurance banner */}
          <div className="p-3 rounded-xl bg-emerald-950/30 theme-light:bg-emerald-50 border border-emerald-500/30 text-emerald-400 theme-light:text-emerald-800 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Predisposizione Barra di Stato Attiva:</span>{' '}
              Il codice e il layout includono già <code className="bg-black/30 px-1 py-0.5 rounded">viewport-fit=cover</code>,{' '}
              <code className="bg-black/30 px-1 py-0.5 rounded">env(safe-area-inset-top)</code> e gestione nativa WindowInsets.
              Nessun elemento interferirà con Dynamic Island, Notch o punch-hole.
            </div>
          </div>

          {/* Platform toggle tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-900/80 theme-light:bg-zinc-100 border border-white/5">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'android'
                  ? 'bg-zinc-800 theme-light:bg-white text-zinc-100 theme-light:text-zinc-900 shadow-sm border border-white/10 theme-light:border-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200 theme-light:hover:text-zinc-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('apple')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'apple'
                  ? 'bg-zinc-800 theme-light:bg-white text-zinc-100 theme-light:text-zinc-900 shadow-sm border border-white/10 theme-light:border-zinc-200'
                  : 'text-zinc-400 hover:text-zinc-200 theme-light:hover:text-zinc-700'
              }`}
            >
              <Apple className="w-4 h-4 text-zinc-200 theme-light:text-zinc-800" />
              <span>Dispositivi Apple</span>
            </button>
          </div>

          {/* Android Studio Tab Content */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 theme-light:bg-zinc-50 border border-white/5 space-y-2 text-zinc-300 theme-light:text-zinc-700">
                <div className="font-bold text-zinc-100 theme-light:text-zinc-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-red-500" />
                  Progetto Android Studio Completo (Kotlin + Gradle)
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400 theme-light:text-zinc-600">
                  Genera un pacchetto completo con <code className="text-zinc-200 theme-light:text-zinc-900">build.gradle.kts</code>,{' '}
                  <code className="text-zinc-200 theme-light:text-zinc-900">AndroidManifest.xml</code>, e <code className="text-zinc-200 theme-light:text-zinc-900">MainActivity.kt</code> preconfigurata.
                </p>

                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400 theme-light:text-zinc-600 pt-1">
                  <li>Scarica il pacchetto ZIP premendo il tasto sotto.</li>
                  <li>Estrai la cartella sul tuo computer.</li>
                  <li>In <strong>Android Studio</strong>, clicca su <strong>Open</strong> e scegli la cartella estratta.</li>
                  <li>Attendi il sync automatico di Gradle e clicca sul tasto <strong>Run (Play)</strong>.</li>
                </ol>
              </div>

              <div className="p-2.5 rounded-lg border border-dashed border-white/15 theme-light:border-zinc-300 text-[10px] text-zinc-400 theme-light:text-zinc-600">
                * Include supporto fotocamera/file chooser per gli scontrini e gestione del tasto indietro nativo.
              </div>
            </div>
          )}

          {/* Apple iOS Tab Content */}
          {activeTab === 'apple' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 theme-light:bg-zinc-50 border border-white/5 space-y-2.5 text-zinc-300 theme-light:text-zinc-700">
                <div className="font-bold text-zinc-100 theme-light:text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Installazione Istantanea su iPhone / iPad (Safari)
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400 theme-light:text-zinc-600">
                  L&apos;applicazione supporta la modalità standalone a schermo intero senza barre del browser:
                </p>

                <div className="space-y-1.5 text-[11px] bg-black/40 theme-light:bg-zinc-100 p-2.5 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-center font-bold text-[10px] text-white">1</span>
                    <span>Apri l&apos;URL in <strong>Safari</strong> sul tuo iPhone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-center font-bold text-[10px] text-white">2</span>
                    <span>Tocca il tasto <strong>Condividi</strong> (quadrato con freccia)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-zinc-800 text-center font-bold text-[10px] text-white">3</span>
                    <span>Seleziona <strong>&quot;Aggiungi alla schermata Home&quot;</strong></span>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="font-bold text-[11px] text-zinc-200 theme-light:text-zinc-800 mb-1">
                    Opzione Sviluppatore Xcode:
                  </div>
                  <p className="text-[10px] text-zinc-400 theme-light:text-zinc-500">
                    Il file ZIP da scaricare include anche il file <code className="text-zinc-300">ViewController.swift</code> con <code className="text-zinc-300">WKWebView</code> e safe area layout guide per il compilatore nativo Apple.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Download ZIP Button */}
          <div className="pt-2">
            <button
              onClick={handleDownloadZip}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Pacchetto ZIP Scaricato!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Scarica Progetto Completo (.ZIP)</span>
                </>
              )}
            </button>
            <p className="text-[9px] text-center text-zinc-500 mt-2">
              Contiene sia il codice sorgente Android Studio che i file per Apple iOS & PWA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
