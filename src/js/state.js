/**
 * Lumina Finance Dashboard - Central State Manager
 * Handles local persistence, transaction mutations, dynamic category color mapping, and currency formatting.
 */

const STORAGE_KEY = 'lumina_finance_state_v1';

// Default Category Color Mapping & Auto-tagging Keywords
export const DEFAULT_CATEGORIES = [
  {
    id: 'salary',
    name: 'Salary & Income',
    color: '#0d9488', // Emerald Teal
    type: 'income',
    icon: 'payments',
    keywords: ['salary', 'payroll', 'stripe', 'bonus', 'dividend', 'deposit', 'freelance', 'client payout', 'transfer in']
  },
  {
    id: 'transport',
    name: 'Transport',
    color: '#10b981', // Green
    type: 'expense',
    icon: 'directions_car',
    keywords: ['grab', 'gojek', 'mrt', 'bus', 'ezlink', 'simplygo', 'shell', 'fuel', 'petrol', 'taxi', 'comfortdelgro', 'transit', 'uber']
  },
  {
    id: 'food',
    name: 'Food & Dining',
    color: '#f59e0b', // Warm Amber / Yellow
    type: 'expense',
    icon: 'restaurant',
    keywords: ['food', 'mcdonald', 'starbucks', 'coffee', 'osteria', 'trader joe', 'restaurant', 'cafe', 'deliveroo', 'grabfood', 'foodpanda', 'toast box', 'hawker', 'supermarket', 'fairprice', 'cold storage', 'dining', 'lunch', 'dinner', 'bakery']
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    color: '#f43f5e', // Red / Rose
    type: 'expense',
    icon: 'receipt_long',
    keywords: ['sp services', 'singtel', 'starhub', 'm1', 'netflix', 'spotify', 'utilities', 'electric', 'water', 'telecom', 'insurance', 'bill', 'subscription', 'broadband', 'gym membership']
  },
  {
    id: 'rent',
    name: 'Rent & Housing',
    color: '#06b6d4', // Cyan / Blue
    type: 'expense',
    icon: 'home',
    keywords: ['rent', 'landlord', 'housing', 'mortgage', 'condo', 'hdb', 'property management', 'maintenance fee']
  },
  {
    id: 'shopping',
    name: 'Shopping & Leisure',
    color: '#8b5cf6', // Soft Lavender
    type: 'expense',
    icon: 'shopping_bag',
    keywords: ['amazon', 'shopee', 'lazada', 'uniqlo', 'zara', 'apple', 'cinema', 'movie', 'leisure', 'game', 'books', 'clothing', 'patagonia']
  },
  {
    id: 'general',
    name: 'General / Miscellaneous',
    color: '#94a3b8', // Slate Grey (Default fallback)
    type: 'expense',
    icon: 'category',
    keywords: []
  }
];

