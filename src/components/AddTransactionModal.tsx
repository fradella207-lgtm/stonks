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
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';
import { getStoredCustomCategories, saveStoredCustomCategories } from '../services/storage.ts';

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
  const [imageError, setImageError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic custom categories
  const [categoriesMap, setCategoriesMap] = useState<{ expense: string[]; income: string[] }>(() =>
    getStoredCustomCategories()
  );
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Sync fields when opening or editing
  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      setIsAddingCategory(false);
      setNewCategoryInput('');
      const loadedCategories = getStoredCustomCategories();
      setCategoriesMap(loadedCategories);

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
        const defaultList = initialType === 'expense' ? loadedCategories.expense : loadedCategories.income;
        setCategory(defaultList[0] || 'Other');
        setLocation('');
        setReceiptImage('');
      }
    }
  }, [isOpen, initialType, transactionToEdit]);

  if (!isOpen) return null;

  const isEditing = !!transactionToEdit;
  const isIncome = type === 'income';
  const currentCategories = isIncome ? categoriesMap.income : categoriesMap.expense;

  const handleAddNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }

    const targetKey = isIncome ? 'income' : 'expense';
    const exists = currentCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = {
        ...categoriesMap,
        [targetKey]: [...categoriesMap[targetKey], trimmed],
      };
      setCategoriesMap(updated);
      saveStoredCustomCategories(updated);
      setCategory(trimmed);
    } else {
      setCategory(trimmed);
    }

    setNewCategoryInput('');
    setIsAddingCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    onSave({
      id: transactionToEdit?.id,
      type,
      amount: cleanAmount,
      description: description.trim() || (isIncome ? 'Income' : 'Expense'),
      date: date || todayIso,
      category: category.trim() || 'Other',
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
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setImageError('Image too large. Please select a receipt under 2.5MB.');
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
              {isEditing
                ? `EDIT ${isIncome ? 'INCOME' : 'EXPENSE'} // STONKS`
                : `RECORD ${isIncome ? 'INCOME' : 'EXPENSE'} // STONKS`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-app-muted hover:text-app-main hover:bg-app-subtle transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
          {/* Badge Tipo: Shows selected type */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
              isIncome
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                : 'bg-red-950/20 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  isIncome ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[11px] font-mono-code font-bold uppercase tracking-wider">
                  {isIncome ? 'RECORD INCOME' : 'RECORD EXPENSE'}
                </div>
                <div className="text-[9px] text-app-muted font-mono-code">
                  {isIncome ? 'Increases available balance' : 'Deducts from monthly budget'}
                </div>
              </div>
            </div>
            <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-full bg-app-card border border-app">
              {isIncome ? '+ INCOME' : '- EXPENSE'}
            </span>
          </div>

          {/* Amount Input with Currency Symbol */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted block">
              Amount
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
                className={`w-full bg-app-input border border-app rounded-2xl pl-12 pr-4 py-3 text-3xl font-mono-code font-bold text-app-main placeholder:text-app-muted/40 outline-none transition-colors ${
                  isIncome ? 'focus:border-emerald-500' : 'focus:border-red-500'
                }`}
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
              Description
            </label>
            <input
              type="text"
              required
              placeholder={isIncome ? 'e.g. Monthly Salary, Transfer...' : 'e.g. Supermarket, Coffee, Lunch...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full bg-app-input border border-app rounded-2xl px-4 py-2.5 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none transition-colors ${
                isIncome ? 'focus:border-emerald-500' : 'focus:border-red-500'
              }`}
            />
          </div>

          {/* Category Section with Custom Category Creation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <Tag className="w-3 h-3 text-app-muted" />
                <span>Category</span>
              </label>
              <span className="text-[9px] font-mono-code text-app-muted">
                {category || 'None'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
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

              {/* Add Custom Category Inline Button */}
              {isAddingCategory ? (
                <div className="flex items-center gap-1 bg-app-input border border-app rounded-xl px-2 py-0.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New category"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                      }
                    }}
                    className="w-24 text-[11px] font-mono-code bg-transparent outline-none text-app-main placeholder:text-app-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNewCategory()}
                    className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="p-1 text-app-muted hover:text-app-main cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-mono-code border border-dashed border-app hover:border-app-hover bg-app-card hover:bg-app-hover text-app-muted hover:text-app-main transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Date and Location in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <Calendar className="w-3 h-3 text-app-muted" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full bg-app-input border border-app rounded-2xl px-3 py-2 text-xs font-mono-code text-app-main outline-none transition-colors ${
                  isIncome ? 'focus:border-emerald-500' : 'focus:border-red-500'
                }`}
              />
            </div>

            {/* Optional Location */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-app-muted" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rome, Supermarket..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full bg-app-input border border-app rounded-2xl px-3 py-2 text-xs font-mono-code text-app-main placeholder:text-app-muted/50 outline-none transition-colors ${
                  isIncome ? 'focus:border-emerald-500' : 'focus:border-red-500'
                }`}
              />
            </div>
          </div>

          {/* Receipt Attachment Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-code uppercase tracking-wider text-app-muted flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-app-muted" />
                <span>Receipt / Invoice (Optional)</span>
              </label>
              {receiptImage && (
                <button
                  type="button"
                  onClick={() => setReceiptImage('')}
                  className="text-[10px] font-mono-code text-red-500 hover:underline cursor-pointer"
                >
                  Remove photo
                </button>
              )}
            </div>

            {receiptImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-app bg-black/40 h-28 flex items-center justify-center">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
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
                  <span>Upload or take photo of receipt</span>
                </button>
                {imageError && (
                  <p className="text-[11px] font-mono-code text-red-500 mt-1 text-center">
                    {imageError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col gap-2.5">
            <button
              id="btn-submit-transaction"
              type="submit"
              className={`w-full py-3.5 rounded-2xl text-white font-mono-code font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Save Changes' : `Record ${isIncome ? 'Income' : 'Expense'}`}</span>
            </button>

            {/* Robust, Clearly Visible Delete Button with Inline Confirmation */}
            {isEditing && onDelete && transactionToEdit && (
              <div className="pt-1">
                {confirmDelete ? (
                  <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-[11px] font-mono-code text-red-400 font-medium">
                        Delete this transaction permanently?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(transactionToEdit.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-code text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-xl bg-app-card border border-app text-app-muted hover:text-app-main font-mono-code text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2.5 rounded-2xl border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 font-mono-code text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Transaction</span>
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
