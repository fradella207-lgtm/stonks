/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Database,
  Send,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import { firebaseSyncService } from '../services/firebaseSync.ts';
import { UserProfile } from '../types.ts';
import { FirebaseConfigModal } from './FirebaseConfigModal.tsx';
import { getActiveFirebaseConfig } from '../services/firebaseConfig.ts';

interface LoginScreenProps {
  onSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  // Tabs: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Diagnostic states for Google Auth errors
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const activeConfig = getActiveFirebaseConfig();
  const isCustomProject = Boolean(localStorage.getItem('stonks_custom_firebase_config'));

  const handleTabChange = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setIsOperationNotAllowed(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsOperationNotAllowed(false);
    setUnauthorizedDomain(null);
    setLoading(true);

    try {
      if (activeTab === 'register') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Inserisci email e password.');
        }
        if (password.length < 6) {
          throw new Error('La password deve avere almeno 6 caratteri.');
        }

        const profile = await firebaseSyncService.registerWithEmail(
          email.trim(),
          password,
          displayName.trim() || undefined
        );
        onSuccess(profile);
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Inserisci email e password per accedere.');
        }

        const profile = await firebaseSyncService.loginWithEmail(email.trim(), password);
        onSuccess(profile);
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      const code = err?.code || '';
      const msg = String(err?.message || '');

