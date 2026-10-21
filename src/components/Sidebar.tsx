import React from 'react';
import { useAccounts } from '../context/AccountContext';

interface SidebarProps {
  totalBalance?: number;
  overallRunwayMonths?: number;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings
}) => {
  const { activeAccount } = useAccounts();

  return (
    <aside className="sidebar">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>finance_chip</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">BudgetLens</span>
            <span className="brand-sub">Finance</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="nav-menu">
          <a
            className="nav-item active"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="material-symbols-outlined fill">grid_view</span>
            <span>Dashboard</span>
          </a>
          <button
            className="nav-item"
            type="button"
            onClick={onOpenSettings}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Minimal Vault Status Badge */}
      <div
        style={{
          margin: '0 0.75rem 1rem 0.75rem',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
        title={`Active Vault: ${activeAccount.name} (${activeAccount.currency}) - 100% offline private storage`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeAccount.color || '#10b981',
              display: 'inline-block',
              flexShrink: 0
            }}
          ></span>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {activeAccount.name}
          </span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          {activeAccount.currency}
        </span>
      </div>
    </aside>
  );
};
