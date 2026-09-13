import React, { useState } from 'react';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

// PWA install prompt event reference
let deferredInstallPrompt: any = null;

// Capture the browser's install prompt event globally
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss }) => {
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const canPrompt = !!deferredInstallPrompt;

  const handleInstall = async () => {
    if (!deferredInstallPrompt) return;
    setInstalling(true);
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        deferredInstallPrompt = null;
      }
    } catch (e) {
      console.warn('Install prompt error:', e);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      animation: 'fadeIn 0.4s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>

      <div style={{
        width: '560px', maxWidth: '92vw',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 50px 100px rgba(0,0,0,0.6)'
      }}>
        {/* Header banner */}
        <div style={{
          padding: '36px 40px 28px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.02) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '20px'
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'shimmer 2s infinite' }} />
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Ready to use
            </span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>
            Welcome to BudgetLens
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            Cash Flow in Focus · Looking Ahead: How far your cash takes you
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ padding: '28px 40px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Quick Start
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {[
              {
                icon: 'tune',
                color: '#6366f1',
                step: '1',
                title: 'Set your opening balance',
                desc: 'Tap the ⚙️ Settings icon → enter your current cash amount to calibrate the dashboard.'
              },
              {
                icon: 'upload',
                color: '#f59e0b',
                step: '2',
                title: 'Add or import transactions',
                desc: 'Log manually with the + button, or drag in a CSV from your bank for bulk import.'
              },
              {
                icon: 'timeline',
                color: '#10b981',
                step: '3',
                title: 'Read your runway',
                desc: 'See how many months your cash lasts at your current burn rate — category by category.'
              },
            ].map(({ icon, color, step, title, desc }) => (
              <div key={step} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>{icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 3px' }}>
                    <span style={{ color, marginRight: '6px' }}>Step {step}.</span>{title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* PWA Install CTA (only if browser supports prompt) */}
          {canPrompt && !installed && (
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '14px', padding: '16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '22px', flexShrink: 0 }}>download</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>Install as Desktop App</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>One click — creates a shortcut, works offline</p>
              </div>
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: '#fff', padding: '8px 16px',
                  borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  flexShrink: 0, opacity: installing ? 0.7 : 1
                }}
              >
                {installing ? 'Installing…' : 'Install'}
              </button>
            </div>
          )}

          {installed && (
            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>check_circle</span>
              <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                BudgetLens installed — check your desktop!
              </span>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: '#fff',
              padding: '14px', borderRadius: '12px',
              fontSize: '15px', fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              transition: 'all 0.2s'
            }}
          >
            Let's go →
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '14px 0 0' }}>
            This intro only shows once. Access Help anytime from Settings.
          </p>
        </div>
      </div>
    </div>
  );
};
