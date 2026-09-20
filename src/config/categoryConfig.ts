import { CategoryConfig, CategoryKey } from '../types/finance';

export const DEFAULT_CATEGORY_CONFIGS: Record<CategoryKey, CategoryConfig> = {
  General: {
    key: 'General',
    label: 'General Expenses',
    color: '#0d9488', // Teal (Default category)
    icon: 'receipt_long',
    type: 'expense',
    keywords: ['general', 'misc', 'miscellaneous', 'other', 'shop', 'groceries', 'mart', 'supermarket', 'convenience', '7-eleven', 'fairprice', 'cold storage', 'donki', 'daiso', 'food', 'lunch', 'dinner', 'cafe', 'coffee'],
    tags: ['shopping', 'medical', 'personal', 'entertainment']
  },
  Salary: {
    key: 'Salary',
    label: 'Income',
    color: '#10b981', // Universally Green for Income
    icon: 'payments',
    type: 'income',
    keywords: ['salary', 'payroll', 'stripe', 'bonus', 'dividend', 'deposit', 'freelance', 'consultation', 'client payout', 'income', 'paycheck'],
    tags: ['salary', 'freelance', 'bonus', 'dividends', 'refund']
  },
  Bills: {
    key: 'Bills',
    label: 'Bills',
    color: '#ef4444', // Red for Bills
    icon: 'bolt',
    type: 'expense',
    keywords: ['sp group', 'sp services', 'singtel', 'starhub', 'm1', 'giga', 'netflix', 'spotify', 'utilities', 'electric', 'water', 'telecom', 'telco', 'wifi', 'broadband', 'insurance', 'bill', 'bills'],
    tags: ['utilities', 'wifi', 'mobile', 'insurance', 'subscriptions']
  },
  Transport: {
    key: 'Transport',
    label: 'Transport',
    color: '#0284c7', // Sky Blue
    icon: 'directions_subway',
    type: 'expense',
    keywords: ['grab', 'gojek', 'mrt', 'bus', 'simplygo', 'ezlink', 'transit', 'shell', 'fuel', 'petrol', 'taxi', 'comfortdelgro', 'flight', 'airline', 'transport'],
    tags: ['mrt', 'bus', 'taxi', 'grab', 'petrol', 'flight']
  },
  Savings: {
    key: 'Savings',
    label: 'Savings',
    color: '#8b5cf6', // Lavender / Purple
    icon: 'savings',
    type: 'savings',
    keywords: ['stash', 'emergency fund', 'vault', 'crypto', 'invest', 'etf', 'cpf', 'fixed deposit', 'saving', 'savings'],
    tags: ['investments', 'emergency-fund', 'crypto', 'deposit']
  }
};

export const CATEGORY_CONFIGS = DEFAULT_CATEGORY_CONFIGS;

export const CATEGORY_LIST: CategoryConfig[] = Object.values(DEFAULT_CATEGORY_CONFIGS);

export function getCategoryConfig(
  categoryKey: CategoryKey | string,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): CategoryConfig {
  if (categoryKey && categoryKey in configs) {
    return configs[categoryKey as CategoryKey];
  }
  const byLabel = Object.values(configs).find(c => c.label.toLowerCase() === (categoryKey || '').toLowerCase());
  if (byLabel) return byLabel;

  return Object.values(configs)[0] || {
    key: 'General',
    label: 'General',
    color: '#64748b',
    icon: 'category',
    type: 'expense',
    keywords: []
  };
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

export function ensureUniqueCategoryColors(
  configs: Record<CategoryKey, CategoryConfig>
): Record<CategoryKey, CategoryConfig> {
  const result: Record<CategoryKey, CategoryConfig> = {};
  const usedColors = new Set<string>();

  for (const [key, conf] of Object.entries(configs)) {
    let color = conf.color;
    if (usedColors.has(color.toLowerCase())) {
      // Find next available unique color from palette
      let found = false;
      for (const col of UNIQUE_PALETTE) {
        if (!usedColors.has(col.toLowerCase())) {
          color = col;
          found = true;
          break;
        }
      }
      if (!found) {
        const hue = Math.floor(Math.random() * 360);
        color = `hsl(${hue}, 75%, 50%)`;
      }
    }
    usedColors.add(color.toLowerCase());
    result[key] = {
      ...conf,
      color
    };
  }

  return result;
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

export function matchCategory(
  raw: string | undefined | null,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): CategoryKey {
  if (!raw) return 'General';
  const clean = raw.trim().toLowerCase();

  // Direct key match
  for (const key of Object.keys(configs)) {
    if (key.toLowerCase() === clean) {
      return key as CategoryKey;
    }
  }

  // Label match
  for (const config of Object.values(configs)) {
    if (config.label.toLowerCase() === clean) {
      return config.key;
    }
  }

  // Common synonyms / prefixes
  if (clean.includes('sal') || clean.includes('income') || clean.includes('wage') || clean.includes('deposit')) return 'Salary';
  if (clean.includes('food') || clean.includes('dine') || clean.includes('dining') || clean.includes('grocer') || clean.includes('restaurant') || clean.includes('meal')) return 'Food';
  if (clean.includes('trans') || clean.includes('travel') || clean.includes('mrt') || clean.includes('grab') || clean.includes('petrol') || clean.includes('fuel')) return 'Transport';
  if (clean.includes('bill') || clean.includes('util') || clean.includes('telco') || clean.includes('electric') || clean.includes('subscri') || clean.includes('wifi') || clean.includes('broadband')) return 'Bills';
  if (clean.includes('rent') || clean.includes('house') || clean.includes('housing') || clean.includes('condo') || clean.includes('mortgage')) return 'Rent';
  if (clean.includes('sav') || clean.includes('vault') || clean.includes('invest') || clean.includes('stash') || clean.includes('cpf')) return 'Savings';
  if (clean.includes('gen') || clean.includes('other') || clean.includes('misc') || clean.includes('shop')) return 'General';

  // Keyword match
  for (const config of Object.values(configs)) {
    if (config.keywords && config.keywords.some((kw) => clean.includes(kw.toLowerCase()))) {
      return config.key;
    }
  }

  return 'General';
}

