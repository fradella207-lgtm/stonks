/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Save,
  HelpCircle,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import {
  FirebaseConfigObject,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  resetFirebaseConfigToDefault,
  parseFirebaseConfigSnippet,
} from '../services/firebaseConfig.ts';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeConfig, setActiveConfig] = useState<FirebaseConfigObject>(getActiveFirebaseConfig());
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [pasteSnippet, setPasteSnippet] = useState<string>('');
  const [pasteFeedback, setPasteFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Form fields
  const [projectId, setProjectId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [authDomain, setAuthDomain] = useState<string>('');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState<string>('');
  const [storageBucket, setStorageBucket] = useState<string>('');
  const [messagingSenderId, setMessagingSenderId] = useState<string>('');

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getActiveFirebaseConfig();
      setActiveConfig(cfg);
      setIsCustom(Boolean(localStorage.getItem('stonks_custom_firebase_config')));
      setProjectId(cfg.projectId || '');
      setApiKey(cfg.apiKey || '');
      setAppId(cfg.appId || '');
      setAuthDomain(cfg.authDomain || '');
      setFirestoreDatabaseId(cfg.firestoreDatabaseId || '');
      setStorageBucket(cfg.storageBucket || '');
      setMessagingSenderId(cfg.messagingSenderId || '');
      setPasteSnippet('');
      setPasteFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplySnippet = () => {
    if (!pasteSnippet.trim()) {
      setPasteFeedback({
        text: 'Incolla prima il codice della configurazione Firebase.',
        success: false,
      });
      return;
    }

    try {
      let parsed = parseFirebaseConfigSnippet(pasteSnippet);

      // Also try JSON parse if standard snippet extraction found nothing
      if (Object.keys(parsed).length === 0) {
        try {
          const json = JSON.parse(pasteSnippet);
          parsed = json;
        } catch {
          // ignore
        }
      }

      if (parsed.projectId || parsed.apiKey || parsed.appId) {
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.appId) setAppId(parsed.appId);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.firestoreDatabaseId) setFirestoreDatabaseId(parsed.firestoreDatabaseId);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);

        setPasteFeedback({
          text: 'Configurazione estratta con successo! Controlla i campi qui sotto e premi "Salva e Ricarica".',
          success: true,
        });
      } else {
        setPasteFeedback({
          text: 'Impossibile estrarre i parametri. Inserisci direttamente i campi a mano qui sotto.',
          success: false,
        });
      }
    } catch {
      setPasteFeedback({
        text: 'Errore nell\'analisi dello snippet.',
        success: false,
      });
    }
  };

  const handleSaveAndReload = () => {
    if (!projectId.trim() || !apiKey.trim() || !appId.trim()) {
      setPasteFeedback({
        text: 'Compila almeno i campi obbligatori: Project ID, API Key e App ID.',
        success: false,
      });
      return;
    }

    const configToSave: Partial<FirebaseConfigObject> = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      appId: appId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      firestoreDatabaseId: firestoreDatabaseId.trim() || undefined,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: messagingSenderId.trim() || undefined,
    };

    saveCustomFirebaseConfig(configToSave);
    window.location.reload();
  };

  const handleResetDefault = () => {
    if (window.confirm('Vuoi ripristinare la configurazione Firebase predefinita dell\'applicazione?')) {
      resetFirebaseConfigToDefault();
      window.location.reload();
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-app-card border border-app rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-app flex items-center justify-between gap-3 bg-app-subtle/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-app-main flex items-center gap-2">
                <span>Configurazione Firebase</span>
                <span className="text-[10px] uppercase font-mono-code px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Android & Web Sync
                </span>
              </h3>
              <p className="text-xs text-app-muted">
                Collega la web app allo stesso database Firestore e autenticazione della tua app Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl bg-app-subtle hover:bg-app-hover border border-app text-app-sub hover:text-app-main transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Current Connected Status */}
          <div className="p-3.5 rounded-2xl bg-app-subtle/70 border border-app space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-app-sub flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-400" />
                Progetto attualmente attivo:
              </span>
              <span
                className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${
                  isCustom
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isCustom ? 'Personalizzato (Android)' : 'Predefinito AI Studio'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono-code text-xs text-app-main bg-app-card/60 px-3 py-2 rounded-xl border border-app-subtle">
              <span className="truncate">{activeConfig.projectId}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(activeConfig.projectId, 'project')}
                className="text-app-muted hover:text-app-main p-1 transition-colors"
                title="Copia Project ID"
              >
                {copiedField === 'project' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {activeConfig.firestoreDatabaseId && (
              <div className="text-[11px] text-app-sub flex items-center justify-between px-1">
                <span className="font-mono-code text-app-muted">Database Firestore:</span>
                <span className="font-mono-code text-app-main text-[11px] truncate max-w-[240px]">
                  {activeConfig.firestoreDatabaseId}
                </span>
              </div>
            )}
          </div>

          {/* Collapsible Instructions */}
          <div className="rounded-2xl border border-app-subtle bg-app-subtle/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-app-sub hover:text-app-main cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Come ottenere la configurazione Web dallo stesso Firebase Android
              </span>
              <HelpCircle className="w-4 h-4 text-app-muted" />
            </button>
            {showInstructions && (
              <div className="p-3.5 pt-0 text-xs text-app-sub space-y-2.5 border-t border-app-subtle/50 mt-1 font-sans">
                <ol className="list-decimal list-inside space-y-1.5 text-app-muted">
                  <li>
                    Apri la <strong>Firebase Console</strong> del progetto su cui hai registrato l'app Android.
                  </li>
                  <li>
                    Fai clic sull'icona a forma di <strong>Ingranaggio (Impostazioni progetto)</strong> in alto a sinistra.
                  </li>
                  <li>
                    Scorri in basso fino alla sezione <strong>"Le tue app"</strong>.
                  </li>
                  <li>
                    Se vedi solo l'app Android, fai clic sul pulsante <strong>Aggiungi app (icona &lt;/&gt; Web)</strong> per registrare anche l'app Web.
                  </li>
                  <li>
                    Copia l'oggetto JavaScript <code className="text-amber-400">const firebaseConfig = &#123; ... &#125;</code> generato e incollalo nel riquadro sottostante!
                  </li>
                </ol>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Così facendo, Firestore e Google Auth condivideranno gli stessi utenti e le stesse collezioni di spesa in tempo reale!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Fast Paste Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-app-sub block">
              Incolla Rapido (Snippet Firebase Web):
            </label>
            <textarea
              value={pasteSnippet}
              onChange={(e) => setPasteSnippet(e.target.value)}
              placeholder={'const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "tuo-progetto.firebaseapp.com",\n  projectId: "tuo-progetto",\n  appId: "1:..."\n};'}
              rows={4}
              className="w-full p-3 rounded-2xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main placeholder:text-app-muted focus:outline-none focus:border-amber-500/50 resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleApplySnippet}
                className="py-1.5 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold font-mono-code flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Estrai dai dati incollati</span>
              </button>
            </div>
            {pasteFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  pasteFeedback.success
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {pasteFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{pasteFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-2 border-t border-app">
            <span className="text-xs font-bold text-app-sub block">Parametri Progetto:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  Project ID *
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="es. my-app-12345"
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  API Key *
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  App ID (Web) *
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:1234567890:web:abcdef"
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="es. my-app-12345.firebaseapp.com"
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  Firestore Database ID (opzionale)
                </label>
                <input
                  type="text"
                  value={firestoreDatabaseId}
                  onChange={(e) => setFirestoreDatabaseId(e.target.value)}
                  placeholder="vuoto per database (default)"
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-code text-app-muted block mb-1">
                  Storage Bucket (opzionale)
                </label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="my-app-12345.firebasestorage.app"
                  className="w-full px-3 py-2 rounded-xl bg-app-subtle/60 border border-app text-xs font-mono-code text-app-main focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-app bg-app-subtle/40 flex flex-wrap items-center justify-between gap-2">
          {isCustom && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-2 rounded-xl bg-app-subtle hover:bg-red-500/10 text-app-sub hover:text-red-400 border border-app text-xs font-mono-code flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina Predefinito</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-app-subtle hover:bg-app-hover border border-app text-xs font-mono-code text-app-sub hover:text-app-main transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handleSaveAndReload}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs font-mono-code flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salva e Connetti</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