// Rich Initial Dataset spanning 3 months for realistic trend and runway visualization
const generateInitialTransactions = () => {
  const today = new Date();
  
  const formatDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    // Recent Transactions (Last 7 Days)
    { id: 'tx-1', title: 'Tech Partners Monthly Salary', amount: 5800.00, type: 'income', categoryId: 'salary', date: formatDate(2), isRecurring: true, note: 'Direct Deposit' },
    { id: 'tx-2', title: 'Monthly Apartment Rent', amount: 1850.00, type: 'expense', categoryId: 'rent', date: formatDate(3), isRecurring: true, note: 'Bank Transfer' },
    { id: 'tx-3', title: 'FairPrice Finest Grocery Haul', amount: 142.60, type: 'expense', categoryId: 'food', date: formatDate(3), isRecurring: false, note: 'Contactless Pay' },
    { id: 'tx-4', title: 'MRT & SimplyGo Weekly Transit', amount: 28.50, type: 'expense', categoryId: 'transport', date: formatDate(4), isRecurring: false, note: 'Auto-topup' },
    { id: 'tx-5', title: 'SP Services Electricity & Water', amount: 175.40, type: 'expense', categoryId: 'bills', date: formatDate(5), isRecurring: true, note: 'GIRO Bill' },
    { id: 'tx-6', title: 'Osteria Morini Dinner with Friends', amount: 128.00, type: 'expense', categoryId: 'food', date: formatDate(5), isRecurring: false, note: 'DBS Debit Card' },
    { id: 'tx-7', title: 'Grab Ride to Downtown', amount: 24.80, type: 'expense', categoryId: 'transport', date: formatDate(6), isRecurring: false, note: 'GrabPay' },
    { id: 'tx-8', title: 'Netflix 4K Premium Plan', amount: 25.98, type: 'expense', categoryId: 'bills', date: formatDate(7), isRecurring: true, note: 'Auto-Renew' },
    
    // Month 1 (8-30 Days Ago)
    { id: 'tx-9', title: 'Brand Identity Freelance Retainer', amount: 1200.00, type: 'income', categoryId: 'salary', date: formatDate(12), isRecurring: false, note: 'PayNow Transfer' },
    { id: 'tx-10', title: 'Starbucks Reserve Cold Brew', amount: 9.80, type: 'expense', categoryId: 'food', date: formatDate(14), isRecurring: false, note: 'Apple Pay' },
    { id: 'tx-11', title: 'Uniqlo Airism Essentials', amount: 89.00, type: 'expense', categoryId: 'shopping', date: formatDate(16), isRecurring: false, note: 'Shopping' },
    { id: 'tx-12', title: 'Singtel Fibre 1Gbps Broadband', amount: 49.90, type: 'expense', categoryId: 'bills', date: formatDate(18), isRecurring: true, note: 'Auto-Debit' },
    { id: 'tx-13', title: 'Shell Petrol Station V-Power', amount: 85.00, type: 'expense', categoryId: 'transport', date: formatDate(21), isRecurring: false, note: 'Shell Card' },
    { id: 'tx-14', title: 'Cold Storage Organic Market', amount: 95.30, type: 'expense', categoryId: 'food', date: formatDate(25), isRecurring: false, note: 'Groceries' },

    // Month 2 (31-60 Days Ago)
    { id: 'tx-15', title: 'Tech Partners Monthly Salary', amount: 5800.00, type: 'income', categoryId: 'salary', date: formatDate(32), isRecurring: true, note: 'Direct Deposit' },
    { id: 'tx-16', title: 'Monthly Apartment Rent', amount: 1850.00, type: 'expense', categoryId: 'rent', date: formatDate(33), isRecurring: true, note: 'Bank Transfer' },
    { id: 'tx-17', title: 'SP Services Electricity & Water', amount: 168.20, type: 'expense', categoryId: 'bills', date: formatDate(35), isRecurring: true, note: 'GIRO Bill' },
    { id: 'tx-18', title: 'Shopee Electronics & Ergonomic Stand', amount: 135.00, type: 'expense', categoryId: 'shopping', date: formatDate(40), isRecurring: false, note: 'Online Purchase' },
    { id: 'tx-19', title: 'Weekly Groceries FairPrice', amount: 130.50, type: 'expense', categoryId: 'food', date: formatDate(44), isRecurring: false, note: 'Debit Card' },
    { id: 'tx-20', title: 'SimplyGo MRT Transit', amount: 32.00, type: 'expense', categoryId: 'transport', date: formatDate(48), isRecurring: false, note: 'Transport' },
    { id: 'tx-21', title: 'Spotify Premium Family', amount: 17.98, type: 'expense', categoryId: 'bills', date: formatDate(50), isRecurring: true, note: 'Subscription' },

    // Month 3 (61-90 Days Ago)
    { id: 'tx-22', title: 'Tech Partners Monthly Salary', amount: 5800.00, type: 'income', categoryId: 'salary', date: formatDate(62), isRecurring: true, note: 'Direct Deposit' },
    { id: 'tx-23', title: 'Monthly Apartment Rent', amount: 1850.00, type: 'expense', categoryId: 'rent', date: formatDate(63), isRecurring: true, note: 'Bank Transfer' },
    { id: 'tx-24', title: 'SP Services Utility Bill', amount: 180.10, type: 'expense', categoryId: 'bills', date: formatDate(65), isRecurring: true, note: 'GIRO Bill' },
    { id: 'tx-25', title: 'Quarterly Bonus Dividend', amount: 1500.00, type: 'income', categoryId: 'salary', date: formatDate(70), isRecurring: false, note: 'Investment Payout' },
    { id: 'tx-26', title: 'Weekend Dining & BBQ', amount: 165.00, type: 'expense', categoryId: 'food', date: formatDate(75), isRecurring: false, note: 'Dining' },
    { id: 'tx-27', title: 'Grab Car Airport Transit', amount: 38.00, type: 'expense', categoryId: 'transport', date: formatDate(80), isRecurring: false, note: 'Transit' }
  ];
};

