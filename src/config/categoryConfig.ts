import { CategoryConfig, CategoryKey } from '../types/finance';

export const CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
  Transport: {
    key: 'Transport',
    label: 'Transport',
    color: '#10b981', // Green
    icon: 'directions_subway',
    type: 'expense',
    keywords: ['grab', 'gojek', 'mrt', 'bus', 'simplygo', 'ezlink', 'transit', 'shell', 'fuel', 'petrol', 'taxi', 'comfortdelgro']
  },
  Food: {
    key: 'Food',
    label: 'Food & Dining',
    color: '#f59e0b', // Amber / Yellow
    icon: 'restaurant',
    type: 'expense',
    keywords: ['food', 'mcdonald', 'starbucks', 'osteria', 'bistro', 'supermarket', 'fairprice', 'cold storage', 'dining', 'lunch', 'dinner', 'cafe', 'kopitiam', 'hawker', 'toast']
  },
  Bills: {
    key: 'Bills',
    label: 'Bills & Utilities',
    color: '#ef4444', // Red
    icon: 'bolt',
    type: 'expense',
    keywords: ['sp group', 'sp services', 'singtel', 'starhub', 'm1', 'giga', 'netflix', 'spotify', 'utilities', 'electric', 'water', 'telecom', 'telco', 'wifi', 'broadband', 'insurance']
  },
  Rent: {
    key: 'Rent',
    label: 'Rent & Housing',
    color: '#3b82f6', // Blue
    icon: 'apartment',
    type: 'expense',
    keywords: ['rent', 'rental', 'landlord', 'condo', 'hdb', 'housing', 'mortgage', 'maintenance fee']
  },
  Salary: {
    key: 'Salary',
    label: 'Salary & Income',
    color: '#f97316', // Orange
    icon: 'payments',
    type: 'income',
    keywords: ['salary', 'payroll', 'stripe', 'bonus', 'dividend', 'deposit', 'freelance', 'consultation', 'client payout']
  },
  Savings: {
    key: 'Savings',
    label: 'Savings & Vault',
    color: '#8b5cf6', // Lavender / Purple
    icon: 'savings',
    type: 'savings',
    keywords: ['stash', 'emergency fund', 'vault', 'crypto', 'invest', 'etf', 'cpf', 'fixed deposit']
  },
  General: {
    key: 'General',
    label: 'General / Others',
    color: '#94a3b8', // Slate Grey
    icon: 'category',
    type: 'expense',
    keywords: ['misc', 'shopping', 'watsons', 'guardian', 'kinokuniya', 'hardware', 'books', 'general']
  }
};

export const CATEGORY_LIST: CategoryConfig[] = Object.values(CATEGORY_CONFIGS);

export function getCategoryConfig(categoryKey: CategoryKey | string): CategoryConfig {
  if (categoryKey in CATEGORY_CONFIGS) {
    return CATEGORY_CONFIGS[categoryKey as CategoryKey];
  }
  return CATEGORY_CONFIGS.General;
}

export function detectCategoryFromTitle(title: string): CategoryKey {
  if (!title) return 'General';
  const lower = title.toLowerCase();

  for (const config of CATEGORY_LIST) {
    if (config.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return config.key;
    }
  }
  return 'General';
}
