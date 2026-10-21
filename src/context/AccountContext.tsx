import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  AccountVault,
  CreateAccountInput,
  UpdateAccountInput,
  DEFAULT_PRIMARY_VAULT,
  DEFAULT_VAULT_ID
} from '../types/account';
import { getAppData, saveAppData } from '../utils/fileSystem';

const STORAGE_KEY_VAULTS = 'budgetlens_vaults_list';
const STORAGE_KEY_ACTIVE_VAULT = 'budgetlens_active_vault_id';

// Legacy keys for migration
const LEGACY_STORAGE_KEY_TXS = 'budgetlens_transactions';
const LEGACY_STORAGE_KEY_BALANCE = 'budgetlens_initial_balance';
const LEGACY_STORAGE_KEY_LOANS = 'budgetlens_loans';
const LEGACY_STORAGE_KEY_CONFIGS = 'budgetlens_category_configs';
const LEGACY_STORAGE_KEY_CURRENCY = 'budgetlens_currency';

export const getScopedKey = (prefix: string, vaultId: string) => `budgetlens_${prefix}_${vaultId}`;

interface AccountContextType {
  accounts: AccountVault[];
  activeAccountId: string;
  activeAccount: AccountVault;
  isAccountDataLoaded: boolean;
  switchAccount: (id: string) => void;
  createAccount: (input: CreateAccountInput) => Promise<AccountVault>;
  updateAccount: (id: string, input: UpdateAccountInput) => Promise<void>;
  deleteAccount: (id: string) => Promise<boolean>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountVault[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_VAULTS);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [DEFAULT_PRIMARY_VAULT];
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_VAULT) || DEFAULT_VAULT_ID;
  });

  const [isAccountDataLoaded, setIsAccountDataLoaded] = useState(false);

  // Initialize and migrate on mount
  useEffect(() => {
    const initAccounts = async () => {
      try {
        let savedVaults: AccountVault[] | null = await getAppData(STORAGE_KEY_VAULTS);
        let savedActiveId: string | null = await getAppData(STORAGE_KEY_ACTIVE_VAULT);

        if (!savedVaults || !Array.isArray(savedVaults) || savedVaults.length === 0) {
          // Perform transparent migration from existing single-account keys
          const legacyCurrency = (await getAppData(LEGACY_STORAGE_KEY_CURRENCY)) || localStorage.getItem('budgetlens_currency') || 'SGD';
          
          const primaryVault: AccountVault = {
            ...DEFAULT_PRIMARY_VAULT,
            currency: legacyCurrency,
          };

          // Migrate existing transactions, balance, loans, and configs to scoped keys
          const legacyTxs = await getAppData(LEGACY_STORAGE_KEY_TXS);
          if (legacyTxs) {
            await saveAppData(getScopedKey('txs', DEFAULT_VAULT_ID), legacyTxs);
          }

          const legacyBal = await getAppData(LEGACY_STORAGE_KEY_BALANCE);
          if (legacyBal !== undefined && legacyBal !== null) {
            await saveAppData(getScopedKey('bal', DEFAULT_VAULT_ID), legacyBal);
          }

          const legacyLoans = await getAppData(LEGACY_STORAGE_KEY_LOANS);
          if (legacyLoans) {
            await saveAppData(getScopedKey('loans', DEFAULT_VAULT_ID), legacyLoans);
          }

          const legacyConfigs = await getAppData(LEGACY_STORAGE_KEY_CONFIGS);
          if (legacyConfigs) {
            await saveAppData(getScopedKey('conf', DEFAULT_VAULT_ID), legacyConfigs);
          }

          savedVaults = [primaryVault];
          savedActiveId = DEFAULT_VAULT_ID;

          await saveAppData(STORAGE_KEY_VAULTS, savedVaults);
          await saveAppData(STORAGE_KEY_ACTIVE_VAULT, savedActiveId);
        }

        setAccounts(savedVaults);

        // Ensure active account exists in current accounts
        const matched = savedVaults.find(v => v.id === savedActiveId);
        const resolvedActiveId = matched ? matched.id : savedVaults[0].id;
        setActiveAccountId(resolvedActiveId);

        localStorage.setItem(STORAGE_KEY_VAULTS, JSON.stringify(savedVaults));
        localStorage.setItem(STORAGE_KEY_ACTIVE_VAULT, resolvedActiveId);
      } catch (err) {
        console.error('[BudgetLens] Failed to initialize account vaults:', err);
      } finally {
        setIsAccountDataLoaded(true);
      }
    };

    initAccounts();
  }, []);

  const switchAccount = (id: string) => {
    const target = accounts.find(a => a.id === id);
    if (!target) return;
    setActiveAccountId(id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_VAULT, id);
    saveAppData(STORAGE_KEY_ACTIVE_VAULT, id).catch(() => {});
  };

  const createAccount = async (input: CreateAccountInput): Promise<AccountVault> => {
    const newId = `vault-${Date.now()}`;
    const newVault: AccountVault = {
      id: newId,
      name: input.name.trim() || 'New Account',
      description: input.description?.trim() || '',
      currency: input.currency || 'SGD',
      icon: input.icon || 'account_balance',
      color: input.color || '#10b981',
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    const updated = [...accounts, newVault];
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY_VAULTS, JSON.stringify(updated));
    await saveAppData(STORAGE_KEY_VAULTS, updated);

    // If an initial balance was provided, seed it into the scoped key
    if (input.initialBalance !== undefined) {
      await saveAppData(getScopedKey('bal', newId), Number(input.initialBalance) || 0);
    }

    // Switch to newly created account immediately
    switchAccount(newId);
    return newVault;
  };

  const updateAccount = async (id: string, input: UpdateAccountInput): Promise<void> => {
    const updated = accounts.map(acc => {
      if (acc.id !== id) return acc;
      return {
        ...acc,
        ...(input.name !== undefined ? { name: input.name.trim() || acc.name } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      };
    });

    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY_VAULTS, JSON.stringify(updated));
    await saveAppData(STORAGE_KEY_VAULTS, updated);
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    // Prevent deleting if it is the only account
    if (accounts.length <= 1) {
      console.warn('Cannot delete the last remaining account.');
      return false;
    }

    const updated = accounts.filter(acc => acc.id !== id);
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY_VAULTS, JSON.stringify(updated));
    await saveAppData(STORAGE_KEY_VAULTS, updated);

    // Clean up scoped account storage
    try {
      await saveAppData(getScopedKey('txs', id), []);
      await saveAppData(getScopedKey('bal', id), 0);
      await saveAppData(getScopedKey('loans', id), []);
      await saveAppData(getScopedKey('conf', id), null);
    } catch (e) {
      console.warn('Error purging deleted account storage:', e);
    }

    // If the active account was deleted, switch to the first available account
    if (activeAccountId === id) {
      const fallbackId = updated[0].id;
      switchAccount(fallbackId);
    }

    return true;
  };

  const activeAccount = useMemo(() => {
    const found = accounts.find(a => a.id === activeAccountId);
    return found || accounts[0] || DEFAULT_PRIMARY_VAULT;
  }, [accounts, activeAccountId]);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccountId,
        activeAccount,
        isAccountDataLoaded,
        switchAccount,
        createAccount,
        updateAccount,
        deleteAccount
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};
