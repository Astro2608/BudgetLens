import React from 'react';

interface HeaderProps {
  onResetWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetWorkspace }) => {
  return (
    <header className="top-header" style={{ justifyContent: 'space-between', padding: '0.875rem 2rem' }}>
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

      {/* Right Action: Reset Button */}
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
    </header>
  );
};
