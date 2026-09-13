import { Transaction } from '../types/finance';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Current Week / Recent Days
  {
    id: 'tx-1',
    date: daysAgo(0), // Today
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
    date: daysAgo(1), // Yesterday
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
    date: daysAgo(2),
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
    date: daysAgo(3),
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
    date: daysAgo(4),
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
    date: daysAgo(6),
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
    date: daysAgo(9),
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
    date: daysAgo(14),
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },

  // 2 - 4 Weeks Ago
  {
    id: 'tx-9',
    date: daysAgo(17),
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
    date: daysAgo(20),
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
    date: daysAgo(24),
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
    date: daysAgo(28),
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
    date: daysAgo(31),
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
    date: daysAgo(35),
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
    date: daysAgo(37),
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
    date: daysAgo(42),
    title: 'Stripe Tech Partners - Bi-weekly Salary',
    amount: 8450.00,
    type: 'income',
    category: 'Salary',
    isRecurring: true,
    note: 'Direct Deposit',
    source: 'DBS Multi-Currency •• 8092'
  },

  // 1.5 - 2 Months Ago
  {
    id: 'tx-17',
    date: daysAgo(48),
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
    date: daysAgo(56),
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
    date: daysAgo(61),
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
    date: daysAgo(65),
    title: 'Din Tai Fung Family Dinner',
    amount: 145.00,
    type: 'expense',
    category: 'Food',
    isRecurring: false,
    note: 'Dinner',
    source: 'DBS PayLah!'
  }
];

export const INITIAL_BASELINE_BALANCE = 0;
