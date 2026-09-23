/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, PieChart } from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';
import { DailyActivityCard } from './DailyActivityCard.tsx';
import { FinancialTelematicsCard } from './FinancialTelematicsCard.tsx';

interface HistoryTabProps {
  transactions: Transaction[];
  monthlyBudget: number;
  onUpdateMonthlyBudget: (amount: number) => void;
  onOpenAdd: (type?: TransactionType) => void;
  onNavigateReports?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  transactions,
  monthlyBudget,
  onUpdateMonthlyBudget,
  onOpenAdd,
  onNavigateReports,
}) => {
  return (
    <div id="tab-history" className="w-full space-y-4">
      {/* 1. Instant Financial Cockpit (Status, Live Balance, Centered +/- Action Buttons, Monthly Budget) */}
      <FinancialTelematicsCard
        transactions={transactions}
        monthlyBudget={monthlyBudget}
        onUpdateMonthlyBudget={onUpdateMonthlyBudget}
        onOpenAdd={onOpenAdd}
        onNavigateReports={onNavigateReports}
      />

      {/* 2. Daily Activity Trends Chart */}
      <DailyActivityCard transactions={transactions} />

      {/* 3. Sleek Quick Link to Reports for Full Itemized Ledger */}
      {onNavigateReports && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-1"
        >
          <button
            type="button"
            onClick={onNavigateReports}
            className="w-full p-4 rounded-3xl bg-app-card hover:bg-app-subtle border border-app transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-app-subtle border border-app flex items-center justify-center text-app-muted group-hover:text-red-500 group-hover:border-red-500/30 transition-colors">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-mono-code font-bold uppercase tracking-wider text-app-main group-hover:text-red-500 transition-colors">
                  View Full Transaction Ledger
                </div>
                <div className="text-[11px] font-mono-code text-app-muted mt-0.5">
                  Filter by month, category, search items, edit & delete in Reports
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-app-subtle flex items-center justify-center text-app-muted group-hover:text-app-main group-hover:translate-x-1 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};
