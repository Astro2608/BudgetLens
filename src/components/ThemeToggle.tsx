import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || 'theme-toggle-btn'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle visual theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '0.4rem 0.65rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-canvas-subtle)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-main)',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 700,
        transition: 'all 0.18s ease'
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '18px',
          color: isDark ? '#f59e0b' : '#64748b',
          transition: 'transform 0.25s ease'
        }}
      >
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};
