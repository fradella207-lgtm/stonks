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
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { firebaseSyncService } from '../services/firebaseSync.ts';
import { UserProfile } from '../types.ts';

interface LoginScreenProps {
  onSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onContinueAsGuest,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear errors when toggling modes
  const handleToggleMode = () => {
    setIsRegisterMode((prev) => !prev);
    setErrorMsg('');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegisterMode) {
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
      // Friendly localized error messages
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('Questa email è già registrata. Effettua il login invece di registrarti.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Email o password errati. Riprova.');
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

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const profile = await firebaseSyncService.loginWithGoogle();
      onSuccess(profile);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Accesso con Google non riuscito o annullato.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-canvas flex items-center justify-center p-4 relative overflow-hidden text-app-main">
      {/* Background Dots */}
      <div className="fixed inset-0 bg-dots pointer-events-none opacity-30 z-0" />

      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-app-modal border border-app rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-app bg-app-card font-mono-code text-sm font-bold tracking-tighter mb-3 shadow-sm">
            <span className="text-app-main uppercase text-lg">S</span>
            {/* Signature red dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          </div>

          <h1 className="font-mono-code text-xl font-bold tracking-tight uppercase flex items-center gap-2 text-app-main">
            <span>stonks</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-subtle border border-app text-app-muted font-normal lowercase">
              v2.0
            </span>
          </h1>
          <p className="text-xs text-app-muted font-mono-code mt-1">
            FinTech Minimal • Gestione Spese & Entrate
          </p>
        </div>

        {/* Tab Toggle: Accedi vs Registrati */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-app-subtle border border-app rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              if (isRegisterMode) handleToggleMode();
            }}
            className={`py-2 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
              !isRegisterMode
                ? 'bg-app-card text-app-main font-bold shadow-sm border border-app'
                : 'text-app-muted hover:text-app-main'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isRegisterMode) handleToggleMode();
            }}
            className={`py-2 text-center rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
              isRegisterMode
                ? 'bg-app-card text-app-main font-bold shadow-sm border border-app'
                : 'text-app-muted hover:text-app-main'
            }`}
          >
            Crea Account
          </button>
        </div>

        {/* Error notification alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-400 text-xs font-mono-code flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {isRegisterMode && (
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-pulse">Operazione in corso...</span>
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Registrati a Stonks</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Accedi</span>
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-subtle" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono-code">
            <span className="bg-app-modal px-2 text-app-muted">oppure</span>
          </div>
        </div>

        {/* Quick Google Sign In */}
        <div className="space-y-2.5">
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

          {/* Continue Offline/Guest */}
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-2 text-center text-[11px] font-mono-code text-app-muted hover:text-app-main transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Usa in modalità locale (senza account)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Security / No Duplication badge */}
        <div className="mt-5 pt-3 border-t border-app-subtle flex items-center justify-center gap-2 text-[10px] font-mono-code text-app-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verifica duplicazione email attiva • Dati protetti</span>
        </div>
      </div>
    </div>
  );
};
