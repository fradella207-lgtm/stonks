/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Calendar, Tag, PlusCircle } from 'lucide-react';
import { TransactionType } from '../types.ts';

interface AddTransactionTabProps {
  onAdd: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
  }) => void;
  selectedMonth: string;
}

const QUICK_TAGS = [
  'Spesa',
  'Stipendio',
  'Ristorante',
  'Affitto',
  'Bollette',
  'Trasporti',
  'Svago',
  'Salute',
  'Bonus',
];

export const AddTransactionTab: React.FC<AddTransactionTabProps> = ({ onAdd, selectedMonth }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Default to today's date
  const todayIso = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayIso);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return;
    }

    onAdd({
      type,
      amount: cleanAmount,
      description: description.trim(),
      date: date || todayIso,
    });

    // Reset input
    setAmountStr('');
    setDescription('');
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
    }, 2200);
  };

  const appendDigit = (val: string) => {
    if (val === '.' && amountStr.includes('.')) return;
    if (val === ',' && (amountStr.includes(',') || amountStr.includes('.'))) return;
    setAmountStr((prev) => prev + val);
  };

  const quickAddAmount = (addVal: number) => {
    const current = parseFloat(amountStr.replace(',', '.')) || 0;
    const nextVal = (current + addVal).toFixed(2);
    setAmountStr(nextVal.endsWith('.00') ? String(parseInt(nextVal, 10)) : nextVal);
  };

  return (
    <div id="tab-insert" className="w-full max-w-xl mx-auto px-4 pb-24 pt-2">
      {/* Toast Notification (0ms instant save confirmation) */}
      {feedbackSuccess && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono-code flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Registrato con successo! (0ms in locale, invio in coda)</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-700/50">
            OK
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Switch rapido tra Entrata e Uscita (Stile Nothing OS) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl">
          <button
            type="button"
            id="switch-expense"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono-code text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              type === 'expense'
                ? 'bg-zinc-900 text-red-500 border border-red-600/40 shadow-sm font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <span>Uscita</span>
          </button>

          <button
            type="button"
            id="switch-income"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono-code text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              type === 'income'
                ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Entrata</span>
          </button>
        </div>

        {/* Campo Importo in stile FinTech con font di grandi dimensioni */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 text-center overflow-hidden">
          <div className="absolute top-2 left-3 text-[10px] font-mono-code uppercase tracking-widest text-zinc-500">
            IMPORTO // {type === 'expense' ? 'USCITA' : 'ENTRATA'}
          </div>

          <div className="mt-4 flex items-center justify-center gap-1">
            <span
              className={`font-mono-code text-3xl font-light ${
                type === 'expense' ? 'text-red-500' : 'text-emerald-400'
              }`}
            >
              €
            </span>
            <input
              id="input-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => {
                // Allow only numbers and dots/commas
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setAmountStr(val);
              }}
              required
              autoFocus
              className={`w-full max-w-[280px] bg-transparent text-center font-mono-code text-4xl sm:text-5xl font-bold tracking-tight outline-none placeholder:text-zinc-800 transition-colors ${
                type === 'expense' ? 'text-red-500' : 'text-emerald-400'
              }`}
            />
          </div>

          {/* Quick Amount Add Pills */}
          <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
            {[5, 10, 20, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => quickAddAmount(val)}
                className="px-2.5 py-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800 text-[11px] font-mono-code text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all"
              >
                +{val}€
              </button>
            ))}
            {amountStr && (
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] font-mono-code text-zinc-500 hover:text-zinc-300"
              >
                Cancella
              </button>
            )}
          </div>
        </div>

        {/* Descrizione & Quick Tags */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="input-description"
              className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>Descrizione</span>
            </label>
            <span className="text-[10px] text-zinc-600 font-mono-code">Facoltativo</span>
          </div>

          <input
            id="input-description"
            type="text"
            placeholder="es. Spesa settimanale, Cena, Stipendio..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
          />

          {/* Quick suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setDescription(tag)}
                className={`text-[11px] font-mono-code px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                  description === tag
                    ? 'bg-zinc-100 text-black border-zinc-100 font-medium'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Selettore Data (default odierna) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono-code uppercase tracking-wider text-zinc-400">
                Data Operazione
              </div>
              <div className="text-xs text-zinc-500">
                {date === todayIso ? 'Oggi' : date}
              </div>
            </div>
          </div>

          <input
            id="input-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono-code text-zinc-200 outline-none focus:border-zinc-600"
          />
        </div>

        {/* Pulsante di Registrazione ad Azione Immediata */}
        <button
          type="submit"
          id="btn-submit-transaction"
          disabled={!amountStr || parseFloat(amountStr.replace(',', '.')) <= 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-mono-code text-sm font-semibold tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] ${
            !amountStr || parseFloat(amountStr.replace(',', '.')) <= 0
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : type === 'expense'
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-950/40 border border-red-500'
              : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-950/40 border border-emerald-400'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registra {type === 'expense' ? 'Uscita' : 'Entrata'}</span>
        </button>
      </form>
    </div>
  );
};
