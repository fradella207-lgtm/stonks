/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { AppSyncState, UserProfile } from '../types.ts';

interface HeaderProps {
  syncState: AppSyncState;
  pendingCount: number;
  user: UserProfile | null;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncState,
  pendingCount,
  user,
  onOpenMenu,
}) => {
  // Dot status indicator
  const getDotStatus = () => {
    if (syncState === 'syncing') {
      return 'bg-amber-400 animate-ping';
    }
    if (syncState === 'offline' || syncState === 'error') {
      return 'bg-rose-500';
    }
    return user ? 'bg-emerald-400' : 'bg-zinc-400';
  };

  const dotClass = getDotStatus();

  return (
    <header className="sticky top-0 z-30 w-full bg-app-header backdrop-blur-md border-b border-app pt-safe pb-2.5 px-4 transition-colors">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {/* Brand with Nothing OS minimalist glyph styling */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950/80 shadow-md">
            <img src="/icona.svg" alt="stonks logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono-code text-xs tracking-widest text-app-main uppercase font-bold">
                stonks
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-app-subtle text-app-muted font-mono-code border border-app-subtle">
                0ms
              </span>
            </div>
            <div className="text-[9px] text-app-muted font-mono-code flex items-center gap-1">
              {user ? (
                <span className="text-app-sub truncate max-w-[130px]">
                  {user.displayName || user.email}
                </span>
              ) : (
                <span>Locale • Offline-First</span>
              )}
            </div>
          </div>
        </div>

        {/* Single Unified Action Button: Opens all functions, settings, backup, sync & export */}
        <button
          id="btn-unified-menu"
          onClick={onOpenMenu}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-app bg-app-card hover:bg-app-hover text-app-main font-mono-code text-xs transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          title="Impostazioni, Account, Temi, Backup ed Esportazione"
        >
          {syncState === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : (
            <div className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${dotClass.replace(
                  ' animate-ping',
                  ''
                )}`}
              />
            </div>
          )}
          <span className="text-[11px] font-bold tracking-wider uppercase">Menu</span>
          <SlidersHorizontal className="w-3.5 h-3.5 text-app-muted" />
        </button>
      </div>
    </header>
  );
};
