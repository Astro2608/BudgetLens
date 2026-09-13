import React from 'react';
import { formatSGD } from '../utils/financeCalculator';

interface SidebarProps {
  totalBalance: number;
  overallRunwayMonths: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ totalBalance, overallRunwayMonths }) => {
  return (
    <aside className="sidebar">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>finance_chip</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">Lumina</span>
            <span className="brand-sub">Finance</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="nav-menu">
          <a className="nav-item active" href="#">
            <span className="material-symbols-outlined fill">grid_view</span>
            <span>Dashboard</span>
          </a>
          <a className="nav-item" href="#analytics-section">
            <span className="material-symbols-outlined">trending_up</span>
            <span>Analytics & Projections</span>
          </a>
          <a className="nav-item" href="#settings-section">
            <span className="material-symbols-outlined">tune</span>
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Available Cash Health Card */}
      <div className="sidebar-cash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Available Cash
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-primary-hover)', background: 'var(--color-primary-border)', padding: '2px 8px', borderRadius: '6px' }}>
            {overallRunwayMonths} Mo
          </span>
        </div>

        <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: '72%', height: '100%', background: 'var(--color-primary)', borderRadius: '9999px' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingTop: '2px' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatSGD(totalBalance)}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700 }}>Health: Stable</span>
        </div>
      </div>
    </aside>
  );
};
