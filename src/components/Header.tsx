import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../config/currencyConfig';

interface HeaderProps {
  onResetWorkspace?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetWorkspace, onStartTour }) => {
  const { currencyCode, setCurrencyCode } = useCurrency();

  return (
    <header className="top-header" style={{ justifyContent: 'space-between', padding: '0.875rem 2rem', gap: '1rem', flexWrap: 'wrap' }}>
      {/* Left breadcrumb / page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>
            space_dashboard
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Executive Financial Cockpit
          </span>
        </div>
        <span style={{ height: '14px', width: '1px', background: '#e2e8f0' }}></span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Offline Vault Mode (Local Storage Only)
        </span>
      </div>

      {/* Right Actions: Currency Selector, Tour & Reset Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Top Right Currency Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
            payments
          </span>
          <label htmlFor="currency-select" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Currency:
          </label>
          <select
            id="currency-select"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value, true)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--text-main)',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Select your preferred global currency"
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code} ({curr.symbol}) — {curr.name}
              </option>
            ))}
          </select>
        </div>

        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f5f3ff',
              color: '#4f46e5',
              border: '1.5px solid #ddd6fe',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ede9fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f3ff';
            }}
            title="Start interactive visual tutorial"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#4f46e5' }}>
              explore
            </span>
            <span>Tutorial Tour</span>
          </button>
        )}

        {onResetWorkspace && (
          <button
            type="button"
            onClick={onResetWorkspace}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: '1.5px solid #fecdd3',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff1f2';
              e.currentTarget.style.borderColor = '#fda4af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#fecdd3';
            }}
            title="Reset all balances to $0.00 and archive current data into an offline backup file"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#dc2626' }}>
              restart_alt
            </span>
            <span>Reset & Start Fresh ($0)</span>
          </button>
        )}
      </div>
    </header>
  );
};
