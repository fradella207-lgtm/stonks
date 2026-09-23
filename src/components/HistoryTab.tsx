/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction } from '../types.ts';
import { DailyActivityCard } from './DailyActivityCard.tsx';
import { FinancialTelematicsCard } from './FinancialTelematicsCard.tsx';

interface HistoryTabProps {
  transactions: Transaction[];
  monthlyBudget: number;
  onUpdateMonthlyBudget: (amount: number) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  transactions,
  monthlyBudget,
  onUpdateMonthlyBudget,
}) => {
  return (
    <div id="tab-history" className="w-full space-y-4">
      {/* 1. Instant Financial Cockpit (Status, Live Balance, Adaptive Budget Intelligence) */}
      <FinancialTelematicsCard
        transactions={transactions}
        monthlyBudget={monthlyBudget}
        onUpdateMonthlyBudget={onUpdateMonthlyBudget}
      />

      {/* 2. Daily Activity Trends Chart */}
      <DailyActivityCard transactions={transactions} />
    </div>
  );
};
