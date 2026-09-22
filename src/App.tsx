/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { HistoryTab } from './components/HistoryTab.tsx';
import { ReportsTab } from './components/ReportsTab.tsx';
import { BottomTabBar } from './components/BottomTabBar.tsx';
import { AddTransactionModal } from './components/AddTransactionModal.tsx';
import { DataTransferModal } from './components/DataTransferModal.tsx';
import { UnifiedMenuModal } from './components/UnifiedMenuModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { WelcomeImportBanner } from './components/WelcomeImportBanner.tsx';
import {
  AppSyncState,
  ThemeMode,
  TimeFilterPeriod,
  Transaction,
  TransactionType,
  UserProfile,
} from './types.ts';
import {
  addTransactionLocal,
  deleteTransactionLocal,
  updateTransactionLocal,
  extractMonth,
  getStoredTheme,
  getStoredTransactions,
  saveStoredTheme,
  saveTransactionsList,
} from './services/storage.ts';
import { syncManager } from './services/syncManager.ts';
import { firebaseSyncService } from './services/firebaseSync.ts';
import { triggerStonksIfPositive } from './services/stonksEffect.ts';

export default function App() {
  // Navigation: 'history' (Movimenti) or 'reports' (Report & Analisi)
  const [activeView, setActiveView] = useState<'history' | 'reports'>('history');

  // Filter period in Reports: 'month' | 'year' | 'all' (Settimana removed)
  const [currentPeriod, setCurrentPeriod] = useState<TimeFilterPeriod>('month');

  // Theme: 'dark' | 'black' | 'light'
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(getStoredTheme);

  // Stored transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // User profile state & auth gate (initialized from persistent cache immediately)
  const [user, setUser] = useState<UserProfile | null>(() => firebaseSyncService.getCurrentUser());
  const [authInitialized, setAuthInitialized] = useState<boolean>(() => firebaseSyncService.getIsAuthReady());
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(() => {
    return localStorage.getItem('stonks_new_account_welcome_banner') === 'true';
  });

  // Track current month net balance for Stonks celebration trigger
  const currentMonthStr = useMemo(() => {
    return new Date().toISOString().substring(0, 7);
  }, []);

  const currentMonthNet = useMemo(() => {
    const monthTxs = transactions.filter(
      (t) => t.month === currentMonthStr || (t.date && t.date.startsWith(currentMonthStr))
    );
    const inc = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  }, [transactions, currentMonthStr]);

  const isInitialMountRef = React.useRef<boolean>(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      triggerStonksIfPositive(currentMonthNet, true);
      isInitialMountRef.current = false;
    } else {
      triggerStonksIfPositive(currentMonthNet, false);
    }
  }, [currentMonthNet]);

  // Sync state
  const [syncState, setSyncState] = useState<AppSyncState>('synced');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Modals state
  const [isUnifiedMenuOpen, setIsUnifiedMenuOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalInitialType, setAddModalInitialType] = useState<TransactionType>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isDataTransferModalOpen, setIsDataTransferModalOpen] = useState<boolean>(false);

  // Apply theme class to document body & update theme-color meta
  useEffect(() => {
    document.documentElement.classList.remove(
      'theme-dark',
      'theme-black',
      'theme-light',
      'dark',
      'light'
    );
    document.documentElement.classList.add(`theme-${currentTheme}`);

    if (currentTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        currentTheme === 'light' ? '#f8f9fa' : currentTheme === 'black' ? '#000000' : '#09090b'
      );
    }
  }, [currentTheme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setCurrentTheme(newTheme);
    saveStoredTheme(newTheme);
  };

  // Initial setup: Local storage, Firebase auth/data sync
  useEffect(() => {
    // 1. Instant local read (0ms)
    const local = getStoredTransactions();
    setTransactions(local);

    // 2. Firebase Auth & Sync subscriptions
    const unsubAuth = firebaseSyncService.subscribeAuth((u, isReady) => {
      setUser(u);
      setAuthInitialized(isReady);
      if (localStorage.getItem('stonks_new_account_welcome_banner') === 'true') {
        setShowWelcomeBanner(true);
      }
    });

    const unsubFirebaseSync = firebaseSyncService.subscribeSync((fStatus) => {
      if (fStatus === 'syncing') {
        setSyncState('syncing');
      } else if (fStatus === 'error') {
        setSyncState('error');
      } else {
        // Refresh local cache if remote pushed changes
        const fresh = getStoredTransactions();
        setTransactions(fresh);
      }
    });

    // 3. Queue manager subscriptions
    const unsubQueue = syncManager.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });

    return () => {
      unsubAuth();
      unsubFirebaseSync();
      unsubQueue();
    };
  }, []);

  // Add or Edit transaction
  const handleSaveTransaction = async (data: {
    id?: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    category?: string;
    location?: string;
    receiptImage?: string;
  }) => {
    if (data.id) {
      // Editing existing transaction
      const updatedTx: Transaction = {
        id: data.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        month: extractMonth(data.date),
        category: data.category,
        location: data.location,
        receiptImage: data.receiptImage,
        syncStatus: 'pending',
      };

      updateTransactionLocal(updatedTx);
      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));

      // Sync updated record with Firebase
      firebaseSyncService.saveTransaction(updatedTx).catch(console.warn);
    } else {
      // Adding new transaction (0ms latency)
      const { transaction } = addTransactionLocal({
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        month: extractMonth(data.date),
        category: data.category,
        location: data.location,
        receiptImage: data.receiptImage,
      });

      setTransactions((prev) => [transaction, ...prev]);

      // Background Firestore write
      firebaseSyncService.saveTransaction(transaction).catch(console.warn);
    }

    setTransactionToEdit(null);
  };

  // Open Edit Modal for a specific transaction
  const handleOpenEdit = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setAddModalInitialType(tx.type);
    setIsAddModalOpen(true);
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    deleteTransactionLocal(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Background Firestore delete
    firebaseSyncService.deleteTransaction(id).catch(console.warn);
  };

  // Batch import transactions (CSV, JSON, or Google Sheets)
  const handleBatchImport = async (imported: Transaction[]) => {
    const existing = getStoredTransactions();
    const existingIds = new Set(existing.map((t) => t.id));
    const newItems = imported.filter((item) => !existingIds.has(item.id));

    const combined = [...newItems, ...existing];
    saveTransactionsList(combined);
    setTransactions(combined);

    // Sync imported records to Firestore if logged in
    if (newItems.length > 0 && user) {
      await firebaseSyncService.batchImport(newItems);
    }
  };

  const handleOpenAddModal = (type: TransactionType = 'expense') => {
    setTransactionToEdit(null);
    setAddModalInitialType(type);
    setIsAddModalOpen(true);
  };

  const handleLogin = async () => {
    try {
      await firebaseSyncService.loginWithGoogle();
    } catch (e) {
      console.warn('Login canceled or failed:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSyncService.logout();
      setUser(null);
      localStorage.removeItem('stonks_local_profile_v1');
    } catch (e) {
      console.warn('Logout failed:', e);
    }
  };

  const handleClearAllData = () => {
    saveTransactionsList([]);
    setTransactions([]);
  };

  const handleDismissWelcomeBanner = () => {
    localStorage.removeItem('stonks_new_account_welcome_banner');
    setShowWelcomeBanner(false);
  };

  const handleOpenImportFromBanner = () => {
    handleDismissWelcomeBanner();
    setIsDataTransferModalOpen(true);
  };

  // Show sleek loader while verifying session on startup if user is not in cache
  if (!authInitialized && !user) {
    return (
      <div className="min-h-screen bg-app-canvas flex flex-col items-center justify-center p-6 text-app-main">
        <div className="relative w-16 h-16 mb-4 animate-pulse">
          <img src="/icona.svg" alt="stonks" className="w-full h-full object-contain" />
        </div>
        <div className="font-mono-code text-xs text-app-muted tracking-widest uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Caricamento sessione...</span>
        </div>
      </div>
    );
  }

  // Show Login Screen if no user is signed in
  if (authInitialized && !user) {
    return (
      <LoginScreen
        onSuccess={(newUser) => {
          setUser(newUser);
          if (localStorage.getItem('stonks_new_account_welcome_banner') === 'true') {
            setShowWelcomeBanner(true);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-app-canvas text-app-main flex flex-col justify-between selection:bg-red-600 selection:text-white pb-24 transition-colors">
      {/* Background Subtle Dot Pattern (Nothing OS aesthetic) */}
      <div className="fixed inset-0 bg-dots pointer-events-none opacity-30 z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {/* Clean Header: Contains branding and a single sleek unified button */}
        <Header
          syncState={syncState}
          pendingCount={pendingCount}
          user={user}
          onOpenMenu={() => setIsUnifiedMenuOpen(true)}
        />

        <main className="w-full max-w-xl mx-auto px-4 pt-3.5 space-y-4 flex-1">
          {/* Welcome Import Banner for new accounts or users wishing to migrate old data */}
          {showWelcomeBanner && (
            <WelcomeImportBanner
              onOpenImport={handleOpenImportFromBanner}
              onDismiss={handleDismissWelcomeBanner}
            />
          )}

          {/* Section A: Movimenti / Attività Tab (Includes BMW Cockpit, Live Balance & Quick Dock) */}
          {activeView === 'history' && (
            <HistoryTab
              transactions={transactions}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTransaction}
              onOpenAdd={(type) => handleOpenAddModal(type || 'expense')}
              onNavigateReports={() => setActiveView('reports')}
            />
          )}

          {/* Section B: Reports Tab (Settimana filter removed, view all expenses by month/year with edit) */}
          {activeView === 'reports' && (
            <ReportsTab
              transactions={transactions}
              currentPeriod={currentPeriod}
              onPeriodChange={setCurrentPeriod}
              onEditTransaction={handleOpenEdit}
            />
          )}
        </main>
      </div>

      {/* Section C: Floating Bottom Navigation Bar with Animated '+' Speed Dial */}
      <BottomTabBar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenAdd={handleOpenAddModal}
        pendingCount={pendingCount}
      />

      {/* Modal 1: Add or Edit Transaction (Entrata / Uscita with category, date, location, receipt) */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        initialType={addModalInitialType}
        transactionToEdit={transactionToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Modal 2: Unified Centro Controllo (All settings, accounts, theme, export, sync) */}
      <UnifiedMenuModal
        isOpen={isUnifiedMenuOpen}
        onClose={() => setIsUnifiedMenuOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        syncState={syncState}
        pendingCount={pendingCount}
        onManualSync={() => syncManager.checkNetworkAndSync()}
        user={user}
        onLogin={() => {
          setIsUnifiedMenuOpen(false);
        }}
        onLogout={handleLogout}
        onOpenDataTransfer={() => setIsDataTransferModalOpen(true)}
        onClearData={handleClearAllData}
      />

      {/* Modal 3: Import / Export CSV, JSON Data & Google Sheets */}
      <DataTransferModal
        isOpen={isDataTransferModalOpen}
        onClose={() => setIsDataTransferModalOpen(false)}
        transactions={transactions}
        onImportTransactions={handleBatchImport}
      />
    </div>
  );
}
