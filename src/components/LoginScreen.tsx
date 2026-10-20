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
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { firebaseSyncService } from '../services/firebaseSync.ts';
import { UserProfile } from '../types.ts';

interface LoginScreenProps {
  onSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Inserisci un indirizzo email e una password.');
        }
        if (password.length < 6) {
          throw new Error('La password deve contenere almeno 6 caratteri.');
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

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email o password errati. Riprova o usa "Password dimenticata".');
      } else if (code === 'auth/user-not-found') {
        setErrorMsg('Nessun account trovato con questa email. Registrati per iniziare.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('Questa email è già associata a un account. Effettua il login.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Inserisci un formato email valido.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('La password è troppo debole (minimo 6 caratteri).');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Troppi tentativi falliti. Riprova tra qualche minuto.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Errore di connessione. Controlla la rete internet.');
      } else {
        setErrorMsg(err.message || 'Si è verificato un errore. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Inserisci l\'indirizzo email del tuo account.');
      return;
    }

    setLoading(true);
    try {
      await firebaseSyncService.sendPasswordReset(email.trim());
      setSuccessMsg(
        `Email di recupero inviata a ${email.trim()}! Controlla la posta in arrivo (anche la cartella spam) per reimpostare la tua password.`
      );
    } catch (err: any) {
      console.warn('Password reset error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('Nessun account associato a questa email.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Inserisci un indirizzo email valido.');
      } else {
        setErrorMsg('Impossibile inviare l\'email di recupero. Riprova tra poco.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
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

      if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setErrorMsg('La finestra di Google è stata bloccata. Abilita i popup nel browser o usa Email e Password.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setErrorMsg('Accesso Google non disponibile in questo ambiente. Accedi o crea un account con Email e Password.');
      } else {
        setErrorMsg('Accesso con Google non riuscito. Accedi con Email e Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-canvas flex items-center justify-center p-4 relative overflow-hidden text-app-main">
      {/* Subtle Background Dots */}
      <div className="fixed inset-0 bg-dots pointer-events-none opacity-25 z-0" />

      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-app-modal border border-app rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl border border-emerald-500/30 bg-slate-950/90 mb-3 shadow-lg overflow-hidden transition-transform hover:scale-105">
            <img src="/icona.svg" alt="stonks logo" className="w-full h-full object-contain p-1.5" />
          </div>

          <h1 className="font-mono-code text-xl font-black tracking-widest uppercase flex items-center gap-2 text-app-main">
            <span>stonks</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-muted font-normal lowercase tracking-normal">
              0ms • v2.6
            </span>
          </h1>
          <p className="text-xs text-app-muted font-mono-code mt-1">
            FinTech Minimal • Gestione Spese & Entrate
          </p>
        </div>

        {/* Segmented Control: Accedi / Registrati (When not in forgot password mode) */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 gap-1 p-1 bg-app-subtle border border-app rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2.5 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer font-bold ${
                mode === 'login'
                  ? 'bg-app-card text-app-main shadow-sm border border-app'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2.5 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer font-bold ${
                mode === 'register'
                  ? 'bg-app-card text-app-main shadow-sm border border-app'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              Registrati
            </button>
          </div>
        ) : (
          /* Header when in Forgot Password Mode */
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-9 h-9 rounded-xl bg-app-subtle border border-app hover:bg-app-hover flex items-center justify-center text-app-muted hover:text-app-main transition-colors cursor-pointer shrink-0"
              title="Torna al login"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-mono-code font-bold text-app-main">Recupera Password</h2>
              <p className="text-[11px] font-mono-code text-app-muted">
                Ti invieremo un link per reimpostarla
              </p>
            </div>
          </div>
        )}

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

        {/* Form: Forgot Password */}
        {mode === 'forgot' ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1.5">
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
                  className="w-full bg-app-input border border-app rounded-2xl pl-10 pr-4 py-3 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Invio in corso...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Invia link di recupero</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2 text-center text-xs font-mono-code text-app-muted hover:text-app-main flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ricordi la password? Accedi</span>
            </button>
          </form>
        ) : (
          /* Form: Login or Register */
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'register' && (
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
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
                Password
              </label>
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

              {/* Explicit, clean Password Dimenticata link right below password */}
              {mode === 'login' && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-mono-code text-app-muted hover:text-amber-400 font-medium flex items-center gap-1 transition-colors cursor-pointer"
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
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="animate-pulse">Accesso in corso...</span>
              ) : mode === 'register' ? (
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
        {mode !== 'forgot' && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-app-subtle" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono-code">
                <span className="bg-app-modal px-2 text-app-muted">oppure</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl border border-app bg-app-card hover:bg-app-hover text-app-main font-mono-code text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.98]"
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
              <span>Continua con Google</span>
            </button>
          </>
        )}

        {/* Clean, minimalist security badge */}
        <div className="mt-6 pt-4 border-t border-app-subtle flex items-center justify-center gap-1.5 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-mono-code text-app-muted">
            Crittografia sicura • Sincronizzazione automatica
          </span>
        </div>
      </div>
    </div>
  );
};
