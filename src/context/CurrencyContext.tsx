import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CurrencyInfo,
  DEFAULT_CURRENCY_CODE,
  getCurrencyInfo,
  formatCurrency as formatCurrencyUtil,
  detectCurrencyFromText
} from '../config/currencyConfig';
import { getAppData, saveAppData } from '../utils/fileSystem';

const STORAGE_KEY_CURRENCY = 'budgetlens_currency';
const STORAGE_KEY_EXPLICIT = 'budgetlens_currency_explicit';

interface CurrencyContextType {
  currencyCode: string;
  currencyInfo: CurrencyInfo;
  setCurrencyCode: (code: string, isExplicit?: boolean) => void;
  formatCurrency: (amount: number, forceSign?: boolean) => string;
  autoDetectCurrency: (sampleText: string) => boolean;
  hasUserSetCurrency: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENCY) || DEFAULT_CURRENCY_CODE;
  });

  const [hasUserSetCurrency, setHasUserSetCurrency] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_EXPLICIT) === 'true';
  });

  // Load from IndexedDB on initial mount if available
  useEffect(() => {
    const loadSavedCurrency = async () => {
      try {
        const savedCode = await getAppData(STORAGE_KEY_CURRENCY);
        const savedExplicit = await getAppData(STORAGE_KEY_EXPLICIT);
        if (savedCode && typeof savedCode === 'string') {
          setCurrencyCodeState(savedCode);
        }
        if (savedExplicit !== undefined && savedExplicit !== null) {
          setHasUserSetCurrency(Boolean(savedExplicit));
        }
      } catch (e) {
        console.warn('Could not load saved currency from storage:', e);
      }
    };
    loadSavedCurrency();
  }, []);

  const setCurrencyCode = (code: string, isExplicit: boolean = true) => {
    const info = getCurrencyInfo(code);
    setCurrencyCodeState(info.code);
    localStorage.setItem(STORAGE_KEY_CURRENCY, info.code);
    saveAppData(STORAGE_KEY_CURRENCY, info.code).catch(() => {});

    if (isExplicit) {
      setHasUserSetCurrency(true);
      localStorage.setItem(STORAGE_KEY_EXPLICIT, 'true');
      saveAppData(STORAGE_KEY_EXPLICIT, true).catch(() => {});
    }
  };

  const formatCurrency = (amount: number, forceSign: boolean = false): string => {
    return formatCurrencyUtil(amount, currencyCode, forceSign);
  };

  const autoDetectCurrency = (sampleText: string): boolean => {
    if (hasUserSetCurrency) return false;
    const detected = detectCurrencyFromText(sampleText);
    if (detected && detected !== currencyCode) {
      setCurrencyCode(detected, false); // Auto set without marking explicit user override
      return true;
    }
    return false;
  };

  const currencyInfo = getCurrencyInfo(currencyCode);

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currencyInfo,
        setCurrencyCode,
        formatCurrency,
        autoDetectCurrency,
        hasUserSetCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
