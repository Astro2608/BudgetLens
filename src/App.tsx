import React, { useState } from 'react';
import { MOCK_TRANSACTIONS, INITIAL_BASELINE_BALANCE } from './mock/mockTransactions';
import { calculateFinanceSummary } from './utils/financeCalculator';
import { Transaction, CategoryKey } from './types/finance';

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

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Compute live financial summary using domain logic
  const summary = calculateFinanceSummary(transactions, INITIAL_BASELINE_BALANCE);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions((prev) => [tx, ...prev]);
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
  };

  const handleScrollToImport = () => {
    const importEl = document.getElementById('import-section');
    if (importEl) {
      importEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        totalBalance={summary.totalBalance}
        overallRunwayMonths={summary.overallRunwayMonths}
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
          <CategoryLegend />

          {/* 3. Cash In / Out Flow Analysis Chart (Promoted directly below overview) */}
          <CashflowChart transactions={transactions} />

          {/* 4. 2-Column Responsive Layout for Ledger, CSV, and Widgets */}
          <div className="dashboard-grid">
            {/* Left 8-Column Area: CSV Import Zone, Transaction Ledger */}
            <div className="col-span-8">
              {/* Bank e-Statement CSV Import Zone */}
              <CSVImportZone />

              {/* Transaction Activity Ledger */}
              <TransactionLedger
                transactions={transactions}
                searchQuery={searchQuery}
              />
            </div>

            {/* Right 4-Column Area: Quick Add Outflows, Predictive Runway */}
            <div className="col-span-4">
              {/* Quick Add Frequent Outflows */}
              <QuickAddOutflows onQuickAdd={handleQuickAdd} />

              {/* Predictive Runway Simulation Widget */}
              <PredictiveRunwayWidget />
            </div>
          </div>

          {/* 5. Runway & Longevity Projection Matrix (Moved to bottom section) */}
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
      />
    </div>
  );
};

export default App;
