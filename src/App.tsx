import React, { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS, INITIAL_BASELINE_BALANCE } from './mock/mockTransactions';
import { calculateFinanceSummary, formatSGD } from './utils/financeCalculator';
import { Transaction, CategoryKey, CategoryConfig } from './types/finance';
import { DEFAULT_CATEGORY_CONFIGS, ensureUniqueCategoryColors, detectCategoryFromTitle } from './config/categoryConfig';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RunwaySection } from './components/RunwaySection';
import { CategoryLegend } from './components/CategoryLegend';
import { CashflowChart } from './components/CashflowChart';
import { CategoryExpenditureDonut } from './components/CategoryExpenditureDonut';
import { CSVImportZone } from './components/CSVImportZone';
import { TransactionLedger } from './components/TransactionLedger';
import { QuickAddOutflows } from './components/QuickAddOutflows';
import { PredictiveRunwayWidget } from './components/PredictiveRunwayWidget';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getFileHandle, verifyPermission, writeToFile, saveAppData, getAppData } from './utils/fileSystem';
import { exportToMarkdown } from './utils/exportUtils';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';

const ONBOARDING_KEY = 'budgetlens_onboarding_done';
const WELCOME_KEY = 'budgetlens_welcome_done';

const STORAGE_KEY_CONFIGS = 'budgetlens_category_configs';
const STORAGE_KEY_BALANCE = 'budgetlens_initial_balance';
const STORAGE_KEY_TXS = 'budgetlens_transactions';

// Legacy keys for automatic migration
const LEGACY_STORAGE_KEY_CONFIGS = 'lumina_category_configs';
const LEGACY_STORAGE_KEY_BALANCE = 'lumina_initial_balance';
const LEGACY_STORAGE_KEY_TXS = 'lumina_transactions';

