import { CategoryConfig, CategoryKey } from '../types/finance';

export const DEFAULT_CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
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
    color: '#06b6d4', // Cyan
    icon: 'category',
    type: 'expense',
    keywords: ['misc', 'shopping', 'watsons', 'guardian', 'kinokuniya', 'hardware', 'books', 'general']
  }
};

export const CATEGORY_CONFIGS = DEFAULT_CATEGORY_CONFIGS;

export const CATEGORY_LIST: CategoryConfig[] = Object.values(DEFAULT_CATEGORY_CONFIGS);

export function getCategoryConfig(
  categoryKey: CategoryKey | string,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): CategoryConfig {
  if (categoryKey in configs) {
    return configs[categoryKey as CategoryKey];
  }
  return configs.General || DEFAULT_CATEGORY_CONFIGS.General;
}

export const UNIQUE_PALETTE = [
  '#10b981', // Emerald Green (Transport)
  '#f59e0b', // Amber / Gold (Food)
  '#ef4444', // Red (Bills)
  '#3b82f6', // Cobalt Blue (Rent)
  '#f97316', // Orange (Salary)
  '#8b5cf6', // Purple (Savings)
  '#06b6d4', // Cyan (General)
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#84cc16', // Lime Green
  '#d946ef', // Fuchsia
  '#eab308', // Yellow
  '#0284c7', // Sky Blue
  '#f43f5e', // Rose
  '#a855f7', // Violet
  '#64748b'  // Slate
];

export function getNextUniqueColor(configs: Record<CategoryKey, CategoryConfig>): string {
  const usedColors = new Set(
    Object.values(configs).map((c) => c.color.toLowerCase())
  );

  for (const col of UNIQUE_PALETTE) {
    if (!usedColors.has(col.toLowerCase())) {
      return col;
    }
  }

  // Fallback random distinct vibrant HSL color if all 17 colors are exhausted
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 75%, 50%)`;
}

export function detectCategoryFromTitle(
  title: string,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): CategoryKey {
  if (!title) return 'General';
  const lower = title.toLowerCase();

  for (const config of Object.values(configs)) {
    if (config.keywords && config.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return config.key;
    }
  }
  return 'General';
}
