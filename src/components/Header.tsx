import React from 'react';

export const Header: React.FC = () => {
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

    </header>
  );
};
