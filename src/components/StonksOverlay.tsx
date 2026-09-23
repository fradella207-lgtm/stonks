/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, X, Sparkles } from 'lucide-react';
import { onStonksTriggered, StonksEventData } from '../services/stonksEffect.ts';

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const StonksOverlay: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<StonksEventData | null>(null);

  useEffect(() => {
    const unsubscribe = onStonksTriggered((event) => {
      setActiveEvent(event);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeEvent) return;

    const timer = setTimeout(() => {
      setActiveEvent(null);
    }, 2400);

    return () => clearTimeout(timer);
  }, [activeEvent]);

  if (!activeEvent) return null;

  const isStonks = activeEvent.type === 'stonks';
  const memeImg = isStonks ? '/stonks.jpg' : '/not-stonks.jpg';
  const title = isStonks ? 'STONKS ↗' : 'NOT STONKS ↘';
  const themeColor = isStonks ? 'emerald' : 'red';

  return (
    <AnimatePresence>
      <div
        onClick={() => setActiveEvent(null)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden border p-5 text-center flex flex-col items-center bg-[#0d0d12] shadow-2xl ${
            isStonks
              ? 'border-emerald-500/50 shadow-[0_0_70px_rgba(16,185,129,0.35)]'
              : 'border-red-500/50 shadow-[0_0_70px_rgba(239,68,68,0.35)]'
          }`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveEvent(null)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Badge */}
          <div className="flex items-center gap-1.5 mb-3">
            {isStonks ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono-code font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Profitto Registrato</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono-code font-bold text-xs uppercase tracking-wider">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Spesa Registrata</span>
              </span>
            )}
          </div>

          {/* Meme Image with Glowing Frame */}
          <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden mb-3.5 border border-white/10 bg-black/60 flex items-center justify-center">
            <img
              src={memeImg}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                // Fallback icon placeholder if image fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div
              className={`absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent`}
            />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white font-mono-code">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                {isStonks ? 'Bullish Move' : 'Bearish Outflow'}
              </span>
              <span
                className={`text-xs font-black tracking-wider ${
                  isStonks ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isStonks ? '+↗' : '-↘'}
              </span>
            </div>
          </div>

          {/* Iconic Title */}
          <h3
            className={`font-mono-code text-2xl font-black tracking-widest uppercase mb-1 ${
              isStonks ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {title}
          </h3>

          {/* Amount Display */}
          {typeof activeEvent.amount === 'number' && (
            <div
              className={`font-mono-code text-xl font-bold tracking-tight mb-1 ${
                isStonks ? 'text-emerald-300' : 'text-red-400'
              }`}
            >
              {isStonks ? '+' : '-'} {formatCurrency(activeEvent.amount)}
            </div>
          )}

          {/* Description */}
          {activeEvent.description && (
            <p className="font-mono-code text-xs text-zinc-400 max-w-[240px] truncate">
              {activeEvent.description}
            </p>
          )}

          {/* Auto-Dismiss Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 2.3, ease: 'linear' }}
              className={`h-full ${isStonks ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