class StateManager {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      initialBankBalance: 12500.00, // Starting baseline bank value
      currency: 'SGD',
      currencySymbol: 'SGD $',
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      transactions: generateInitialTransactions(),
      sensitivityMultiplier: 1.0, // 0.9 = Lean, 1.0 = Baseline, 1.2 = Cautious
      activeTimeframe: '3M', // '1M', '3M', '1Y', 'ALL'
      activeFilter: 'all', // 'all', 'income', 'expense'
      searchQuery: ''
    };
  }

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return this.getDefaultState();
      const parsed = JSON.parse(serialized);
      // Merge with defaults to ensure all required keys exist
      return {
        ...this.getDefaultState(),
        ...parsed,
        categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES
      };
    } catch (e) {
      console.warn('Could not load stored state, using defaults:', e);
      return this.getDefaultState();
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state to LocalStorage:', e);
    }
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn(this.state));
  }

  getState() {
    return this.state;
  }

  // Currency & Numeric Formatter
  formatCurrency(amount, includePlusMinus = false, forcePositive = false) {
    const sym = this.state.currencySymbol || 'SGD $';
    const num = Number(amount) || 0;
    const absVal = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (forcePositive) {
      return `${sym}${absVal}`;
    }
    if (includePlusMinus) {
      return num >= 0 ? `+${sym}${absVal}` : `-${sym}${absVal}`;
    }
    return num < 0 ? `-${sym}${absVal}` : `${sym}${absVal}`;
  }

  // Computes the current real-time Bank Value:
  // Bank Value = Initial Balance + Total Inflow - Total Outflow
  getCurrentBankBalance() {
    const { initialBankBalance, transactions } = this.state;
    const netFlow = transactions.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      return tx.type === 'income' ? acc + amt : acc - amt;
    }, 0);
    return (Number(initialBankBalance) || 0) + netFlow;
  }

  getTotalIncome(filteredTransactions = null) {
    const list = filteredTransactions || this.state.transactions;
    return list
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }

  getTotalExpenses(filteredTransactions = null) {
    const list = filteredTransactions || this.state.transactions;
    return list
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }

  // Category Helpers
  getCategoryById(id) {
    return this.state.categories.find(c => c.id === id) || this.getGeneralCategory();
  }

  getGeneralCategory() {
    return this.state.categories.find(c => c.id === 'general') || {
      id: 'general',
      name: 'General',
      color: '#94a3b8',
      type: 'expense',
      icon: 'category'
    };
  }

  // Automatic Keyword Matcher for CSV bank lines
  matchCategoryFromTitle(title) {
    if (!title) return 'general';
    const lower = title.toLowerCase();
    for (const cat of this.state.categories) {
      if (cat.keywords && cat.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return cat.id;
      }
    }
    return 'general';
  }

  // State Mutation Actions
  addTransaction(tx) {
    const newTx = {
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: tx.title || 'Untitled Transaction',
      amount: Math.abs(Number(tx.amount)) || 0,
      type: tx.type === 'income' ? 'income' : 'expense',
      categoryId: tx.categoryId || (tx.type === 'income' ? 'salary' : this.matchCategoryFromTitle(tx.title)),
      date: tx.date || new Date().toISOString().split('T')[0],
      isRecurring: Boolean(tx.isRecurring),
      note: tx.note || 'Manual Entry'
    };
    this.state.transactions.unshift(newTx);
    // Sort chronologically descending
    this.state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveState();
    return newTx;
  }

  addTransactionsBatch(txList) {
    const formatted = txList.map(tx => ({
      id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: tx.title || 'Imported Transaction',
      amount: Math.abs(Number(tx.amount)) || 0,
      type: tx.type === 'income' ? 'income' : 'expense',
      categoryId: tx.categoryId || (tx.type === 'income' ? 'salary' : this.matchCategoryFromTitle(tx.title)),
      date: tx.date || new Date().toISOString().split('T')[0],
      isRecurring: Boolean(tx.isRecurring),
      note: tx.note || 'Bank e-Statement Import'
    }));
    this.state.transactions.push(...formatted);
    this.state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveState();
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.saveState();
  }

  updateCategoryColor(categoryId, newColor) {
    const cat = this.state.categories.find(c => c.id === categoryId);
    if (cat) {
      cat.color = newColor;
      this.saveState();
    }
  }

  addCustomCategory(name, color, type = 'expense', keywords = []) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = this.state.categories.find(c => c.id === id);
    if (existing) {
      existing.color = color;
      existing.keywords = keywords;
    } else {
      this.state.categories.push({
        id,
        name,
        color,
        type,
        icon: type === 'income' ? 'payments' : 'sell',
        keywords
      });
    }
    this.saveState();
  }

  setCurrency(currency, symbol) {
    this.state.currency = currency;
    this.state.currencySymbol = symbol;
    this.saveState();
  }

  setInitialBankBalance(val) {
    this.state.initialBankBalance = Number(val) || 0;
    this.saveState();
  }

  setTimeframe(tf) {
    this.state.activeTimeframe = tf;
    this.saveState();
  }

  setFilter(filter) {
    this.state.activeFilter = filter;
    this.notifyListeners();
  }

  setSearchQuery(q) {
    this.state.searchQuery = q.toLowerCase().trim();
    this.notifyListeners();
  }

  setSensitivity(multiplier) {
    this.state.sensitivityMultiplier = multiplier;
    this.saveState();
  }

  resetToDefaultData() {
    this.state = this.getDefaultState();
    this.saveState();
  }
}

export const stateManager = new StateManager();
