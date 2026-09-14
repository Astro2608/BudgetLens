export interface CurrencyInfo {
  code: string;
  symbol: string;
  prefix: string;
  name: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'SGD', symbol: 'S$', prefix: 'SGD $', name: 'Singapore Dollar', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'USD', symbol: '$', prefix: 'USD $', name: 'US Dollar', locale: 'en-US', flag: '🇺🇸' },
  { code: 'INR', symbol: '₹', prefix: 'INR ₹', name: 'Indian Rupee', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'EUR', symbol: '€', prefix: 'EUR €', name: 'Euro', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', prefix: 'GBP £', name: 'British Pound', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', prefix: 'JPY ¥', name: 'Japanese Yen', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', prefix: 'AUD A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', prefix: 'CAD C$', name: 'Canadian Dollar', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'CNY', symbol: '¥', prefix: 'CNY ¥', name: 'Chinese Yuan', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'MYR', symbol: 'RM', prefix: 'MYR RM', name: 'Malaysian Ringgit', locale: 'ms-MY', flag: '🇲🇾' },
  { code: 'CHF', symbol: 'CHF', prefix: 'CHF ', name: 'Swiss Franc', locale: 'de-CH', flag: '🇨🇭' },
  { code: 'AED', symbol: 'AED', prefix: 'AED ', name: 'UAE Dirham', locale: 'ar-AE', flag: '🇦🇪' },
];

export const DEFAULT_CURRENCY_CODE = 'SGD';

export function getCurrencyInfo(code: string): CurrencyInfo {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code?.toUpperCase());
  if (found) return found;
  return SUPPORTED_CURRENCIES[0]; // Fallback to SGD
}

export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
  forceSign: boolean = false
): string {
  const curr = getCurrencyInfo(currencyCode);
  const decimals = curr.code === 'JPY' ? 0 : 2;

  const absVal = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (forceSign) {
    return amount >= 0 ? `+${curr.prefix}${absVal}` : `-${curr.prefix}${absVal}`;
  }
  return amount < 0 ? `-${curr.prefix}${absVal}` : `${curr.prefix}${absVal}`;
}

export function detectCurrencyFromText(text: string): string | null {
  if (!text) return null;

  if (/₹|\bINR\b|\bRUPEE\b|\bRUPEES\b|\bRS\b/i.test(text)) return 'INR';
  if (/€|\bEUR\b|\bEURO\b|\bEUROS\b/i.test(text)) return 'EUR';
  if (/£|\bGBP\b|\bPOUND\b|\bPOUNDS\b/i.test(text)) return 'GBP';
  if (/¥|\bJPY\b|\bYEN\b/i.test(text)) return 'JPY';
  if (/\bMYR\b|\bRM\b/i.test(text)) return 'MYR';
  if (/\bAUD\b|A\$/i.test(text)) return 'AUD';
  if (/\bCAD\b|C\$/i.test(text)) return 'CAD';
  if (/\bCNY\b|\bRMB\b/i.test(text)) return 'CNY';
  if (/\bCHF\b/i.test(text)) return 'CHF';
  if (/\bAED\b/i.test(text)) return 'AED';
  if (/\bSGD\b|S\$/i.test(text)) return 'SGD';
  if (/\bUSD\b|US\$/i.test(text)) return 'USD';

  return null;
}
