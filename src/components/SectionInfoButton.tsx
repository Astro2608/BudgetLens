import React, { useState, useRef, useEffect } from 'react';

interface SectionInfoButtonProps {
  title: string;
  description: string;
  howItWorks: string;
  example: string;
}

export const SectionInfoButton: React.FC<SectionInfoButtonProps> = ({
  title,
  description,
  howItWorks,
  example
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Learn how ${title} works`}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '1px solid var(--border-subtle)',
          backgroundColor: isOpen ? 'var(--color-primary)' : 'var(--bg-canvas-subtle)',
          color: isOpen ? '#ffffff' : 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 150ms ease',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
          info
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            maxWidth: '90vw',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.125rem',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
            border: '1.5px solid var(--color-primary-border)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            animation: 'fadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'left'
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
                help
              </span>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {title} Guide
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                display: 'flex',
                padding: '2px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>

          {/* Description */}
          <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
            {description}
          </p>

          {/* How It Works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              How It Works
            </span>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              {howItWorks}
            </p>
          </div>

          {/* Concrete Example */}
          <div
            style={{
              backgroundColor: '#f0fdfa',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary-hover)' }}>
              💡 Example
            </span>
            <p style={{ fontSize: '11px', color: '#134e4a', lineHeight: 1.35, margin: 0 }}>
              {example}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
