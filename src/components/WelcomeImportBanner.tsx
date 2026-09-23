/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UploadCloud, X, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeImportBannerProps {
  onOpenImport: () => void;
  onDismiss: () => void;
}

export const WelcomeImportBanner: React.FC<WelcomeImportBannerProps> = ({
  onOpenImport,
  onDismiss,
}) => {
  return (
    <div
      id="banner-welcome-import"
      className="relative overflow-hidden rounded-3xl border border-red-500/40 bg-app-card p-4 sm:p-5 shadow-xl transition-all"
    >
      {/* Background cyber accent glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-red-600/10 blur-[50px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-[50px] pointer-events-none" />

      {/* Top Header Row with status badge and dismiss button */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono-code text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>New Account Connected • Workspace Ready</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss banner"
          className="w-6 h-6 rounded-full bg-app-subtle hover:bg-app-hover border border-app text-app-muted hover:text-app-main flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-1.5 mb-3.5">
        <h3 className="font-mono-code text-sm sm:text-base font-bold text-app-main tracking-tight">
          Want to import your previous expenses?
        </h3>
        <p className="text-xs text-app-muted leading-relaxed font-mono-code">
          Your account is currently clean. If you previously tracked expenses in Excel, CSV, JSON, or{' '}
          <strong>Google Sheets</strong>, you can import them right away to see all your finances here!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onOpenImport}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono-code text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Previous File</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="py-2.5 px-4 rounded-2xl bg-app-subtle hover:bg-app-hover border border-app text-app-muted hover:text-app-main font-mono-code text-xs font-medium transition-colors cursor-pointer text-center"
        >
          Start from scratch
        </button>
      </div>
    </div>
  );
};
