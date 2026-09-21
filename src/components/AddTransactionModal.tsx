/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Tag,
  MapPin,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  transactionToEdit?: Transaction | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    category?: string;
    location?: string;
    receiptImage?: string;
  }) => void;
  onDelete?: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  'Spesa',
  'Ristorante',
  'Trasporti',
  'Casa',
  'Bollette',
  'Svago',
  'Salute',
  'Shopping',
  'Altro',
];

const INCOME_CATEGORIES = [
  'Stipendio',
  'Bonifico',
  'Investimenti',
  'Rimborso',
  'Vendita',
  'Bonus',
  'Altro',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  transactionToEdit = null,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const todayIso = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayIso);
  const [location, setLocation] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync fields when opening or editing
  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setAmountStr(String(transactionToEdit.amount));
        setDescription(transactionToEdit.description);
        setDate(transactionToEdit.date);
        setCategory(transactionToEdit.category || '');
        setLocation(transactionToEdit.location || '');
        setReceiptImage(transactionToEdit.receiptImage || '');
      } else {
        setType(initialType);
        setAmountStr('');
        setDescription('');
        setDate(todayIso);
        setCategory(initialType === 'expense' ? 'Spesa' : 'Stipendio');
        setLocation('');
        setReceiptImage('');
      }
    }
  }, [isOpen, initialType, transactionToEdit]);

  if (!isOpen) return null;

  const isEditing = !!transactionToEdit;
  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    onSave({
      id: transactionToEdit?.id,
      type,
      amount: cleanAmount,
      description: description.trim() || (type === 'expense' ? 'Uscita' : 'Entrata'),
      date: date || todayIso,
      category: category.trim() || 'Altro',
      location: location.trim() || undefined,
      receiptImage: receiptImage || undefined,
    });

    onClose();
  };

  const handleQuickAdd = (val: number) => {
    const curr = parseFloat(amountStr.replace(',', '.')) || 0;
    const nextVal = (curr + val).toFixed(2);
    setAmountStr(nextVal.endsWith('.00') ? String(parseInt(nextVal, 10)) : nextVal);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Immagine troppo grande. Scegli uno scontrino inferiore a 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isIncome = type === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-app-modal border border-app rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-app-main">
        {/* Mobile Drag Indicator */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-app-muted/40" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-app-subtle">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isIncome
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)]'
              }`}
            />
            <h2 className="text-xs font-mono-code font-bold uppercase tracking-widest text-app-main">
              {isEditing ? 'MODIFICA MOVIMENTO // STONKS' : 'REGISTRA MOVIMENTO // STONKS'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
          {/* Type Switcher: Entrata vs Uscita */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-app-subtle rounded-2xl border border-app">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (!isEditing) setCategory('Spesa');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
                !isIncome
                  ? 'bg-red-600 text-white font-bold shadow-md'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>USCITA (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                if (!isEditing) setCategory('Stipendio');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono-code transition-all cursor-pointer ${
                isIncome
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'text-app-muted hover:text-app-main'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>ENTRATA (+)</span>
            </button>
          </div>

          {/* Amount Input with Currency Symbol */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
              Importo
            </label>
            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-code font-bold ${
                  isIncome ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                €
              </span>
              <input
                id="input-amount"
                type="text"
                inputMode="decimal"
                required
                autoFocus={!isEditing}
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (/^\d*\.?\d*$/.test(val)) {
                    setAmountStr(val);
                  }
                }}
                className="w-full bg-app-input border border-app rounded-2xl pl-12 pr-4 py-3 text-3xl font-mono-code font-bold text-app-main placeholder:text-app-muted/40 outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Quick Amount Add Pills */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {[5, 10, 20, 50, 100].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1 rounded-xl bg-app-subtle hover:bg-app-hover border border-app text-app-sub hover:text-app-main text-[11px] font-mono-code transition-all cursor-pointer shrink-0"
                >
                  +{val}€
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
              Descrizione
            </label>
            <input
              type="text"
              required
              placeholder={isIncome ? 'es. Stipendio, Rimborso spese...' : 'es. Spesa supermercato, Pranzo bar...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-app-input border border-app rounded-2xl px-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Category Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <Tag className="w-3 h-3 text-app-muted" />
                <span>Categoria</span>
              </label>
              <span className="text-[9px] font-mono-code text-app-muted">
                {category || 'Nessuna'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentCategories.map((cat) => {
                const isSelected = category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono-code transition-all cursor-pointer ${
                      isSelected
                        ? isIncome
                          ? 'bg-emerald-600 text-white font-bold border border-emerald-500 shadow-sm'
                          : 'bg-red-600 text-white font-bold border border-red-500 shadow-sm'
                        : 'bg-app-subtle text-app-sub hover:text-app-main border border-app'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Location in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <Calendar className="w-3 h-3 text-app-muted" />
                <span>Data</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-app-input border border-app rounded-2xl px-3 py-2 text-xs font-mono-code text-app-main outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Optional Location */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-app-muted" />
                <span>Luogo (Opzionale)</span>
              </label>
              <input
                type="text"
                placeholder="es. Milano, Esselunga"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-app-input border border-app rounded-2xl px-3 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Scontrino Attachment Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-app-muted" />
                <span>Scontrino / Ricevuta (Opzionale)</span>
              </label>
              {receiptImage && (
                <button
                  type="button"
                  onClick={() => setReceiptImage('')}
                  className="text-[10px] font-mono-code text-red-500 hover:underline cursor-pointer"
                >
                  Rimuovi foto
                </button>
              )}
            </div>

            {receiptImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-app bg-black/40 h-28 flex items-center justify-center">
                <img
                  src={receiptImage}
                  alt="Anteprima scontrino"
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-app bg-app-subtle/50 hover:bg-app-hover text-app-sub text-xs font-mono-code flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-app-muted" />
                  <span>Carica o scatta foto dello scontrino</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              className={`w-full py-3.5 rounded-2xl text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Salva Modifiche' : 'Registra Movimento'}</span>
            </button>

            {/* If editing, allow deleting from here as well */}
            {isEditing && onDelete && transactionToEdit && (
              <div className="pt-1">
                {confirmDelete ? (
                  <div className="p-2.5 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono-code text-red-400">
                      Eliminare questo movimento?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(transactionToEdit.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono-code text-[10px] font-bold"
                      >
                        Sì, Elimina
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 rounded-lg bg-app-card border border-app text-app-muted text-[10px]"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2 rounded-xl text-app-muted hover:text-red-500 hover:bg-red-950/20 font-mono-code text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Elimina Questo Movimento</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
