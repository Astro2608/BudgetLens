import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../config/currencyConfig';

interface HeaderProps {
  onResetWorkspace?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetWorkspace, onStartTour }) => {
  const { currencyCode, setCurrencyCode } = useCurrency();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="top-header">
      <div className="header-main-bar">
        {/* Left breadcrumb / page title */}
        <div className="header-title-group">
          <div className="header-title-badge">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>
              space_dashboard
            </span>
            <span className="header-title-text">
              Executive Financial Cockpit
            </span>
          </div>
          <span className="header-divider"></span>
          <span className="header-subtitle">
            Offline Vault Mode (Local Storage Only)
          </span>
        </div>

        {/* Right Actions for Desktop */}
        <div className="header-desktop-actions">
          {/* Currency Dropdown */}
          <div className="header-currency-selector">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
              payments
            </span>
            <label htmlFor="currency-select" className="header-currency-label">
              Currency:
            </label>
            <select
              id="currency-select"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value, true)}
              className="header-currency-dropdown"
              title="Select your preferred global currency"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="header-btn-tour"
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
              className="header-btn-reset"
              title="Reset all balances to zero and archive current data into an offline backup file"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#dc2626' }}>
                restart_alt
              </span>
              <span>Reset & Start Fresh</span>
            </button>
          )}
        </div>

        {/* Collapsible Button for Mobile / Small Screens */}
        <div className="header-mobile-controls">
          <button
            type="button"
            className="header-mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle header options"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isMobileMenuOpen ? 'close' : 'tune'}
            </span>
            <span>{isMobileMenuOpen ? 'Close' : 'Quick Actions'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isMobileMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Drawer */}
      {isMobileMenuOpen && (
        <div className="header-mobile-drawer">
          {/* Mobile Currency Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
                payments
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Currency
              </span>
            </div>
            <select
              value={currencyCode}
              onChange={(e) => {
                setCurrencyCode(e.target.value, true);
              }}
              className="header-currency-dropdown"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '13px' }}
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Action Buttons */}
          <div className="header-mobile-actions-row">
            {onStartTour && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onStartTour();
                }}
                className="header-btn-tour"
                style={{ flex: 1, justifyContent: 'center', padding: '0.6rem 0.75rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4f46e5' }}>
                  explore
                </span>
                <span>Tutorial Tour</span>
              </button>
            )}

            {onResetWorkspace && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onResetWorkspace();
                }}
                className="header-btn-reset"
                style={{ flex: 1, justifyContent: 'center', padding: '0.6rem 0.75rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#dc2626' }}>
                  restart_alt
                </span>
                <span>Reset & Start Fresh</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

