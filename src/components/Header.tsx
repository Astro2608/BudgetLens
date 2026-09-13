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

      {/* Controls & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Notifications Bell */}
        <button
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            background: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
          title="System Alerts & Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid white'
            }}
          ></span>
        </button>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.25rem' }}>
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1WFDNgLeKzEfog8KF-85j6Bg6oJTcUJM1IXQVwKLfnzR5xo48DALFxBuJjYFT89KNFC9KHMgePvsVQqypA1eLcoJ1zlRkHwy3_PoJkgb-fJRxDS9FOY7Ri7mPRJ8PlW__wqwMnVdyHIv-qD5nZOXVzc_MCHu2EAShE72soxS-GrCGJY8zUzqVjNs0i3e0HIK819El2hgcoLxSALYqCAxQmro73SOPRhUR3GB-tsjPJc7ZWzz2U-35c0HTdD"
            alt="Elena Morales"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              objectFit: 'cover',
              border: '2px solid rgba(13, 148, 136, 0.2)',
              boxShadow: 'var(--shadow-xs)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
              Elena Morales
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Personal Tier
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