const AppContent: React.FC = () => {
  const { formatCurrency, autoDetectCurrency } = useCurrency();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(INITIAL_BASELINE_BALANCE);
  const [categoryConfigs, setCategoryConfigs] = useState<Record<CategoryKey, CategoryConfig>>(DEFAULT_CATEGORY_CONFIGS);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // First-run onboarding & welcome — persisted in localStorage so they only show once
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true'
  );
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  const handleOnboardingComplete = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);

    // 🔑 Always start fresh on first install — wipe any browser-session data
    // so the installed PWA opens at $0 with no transactions.
    try {
      await saveAppData(STORAGE_KEY_TXS, []);
      await saveAppData(STORAGE_KEY_BALANCE, 0);
      await saveAppData(STORAGE_KEY_CONFIGS, DEFAULT_CATEGORY_CONFIGS);
    } catch (e) {
      console.warn('Fresh-start reset failed:', e);
    }
    setTransactions([]);
    setInitialBalance(0);
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);

    // Show welcome only if this is also the first data session
    if (localStorage.getItem(WELCOME_KEY) !== 'true') {
      setShowWelcome(true);
    }
  };

  const handleWelcomeDismiss = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShowWelcome(false);
  };


  // File System state (optional background sync)
  const [rawFileHandle, setRawFileHandle] = useState<FileSystemFileHandle | null>(null);

  // 1. Load from IndexedDB on mount with automatic healing & migration
  useEffect(() => {
    const loadData = async () => {
      try {
        let savedTxs = await getAppData(STORAGE_KEY_TXS);
        if (!savedTxs) {
          savedTxs = await getAppData(LEGACY_STORAGE_KEY_TXS);
        }

        if (savedTxs && savedTxs.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const hasFutureDates = savedTxs.some((t: Transaction) => t.date > todayStr);

          // Auto-heal any transactions if they were corrupted to all General expenses
          const healedTxs = savedTxs.map((t: Transaction) => {
            let category = t.category;
            let type = t.type;
            if (t.title.toLowerCase().includes('salary') || t.title.toLowerCase().includes('freelance') || t.title.toLowerCase().includes('payout')) {
              type = 'income';
              if (category === 'General') category = 'Salary';
            } else if (category === 'General') {
              const detected = detectCategoryFromTitle(t.title);
              if (detected !== 'General') {
                category = detected;
              }
            }
            return { ...t, category, type };
          });

          const onboardingAlreadyDone = localStorage.getItem(ONBOARDING_KEY) === 'true';
          setTransactions(hasFutureDates && !onboardingAlreadyDone ? MOCK_TRANSACTIONS : healedTxs);

        } else {
          // Only load mock data on the very first ever session (before onboarding)
          // Once onboarding is done, always start empty — never inject mock data
          const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === 'true';
          if (!onboardingDone && savedTxs === undefined) {
            setTransactions(MOCK_TRANSACTIONS);
          } else {
            setTransactions([]);
          }
        }

        let savedBal = await getAppData(STORAGE_KEY_BALANCE);
        if (savedBal === undefined || savedBal === null) {
          savedBal = await getAppData(LEGACY_STORAGE_KEY_BALANCE);
        }
        if (savedBal !== undefined && savedBal !== null) {
          setInitialBalance(Number(savedBal));
        }

        let savedConf = await getAppData(STORAGE_KEY_CONFIGS);
        if (!savedConf) {
          savedConf = await getAppData(LEGACY_STORAGE_KEY_CONFIGS);
        }
        if (savedConf) {
          setCategoryConfigs(ensureUniqueCategoryColors(savedConf));
        }

        // Check if user previously connected a raw file handle for background sync
        const handle = await getFileHandle();
        if (handle) {
          const hasPerm = await verifyPermission(handle, false);
          if (hasPerm) {
            setRawFileHandle(handle);
          }
        }
      } catch (e) {
        console.error('Failed to load from IndexedDB', e);
        setTransactions(MOCK_TRANSACTIONS);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

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

  // Sync to IndexedDB & raw file automatically
  useEffect(() => {
    if (!isDataLoaded) return;

    saveAppData(STORAGE_KEY_TXS, transactions).catch(e => console.error(e));

    // Auto save to raw MD file if user connected one
    const saveToRaw = async () => {
      if (rawFileHandle) {
        try {
          const headers = ['| Date | Title | Amount | Type | Category | Source | Note | Recurring |', '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'];
          const rows = transactions.map(t =>
            `| ${t.date} | ${t.title.replace(/\|/g, '-')} | ${formatSGD(t.amount)} | ${t.type} | ${t.category} | ${(t.source || '').replace(/\|/g, '-')} | ${(t.note || '').replace(/\|/g, '-')} | ${t.isRecurring ? 'Yes' : 'No'} |`
          );
          const mdContent = `# BudgetLens Export\n\nGenerated on: ${new Date().toLocaleString()}\n\n${headers.join('\n')}\n${rows.join('\n')}\n`;
          await writeToFile(rawFileHandle, mdContent);
        } catch (e) {
          console.warn("Auto-save to raw file skipped:", e);
        }
      }
    };
    saveToRaw();
  }, [transactions, rawFileHandle, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveAppData(STORAGE_KEY_BALANCE, initialBalance).catch(e => console.error(e));
  }, [initialBalance, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveAppData(STORAGE_KEY_CONFIGS, categoryConfigs).catch(e => console.error(e));
  }, [categoryConfigs, isDataLoaded]);

  // Compute live financial summary using dynamic baseline & category configs
  const summary = calculateFinanceSummary(transactions, initialBalance, categoryConfigs);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    autoDetectCurrency(`${tx.title} ${tx.note || ''}`);
    setTransactions((prev) => [tx, ...prev]);
    showToast(tx.title, tx.amount, tx.type, String(tx.category));
  };

  const handleImportTransactions = (importedTxs: Transaction[]) => {
    if (importedTxs.length > 0) {
      const sampleText = importedTxs.map((t) => `${t.title} ${t.source || ''} ${t.note || ''}`).join(' ');
      autoDetectCurrency(sampleText);
    }
    setTransactions((prev) => [...importedTxs, ...prev]);
    const totalAmt = importedTxs.reduce((s, t) => s + t.amount, 0);
    showToast(`Imported ${importedTxs.length} Transactions`, totalAmt, 'income', 'e-Statement Batch');
  };

  const handleQuickAdd = (title: string, amount: number, category: CategoryKey) => {
    autoDetectCurrency(title);
    const config = categoryConfigs[category];
    const type = config?.type || 'expense';
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      title,
      amount,
      type,
      category,
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      note: '1-Click Quick Add',
      source: type === 'income' ? 'Quick Income' : 'Quick Outflow'
    };
    setTransactions((prev) => [tx, ...prev]);
    showToast(title, amount, type, String(category));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter(t => t.id !== id));
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
      saveAppData(STORAGE_KEY_TXS, MOCK_TRANSACTIONS);
      saveAppData(STORAGE_KEY_BALANCE, INITIAL_BASELINE_BALANCE);
      saveAppData(STORAGE_KEY_CONFIGS, DEFAULT_CATEGORY_CONFIGS);
    } catch (e) { }
  };

  // Safe Archival & Reset Workspace to $0.00
  const handleArchiveAndReset = (downloadBackup: boolean) => {
    if (downloadBackup && transactions.length > 0) {
      exportToMarkdown(transactions);
    }

    // Reset state to clean 0
    setTransactions([]);
    setInitialBalance(0);
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);

    // Persist clean 0 state into storage
    saveAppData(STORAGE_KEY_TXS, []).catch(e => console.error(e));
    saveAppData(STORAGE_KEY_BALANCE, 0).catch(e => console.error(e));
    saveAppData(STORAGE_KEY_CONFIGS, DEFAULT_CATEGORY_CONFIGS).catch(e => console.error(e));

    setIsResetModalOpen(false);
    showToast('Fresh Session Initialized', 0, 'income', 'Reset to $0.00');
  };

  return (
    <div className="app-layout">
      {/* First-run onboarding wizard — shown once ever */}
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      {/* Post-onboarding welcome screen — shown once after wizard */}
      {!showOnboarding && showWelcome && <WelcomeScreen onDismiss={handleWelcomeDismiss} />}
      {/* Sidebar */}
      <Sidebar
        totalBalance={summary.totalBalance}
        overallRunwayMonths={summary.overallRunwayMonths}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header with Reset Button */}
        <Header onResetWorkspace={() => setIsResetModalOpen(true)} />

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

          {/* 4. 2-Column Responsive Layout for Ledger, Analytics, and Widgets */}
          <div className="dashboard-grid">
            {/* Left 8-Column Area: Transaction Ledger, Runway Breakdown & Expenditure Composition */}
            <div className="col-span-8">
              {/* Transaction Activity Ledger */}
              <TransactionLedger
                transactions={transactions}
                categoryConfigs={categoryConfigs}
                onDeleteTransaction={handleDeleteTransaction}
              />

              {/* Outflow Composition Analysis & Donut Breakdown */}
              <CategoryExpenditureDonut
                transactions={transactions}
                categoryConfigs={categoryConfigs}
              />

              {/* Category Runway & Longevity Projection Matrix */}
              <RunwaySection
                totalBalance={summary.totalBalance}
                overallRunwayMonths={summary.overallRunwayMonths}
                overallMonthlyBurn={summary.overallMonthlyBurn}
                categoryRunways={summary.categoryRunways}
                hasMinimumData={summary.hasMinimumDataForRunway}
                daysRecorded={summary.daysRecorded}
              />
            </div>

            {/* Right 4-Column Area: Quick Add, Predictive Runway, Dedicated Import Engine */}
            <div className="col-span-4">
              {/* Quick Add */}
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

              {/* Universal Bank Statement & Ledger Import Zone */}
              <CSVImportZone
                onImportTransactions={handleImportTransactions}
                existingTransactions={transactions}
              />
            </div>
          </div>
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

      {/* Reset Confirmation Modal with Automated Safety Archival */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleArchiveAndReset}
        transactionsCount={transactions.length}
        totalBalance={summary.totalBalance}
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
              {toast.category}
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
            {formatCurrency(toast.amount)}
          </span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => (
  <CurrencyProvider>
    <AppContent />
  </CurrencyProvider>
);

export default App;
