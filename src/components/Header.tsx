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
    <header className="sticky top-0 z-30 w-full bg-app-header backdrop-blur-xl border-b border-app pt-safe px-4 sm:px-6 transition-colors shadow-xs">
      <div className="flex items-center justify-between max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full min-h-[68px] sm:min-h-[72px] py-2">
        {/* Brand with Nothing OS minimalist glyph styling */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950/90 shadow-md transition-transform hover:scale-105 shrink-0">
            <img src="/icona.svg" alt="stonks logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-base sm:text-lg tracking-widest text-app-main uppercase font-black">
                stonks
              </span>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-app-subtle text-app-muted font-mono-code border border-app-subtle font-medium">
                0ms • v2.6
              </span>
            </div>
            <div className="text-[11px] text-app-muted font-mono-code flex items-center gap-1.5 mt-0.5">
              {user ? (
                <span className="text-app-sub truncate max-w-[170px] font-medium">
                  {user.displayName || user.email}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-app-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Local • Offline-First
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Single Unified Action Button: Opens all functions, settings, backup, sync & export */}
        <button
          id="btn-unified-menu"
          onClick={onOpenMenu}
          className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full border border-app bg-app-card hover:bg-app-hover text-app-main font-mono-code text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          title="Settings, Account, Themes, Backup & Export"
        >
          {syncState === 'syncing' ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <div className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotClass.replace(
                  ' animate-ping',
                  ''
                )}`}
              />
            </div>
          )}
          <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Menu</span>
          <SlidersHorizontal className="w-4 h-4 text-app-muted" />
        </button>
      </div>
    </header>
  );
};