      if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setIsOperationNotAllowed(true);
        setErrorMsg(
          activeTab === 'register'
            ? 'Il provider "Email/Password" non è ancora attivo nella console Firebase del progetto.'
            : 'L\'accesso "Email/Password" non è ancora attivo nella console Firebase del progetto.'
        );
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('Questa email è già registrata. Effettua il login oppure recupera la password.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email o password errati. Riprova o usa "Password dimenticata".');
      } else if (code === 'auth/user-not-found') {
        setErrorMsg('Nessun account associato a questa email.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Formato email non valido.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('La password è troppo debole (minimo 6 caratteri).');
      } else {
        setErrorMsg(err.message || 'Errore durante l\'autenticazione. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setIsOperationNotAllowed(false);

    if (!email.trim()) {
      setErrorMsg('Inserisci l\'indirizzo email del tuo account per ricevere il link di recupero.');
      return;
    }

    setLoading(true);
    try {
      await firebaseSyncService.sendPasswordReset(email.trim());
      setSuccessMsg(
        `Email inviata con successo a ${email.trim()}! Controlla la casella di posta (e lo spam) per reimpostare la tua password.`
      );
    } catch (err: any) {
      console.warn('Password reset error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('Nessun account registrato con questo indirizzo email.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Formato email non valido.');
      } else {
        setErrorMsg(err.message || 'Impossibile inviare l\'email di recupero. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsOperationNotAllowed(false);
    setUnauthorizedDomain(null);
    setLoading(true);

    try {
      const profile = await firebaseSyncService.loginWithGoogle();
      onSuccess(profile);
    } catch (err: any) {
      console.warn('Google login error:', err);
      const code = err?.code || '';
      const msg = String(err?.message || '');

      if (code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const currentHost = window.location.hostname;
        setUnauthorizedDomain(currentHost);
        setErrorMsg(
          `Il dominio web "${currentHost}" non è ancora autorizzato per Google Auth nella console Firebase.`
        );
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setErrorMsg('Il browser ha bloccato la finestra popup di Google. Abilita i popup per questo sito e riprova.');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setIsOperationNotAllowed(true);
        setErrorMsg('L\'accesso con Google non è ancora attivo nella console Firebase del progetto.');
      } else {
        setErrorMsg(err.message || 'Accesso con Google non riuscito. Verifica la connessione o il progetto Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDomainToClipboard = () => {
    if (unauthorizedDomain) {
      navigator.clipboard.writeText(unauthorizedDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const firebaseConsoleProvidersUrl = `https://console.firebase.google.com/project/${activeConfig.projectId}/authentication/providers`;
  const firebaseConsoleSettingsUrl = `https://console.firebase.google.com/project/${activeConfig.projectId}/authentication/settings`;

  return (
    <div className="min-h-screen bg-app-canvas flex items-center justify-center p-3 sm:p-4 relative overflow-hidden text-app-main">
      {/* Background Dots */}
      <div className="fixed inset-0 bg-dots pointer-events-none opacity-30 z-0" />

      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-app-modal border border-app rounded-[32px] p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Firebase Sync with Android Banner Header */}
        <div className="mb-4 p-2.5 rounded-2xl bg-app-subtle/80 border border-app flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono-code font-bold uppercase text-app-sub">
                  Firebase Android Sync:
                </span>
                <span
                  className={`text-[9px] font-mono-code px-1.5 py-0.2 rounded ${
                    isCustomProject
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isCustomProject ? 'Android Attivo' : 'Predefinito'}
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-app-muted truncate">
                {activeConfig.projectId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[10px] font-mono-code font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
            title="Collega Firebase Android"
          >
            <Database className="w-3 h-3" />
            <span>Collega</span>
          </button>
        </div>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl border border-emerald-500/30 bg-slate-950/90 mb-2 shadow-lg overflow-hidden">
            <img src="/icona.svg" alt="stonks logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="font-mono-code text-lg font-bold tracking-tight uppercase flex items-center gap-2 text-app-main">
            <span>stonks</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-muted font-normal lowercase">
              v2.6
            </span>
          </h1>
          <p className="text-[11px] text-app-muted font-mono-code mt-0.5">
            FinTech Minimal • Gestione Spese & Entrate
          </p>
        </div>

        {/* 3 Prominent Tabs: Accedi / Crea Account / Password Dimenticata */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-app-subtle border border-app rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`py-2 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-app-card text-app-main font-bold shadow-sm border border-app'
                : 'text-app-muted hover:text-app-main'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`py-2 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-app-card text-app-main font-bold shadow-sm border border-app'
                : 'text-app-muted hover:text-app-main'
            }`}
          >
            Registrati
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('forgot')}
            className={`py-2 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'forgot'
                ? 'bg-app-card text-amber-400 font-bold shadow-sm border border-amber-500/40'
                : 'text-app-muted hover:text-amber-400'
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>Recupera</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-200 text-xs font-mono-code flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-mono-code flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Diagnostic: Unauthorized Domain for Google Sign In */}
        {unauthorizedDomain && (
          <div className="mb-4 p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-2xl text-amber-100 text-xs font-mono-code space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="font-bold">Come autorizzare questo dominio per Google Login:</div>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
              Firebase richiede che l'indirizzo del browser sia autorizzato prima di permettere il login Google:
            </p>
            <div className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-xl border border-amber-500/30">
              <span className="text-[11px] truncate font-mono-code">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={copyDomainToClipboard}
                className="text-amber-300 hover:text-white p-1 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'Copiato' : 'Copia'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={firebaseConsoleSettingsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span>Apri Impostazioni Domini</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Diagnostic: Provider Not Allowed */}
        {isOperationNotAllowed && (
          <div className="mb-4 p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-2xl text-amber-100 text-xs font-mono-code space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="font-bold">Abilita il metodo di accesso in Firebase:</div>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
              Apri la console Firebase e imposta lo stato su "Abilitato" in Authentication &gt; Sign-in method.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={firebaseConsoleProvidersUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span>Apri Console Firebase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsOperationNotAllowed(false);
                  setErrorMsg('');
                }}
                className="py-1.5 px-3 rounded-xl bg-app-card border border-app hover:bg-app-hover text-app-main font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Riprova</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PASSWORD DIMENTICATA (RECUPERA PASSWORD) */}
        {activeTab === 'forgot' ? (
          <form onSubmit={handlePasswordReset} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono-code text-amber-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Inserisci l'email del tuo account: ti invieremo un link sicuro tramite Firebase Auth per creare una nuova password.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
                Indirizzo Email dell'account
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="email"
                  required
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-app-input border border-app rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Invio in corso...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Invia link di recupero password</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className="w-full py-2 text-center text-xs font-mono-code text-app-muted hover:text-app-main flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ricordi la password? Torna al login</span>
            </button>
          </form>
        ) : (
          /* TAB 1 & 2: ACCEDI / REGISTRATI */
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
                  Nome o Nickname (Opzionale)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                  <input
                    type="text"
                    placeholder="Il tuo nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-app-input border border-app rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
                Indirizzo Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="email"
                  required
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-app-input border border-app rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-app-input border border-app rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Explicit, unmistakable "Password Dimenticata?" link right under password input */}
              {activeTab === 'login' && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-[11px] font-mono-code text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Password dimenticata?</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Operazione in corso...</span>
              ) : activeTab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crea Nuovo Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Accedi</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Separator & Google Sign In */}
        {activeTab !== 'forgot' && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-app-subtle" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono-code">
                <span className="bg-app-modal px-2 text-app-muted">oppure</span>
              </div>
            </div>

            {/* Quick Google Sign In */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-app bg-app-card hover:bg-app-hover text-app-main font-mono-code text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continua con account Google</span>
              </button>
            </div>
          </>
        )}

        {/* Bottom Link to connect Android Firebase project */}
        <div className="mt-5 pt-3 border-t border-app-subtle flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-app-subtle hover:bg-app-hover border border-app text-app-sub hover:text-app-main font-mono-code text-[11px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>Configura / Incolla dati Firebase Android</span>
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono-code text-app-muted mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autenticazione sicura • Dati protetti</span>
          </div>
        </div>
      </div>

      {/* Firebase Config Modal for Android Project Sync */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};
