import React, { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS, INITIAL_BASELINE_BALANCE } from './mock/mockTransactions';
import { calculateFinanceSummary, formatSGD } from './utils/financeCalculator';
import { Transaction, CategoryKey, CategoryConfig } from './types/finance';
import { DEFAULT_CATEGORY_CONFIGS, ensureUniqueCategoryColors } from './config/categoryConfig';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RunwaySection } from './components/RunwaySection';
import { CategoryLegend } from './components/CategoryLegend';
import { CashflowChart } from './components/CashflowChart';
import { CSVImportZone } from './components/CSVImportZone';
import { TransactionLedger } from './components/TransactionLedger';
import { QuickAddOutflows } from './components/QuickAddOutflows';
import { PredictiveRunwayWidget } from './components/PredictiveRunwayWidget';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY_CONFIGS = 'lumina_category_configs';
const STORAGE_KEY_BALANCE = 'lumina_initial_balance';
const STORAGE_KEY_TXS = 'lumina_transactions';

export const App: React.FC = () => {
  // 1. Transactions state with local persistence and current-date synchronization
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TXS);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        const todayStr = new Date().toISOString().split('T')[0];
        const hasFutureDates = parsed.some((t) => t.date > todayStr);
        if (hasFutureDates) {
          return MOCK_TRANSACTIONS;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load transactions from localStorage', e);
    }
    return MOCK_TRANSACTIONS;
  });

  // 2. Initial baseline balance with local persistence
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BALANCE);
      if (saved) return Number(saved);
    } catch (e) {
      console.error('Failed to load initial balance', e);
    }
    return INITIAL_BASELINE_BALANCE;
  });

  // 3. Category configurations with local persistence
  const [categoryConfigs, setCategoryConfigs] = useState<Record<CategoryKey, CategoryConfig>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return ensureUniqueCategoryColors(parsed);
      }
    } catch (e) {
      console.error('Failed to load category configs', e);
    }
    return DEFAULT_CATEGORY_CONFIGS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Subtle visual feedback toast notification state
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'savings';
    category: string;
  } | null>(null);

  const showToast = (title: string, amount: number, type: 'income' | 'expense' | 'savings', category: string) => {
    setToast({ id: `${Date.now()}`, title, amount, type, category });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions));
    } catch (e) {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BALANCE, initialBalance.toString());
    } catch (e) {}
  }, [initialBalance]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(categoryConfigs));
    } catch (e) {}
  }, [categoryConfigs]);

  // Compute live financial summary using dynamic baseline & category configs
  const summary = calculateFinanceSummary(transactions, initialBalance, categoryConfigs);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions((prev) => [tx, ...prev]);
    showToast(tx.title, tx.amount, tx.type, String(tx.category));
  };

  const handleImportTransactions = (importedTxs: Transaction[]) => {
    setTransactions((prev) => [...importedTxs, ...prev]);
    const totalAmt = importedTxs.reduce((s, t) => s + t.amount, 0);
    showToast(`Imported ${importedTxs.length} Transactions`, totalAmt, 'income', 'e-Statement Batch');
  };

  const handleQuickAdd = (title: string, amount: number, category: CategoryKey) => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      title,
      amount,
      type: 'expense',
      category,
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      note: '1-Click Quick Add',
      source: 'Quick Outflow'
    };
    setTransactions((prev) => [tx, ...prev]);
    showToast(title, amount, 'expense', String(category));
  };

  const handleScrollToImport = () => {
    const importEl = document.getElementById('import-section');
    if (importEl) {
      importEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetDefaults = () => {
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
    setInitialBalance(INITIAL_BASELINE_BALANCE);
    setTransactions(MOCK_TRANSACTIONS);
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIGS);
      localStorage.removeItem(STORAGE_KEY_BALANCE);
      localStorage.removeItem(STORAGE_KEY_TXS);
    } catch (e) {}
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        totalBalance={summary.totalBalance}
        overallRunwayMonths={summary.overallRunwayMonths}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header />

        {/* Workspace Content */}
        <main className="workspace-content">
          {/* 1. Hero Section: Total Bank Balance & KPIs */}
          <HeroSection
            totalBalance={summary.totalBalance}
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onScrollToImport={handleScrollToImport}
          />

          {/* 2. Inline Category Color Key */}
          <CategoryLegend
            categoryConfigs={categoryConfigs}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* 3. Cash In / Out Flow Analysis Chart */}
          <CashflowChart
            transactions={transactions}
            categoryConfigs={categoryConfigs}
          />

          {/* 4. 2-Column Responsive Layout for Ledger, CSV, and Widgets */}
          <div className="dashboard-grid">
            {/* Left 8-Column Area: Transaction Ledger, File Import Engine */}
            <div className="col-span-8">
              {/* Transaction Activity Ledger */}
              <TransactionLedger
                transactions={transactions}
                categoryConfigs={categoryConfigs}
              />

              {/* Universal Bank Statement & Ledger Import Zone */}
              <CSVImportZone
                onImportTransactions={handleImportTransactions}
                existingTransactions={transactions}
              />
            </div>

            {/* Right 4-Column Area: Quick Add Outflows, Predictive Runway */}
            <div className="col-span-4">
              {/* Quick Add Frequent Outflows */}
              <QuickAddOutflows
                onQuickAdd={handleQuickAdd}
                categoryConfigs={categoryConfigs}
              />

              {/* Predictive Runway Simulation Widget */}
              <PredictiveRunwayWidget
                overallMonthlyBurn={summary.overallMonthlyBurn}
                totalBalance={summary.totalBalance}
                overallRunwayMonths={summary.overallRunwayMonths}
                categoryRunways={summary.categoryRunways}
              />
            </div>
          </div>

          {/* 5. Runway & Longevity Projection Matrix */}
          <RunwaySection
            totalBalance={summary.totalBalance}
            overallRunwayMonths={summary.overallRunwayMonths}
            overallMonthlyBurn={summary.overallMonthlyBurn}
            categoryRunways={summary.categoryRunways}
          />
        </main>
      </div>

      {/* Record Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        categoryConfigs={categoryConfigs}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        categoryConfigs={categoryConfigs}
        onSaveCategoryConfigs={setCategoryConfigs}
        initialBalance={initialBalance}
        onSaveInitialBalance={setInitialBalance}
        onResetDefaults={handleResetDefaults}
      />

      {/* Subtle Visual Feedback Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
            border: '1px solid var(--border-subtle)',
            animation: 'toastSlideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: toast.type === 'income' ? '#d1fae5' : '#fee2e2',
              color: toast.type === 'income' ? '#047857' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {toast.type === 'income' ? 'arrow_downward' : 'check'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              {toast.title}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Logged to <strong>{toast.category}</strong>
            </span>
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: toast.type === 'income' ? '#10b981' : '#ef4444',
              marginLeft: '8px'
            }}
          >
            {toast.type === 'income' ? '+' : '-'}{formatSGD(toast.amount)}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
