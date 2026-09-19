import React, { useState, useEffect } from 'react';
import { calculateFinanceSummary, formatSGD } from './utils/financeCalculator';
import { Transaction, CategoryKey, CategoryConfig } from './types/finance';
import { DEFAULT_CATEGORY_CONFIGS, ensureUniqueCategoryColors, detectCategoryFromTitle } from './config/categoryConfig';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { QuickEntryBar } from './components/QuickEntryBar';
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
import { ResetConfirmModal, ExportFormatChoice } from './components/ResetConfirmModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { DashboardTour } from './components/DashboardTour';
import { getFileHandle, verifyPermission, writeToFile, saveAppData, getAppData } from './utils/fileSystem';
import { exportToMarkdown, exportToCSV } from './utils/exportUtils';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';

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
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [categoryConfigs, setCategoryConfigs] = useState<Record<CategoryKey, CategoryConfig>>(DEFAULT_CATEGORY_CONFIGS);
  const [manualTour, setManualTour] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // First-run welcome modal — persisted in localStorage so it only shows once
  const [showWelcome, setShowWelcome] = useState<boolean>(
    () => localStorage.getItem(WELCOME_KEY) !== 'true'
  );

  const handleWelcomeDismiss = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShowWelcome(false);
  };

  const handleWelcomeStartTour = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShowWelcome(false);
    setManualTour(true);
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

          setTransactions(healedTxs);
        } else {
          setTransactions([]);
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
          // Merge with DEFAULT_CATEGORY_CONFIGS to ensure General Expenses exists
          const mergedConf = { ...DEFAULT_CATEGORY_CONFIGS, ...savedConf };
          // Migrate old default colors if they were untouched defaults
          if (mergedConf.Salary && (mergedConf.Salary.color === '#3b82f6' || !mergedConf.Salary.color)) {
            mergedConf.Salary.color = '#10b981'; // Standardized Green
          }
          if (mergedConf.Transport && mergedConf.Transport.color === '#10b981') {
            mergedConf.Transport.color = '#0284c7'; // Standardized Sky Blue
          }
          if (mergedConf.Bills && !mergedConf.Bills.color) {
            mergedConf.Bills.color = '#ef4444'; // Standardized Red
          }
          setCategoryConfigs(ensureUniqueCategoryColors(mergedConf));
        } else {
          setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
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
        setTransactions([]);
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

  const handleResetDefaults = () => {
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
    setInitialBalance(0);
    setTransactions([]);
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIGS);
      localStorage.removeItem(STORAGE_KEY_BALANCE);
      localStorage.removeItem(STORAGE_KEY_TXS);
      saveAppData(STORAGE_KEY_TXS, []);
      saveAppData(STORAGE_KEY_BALANCE, 0);
      saveAppData(STORAGE_KEY_CONFIGS, DEFAULT_CATEGORY_CONFIGS);
    } catch (e) { }
  };

  const [postResetNotice, setPostResetNotice] = useState<{
    format: ExportFormatChoice;
    fileName?: string;
  } | null>(null);

  // Safe Archival & Reset Workspace to $0.00
  const handleArchiveAndReset = (exportFormat: ExportFormatChoice) => {
    let exportedFileName = '';
    const dateStr = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv' && transactions.length > 0) {
      exportToCSV(transactions);
      exportedFileName = `budgetlens_export_${dateStr}.csv`;
    } else if (exportFormat === 'md' && transactions.length > 0) {
      exportToMarkdown(transactions);
      exportedFileName = `budgetlens_export_${dateStr}.md`;
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

    // Display saved location directory alert modal
    setPostResetNotice({
      format: exportFormat,
      fileName: exportedFileName
    });
    showToast('Fresh Session Initialized', 0, 'income', 'Reset to $0.00');
  };

  return (
    <div className="app-layout">
      {/* First-run welcome screen — shown once on fresh install */}
      {showWelcome && (
        <WelcomeScreen
          onDismiss={handleWelcomeDismiss}
          onStartTour={handleWelcomeStartTour}
        />
      )}
      
      {/* Interactive Tour (Spotlight & Mask) */}
      <DashboardTour
        manualRun={manualTour}
        onTourEnd={() => setManualTour(false)}
      />
      
      {/* Sidebar */}
      <Sidebar
        totalBalance={summary.totalBalance}
        overallRunwayMonths={summary.overallRunwayMonths}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header with Reset & Tour Buttons */}
        <Header
          onResetWorkspace={() => setIsResetModalOpen(true)}
          onStartTour={() => setManualTour(true)}
        />

        {/* Workspace Content */}
        <main className="workspace-content">
          {/* 1. Hero Section: Total Bank Balance & KPIs */}
          <div className="tour-hero">
            <HeroSection
              totalBalance={summary.totalBalance}
              totalIncome={summary.totalIncome}
              totalExpenses={summary.totalExpenses}
              onScrollToImport={() => setIsImportModalOpen(true)}
            />
          </div>

          {/* Quick 1-Liner Direct Entry Bar */}
          <div className="tour-quick-entry">
            <QuickEntryBar
              onAddTransaction={handleAddTransaction}
              categoryConfigs={categoryConfigs}
            />
          </div>

          {/* 2. Inline Category Color Key */}
          <CategoryLegend
            categoryConfigs={categoryConfigs}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* 3. Cash In / Out Flow Analysis Chart */}
          <div className="tour-chart">
            <CashflowChart
              transactions={transactions}
              categoryConfigs={categoryConfigs}
            />
          </div>

          {/* 4. 2-Column Responsive Layout for Ledger, Analytics, and Widgets */}
          <div className="dashboard-grid">
            {/* Left 8-Column Area: Expenditure Composition Donut, Transaction Ledger & Runway Breakdown */}
            <div className="col-span-8">
              {/* Outflow Composition Analysis & Donut Breakdown */}
              <div className="tour-donut">
                <CategoryExpenditureDonut
                  transactions={transactions}
                  categoryConfigs={categoryConfigs}
                />
              </div>

              {/* Transaction Activity Ledger */}
              <div className="tour-ledger">
                <TransactionLedger
                  transactions={transactions}
                  categoryConfigs={categoryConfigs}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </div>

              {/* Category Runway & Longevity Projection Matrix */}
              <RunwaySection
                totalBalance={summary.totalBalance}
                overallMonthlyBurn={summary.overallMonthlyBurn}
                overallRunwayMonths={summary.overallRunwayMonths}
                categoryRunways={summary.categoryRunways}
                hasMinimumData={summary.hasMinimumDataForRunway}
                daysRecorded={summary.daysRecorded}
              />
            </div>

            {/* Right 4-Column Area: Quick Log, Predictive Runway */}
            <div className="col-span-4">
              {/* Quick Log */}
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
                hasMinimumData={summary.hasMinimumDataForRunway}
                daysRecorded={summary.daysRecorded}
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

      {/* Post-Reset Saved Location File Directory Alert */}
      {postResetNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={() => setPostResetNotice(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '500px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>folder_zip</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Dashboard Reset Completed
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Active session initialized with $0.00 balance
                </span>
              </div>
            </div>

            {postResetNotice.format !== 'none' && postResetNotice.fileName ? (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>download_done</span>
                  Backup Export Downloaded:
                </span>
                <code
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  {postResetNotice.fileName}
                </code>
                <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.45 }}>
                  📂 <strong>Saved Directory Location:</strong> Check your browser's default <strong>Downloads folder</strong> (e.g. <code>Downloads/</code>). You can copy or move this file anywhere for safekeeping.
                </span>
              </div>
            ) : (
              <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: '#f1f5f9', fontSize: '12.5px', color: '#475569' }}>
                Your financial dashboard has been reset directly to $0.00 without creating a file export.
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => setPostResetNotice(null)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Got it, continue to Fresh Dashboard
            </button>
          </div>
        </div>
      )}

      {/* On-Demand Statement & File Import Modal */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImportModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <CSVImportZone
              onImportTransactions={(txs) => {
                handleImportTransactions(txs);
                setIsImportModalOpen(false);
              }}
              existingTransactions={transactions}
              onClose={() => setIsImportModalOpen(false)}
            />
          </div>
        </div>
      )}

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
