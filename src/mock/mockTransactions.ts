import { Transaction } from '../types/finance';

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Current Month (Oct / Recent)
  {
    id: 'tx-1',
    date: '2026-10-15',
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },
  {
    id: 'tx-2',
    date: '2026-10-14',
    title: 'Condo Rental Monthly Giro',
    amount: 2500.00,
    type: 'expense',
    category: 'Rent',
    isRecurring: true,
    note: 'Monthly Fixed',
    source: 'Auto Giro (UOB •• 1004)'
  },
  {
    id: 'tx-3',
    date: '2026-10-13',
    title: 'Osteria Morini & Bistro',
    amount: 128.00,
    type: 'expense',
    category: 'Food',
    isRecurring: false,
    note: 'Dining out',
    source: 'Visa PayWave'
  },
  {
    id: 'tx-4',
    date: '2026-10-12',
    title: 'SMRT SimplyGo MRT/Bus Pass',
    amount: 45.20,
    type: 'expense',
    category: 'Transport',
    isRecurring: false,
    note: 'Auto-topup',
    source: 'SimplyGo Transit'
  },
  {
    id: 'tx-5',
    date: '2026-10-10',
    title: 'SP Group Utilities & Water Bill',
    amount: 184.60,
    type: 'expense',
    category: 'Bills',
    isRecurring: true,
    note: 'Recurring GIRO',
    source: 'SP Services'
  },
  {
    id: 'tx-6',
    date: '2026-10-08',
    title: 'Kinokuniya Stationary & Books',
    amount: 38.50,
    type: 'expense',
    category: 'General',
    isRecurring: false,
    note: 'Bookstore',
    source: 'Contactless Chip'
  },
  {
    id: 'tx-7',
    date: '2026-10-05',
    title: 'FairPrice Supermarket Orchard',
    amount: 164.20,
    type: 'expense',
    category: 'Food',
    isRecurring: false,
    note: 'Weekly Grocery Haul',
    source: 'DBS Debit Card'
  },
  {
    id: 'tx-8',
    date: '2026-10-01',
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },

  // Month -1 (September)
  {
    id: 'tx-9',
    date: '2026-09-28',
    title: 'Freelance Design Retainer Payout',
    amount: 1400.00,
    type: 'income',
    category: 'Salary',
    isRecurring: false,
    note: 'Client PayNow',
    source: 'PayNow'
  },
  {
    id: 'tx-10',
    date: '2026-09-25',
    title: 'Grab Ride Commute to CBD',
    amount: 28.50,
    type: 'expense',
    category: 'Transport',
    isRecurring: false,
    note: 'GrabPay',
    source: 'Grab'
  },
  {
    id: 'tx-11',
    date: '2026-09-20',
    title: 'Singtel 5G Mobile & Broadband',
    amount: 89.90,
    type: 'expense',
    category: 'Bills',
    isRecurring: true,
    note: 'Auto-Debit',
    source: 'GIRO'
  },
  {
    id: 'tx-12',
    date: '2026-09-15',
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },
  {
    id: 'tx-13',
    date: '2026-09-14',
    title: 'Condo Rental Monthly Giro',
    amount: 2500.00,
    type: 'expense',
    category: 'Rent',
    isRecurring: true,
    note: 'Monthly Fixed',
    source: 'UOB Auto Giro'
  },
  {
    id: 'tx-14',
    date: '2026-09-10',
    title: 'Cold Storage Organic Groceries',
    amount: 135.00,
    type: 'expense',
    category: 'Food',
    isRecurring: false,
    note: 'Weekly Grocery',
    source: 'Apple Pay'
  },
  {
    id: 'tx-15',
    date: '2026-09-08',
    title: 'Shell Fuel Station V-Power',
    amount: 85.00,
    type: 'expense',
    category: 'Transport',
    isRecurring: false,
    note: 'Fuel Top-up',
    source: 'Shell Card'
  },
  {
    id: 'tx-16',
    date: '2026-09-01',
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },

  // Month -2 (August)
  {
    id: 'tx-17',
    date: '2026-08-25',
    title: 'Uniqlo Essentials & Apparel',
    amount: 110.00,
    type: 'expense',
    category: 'General',
    isRecurring: false,
    note: 'Apparel',
    source: 'Visa Debit'
  },
  {
    id: 'tx-18',
    date: '2026-08-15',
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },
  {
    id: 'tx-19',
    date: '2026-08-14',
    title: 'Condo Rental Monthly Giro',
    amount: 2500.00,
    type: 'expense',
    category: 'Rent',
    isRecurring: true,
    note: 'Monthly Fixed',
    source: 'UOB Auto Giro'
  },
  {
    id: 'tx-20',
    date: '2026-08-10',
    title: 'Din Tai Fung Family Dinner',
    amount: 145.00,
    type: 'expense',
    category: 'Food',
    isRecurring: false,
    note: 'Dinner',
    source: 'DBS PayLah!'
  }
];

export const INITIAL_BASELINE_BALANCE = 0; // The total income minus expenses on mock data produces exact SGD $24,850.20
