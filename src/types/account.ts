/**
 * src/types/account.ts
 *
 * Types and presets for Multi-Account (Vault) support in BudgetLens.
 * Each account operates as an independent, isolated ledger with its own
 * transactions, starting balance, category configurations, loans, and currency.
 */

export interface AccountVault {
  id: string;               // Unique id, e.g. "vault-default" or "vault-1729500000"
  name: string;             // User customizable name, e.g. "Primary Account", "Freelance"
  description?: string;      // Optional brief note, e.g. "DBS Multiplier / Daily Spend"
  currency: string;         // Currency code e.g. "SGD", "USD", "EUR", "INR"
  icon: string;             // Material Symbol name e.g. "account_balance"
  color: string;            // Accent color hex e.g. "#10b981"
  createdAt: string;        // ISO 8601 date string
  isDefault?: boolean;      // System default account flag
}

export interface CreateAccountInput {
  name: string;
  description?: string;
  currency: string;
  icon?: string;
  color?: string;
  initialBalance?: number;
}

export interface UpdateAccountInput {
  name?: string;
  description?: string;
  currency?: string;
  icon?: string;
  color?: string;
}

export const PRESET_VAULT_COLORS = [
  { label: 'Emerald Green', hex: '#10b981' },
  { label: 'Teal Cyan', hex: '#0d9488' },
  { label: 'Sky Blue', hex: '#0284c7' },
  { label: 'Indigo', hex: '#6366f1' },
  { label: 'Purple Lavender', hex: '#8b5cf6' },
  { label: 'Amber Orange', hex: '#f59e0b' },
  { label: 'Rose Red', hex: '#ef4444' },
  { label: 'Pink Crimson', hex: '#ec4899' },
  { label: 'Slate Gray', hex: '#64748b' },
];

export const PRESET_VAULT_ICONS = [
  { name: 'account_balance', label: 'Bank' },
  { name: 'wallet', label: 'Wallet' },
  { name: 'credit_card', label: 'Card' },
  { name: 'payments', label: 'Cashflow' },
  { name: 'savings', label: 'Savings' },
  { name: 'storefront', label: 'Business' },
  { name: 'work', label: 'Freelance' },
  { name: 'home', label: 'Household' },
  { name: 'travel_explore', label: 'Travel' },
  { name: 'trending_up', label: 'Investments' },
];

export const DEFAULT_VAULT_ID = 'vault-default';

export const DEFAULT_PRIMARY_VAULT: AccountVault = {
  id: DEFAULT_VAULT_ID,
  name: 'Primary Account',
  description: 'Default main ledger',
  currency: 'SGD',
  icon: 'account_balance',
  color: '#10b981',
  createdAt: new Date().toISOString(),
  isDefault: true,
};
