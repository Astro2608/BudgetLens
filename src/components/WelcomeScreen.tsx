import React, { useState } from 'react';

interface WelcomeScreenProps {
  onDismiss: () => void;
  onStartTour: () => void;
}

// PWA install prompt event reference
let deferredInstallPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss, onStartTour }) => {
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
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>

      <div style={{
        width: '540px',
        maxWidth: '100%',
        backgroundColor: '#1e293b',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.56)'
      }}>
        {/* Header banner */}
        <div style={{
          padding: '32px 36px 24px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.02) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '100px',
            padding: '5px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'shimmer 2s infinite' }} />
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Simple & Private Money Tracker
            </span>
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Welcome to BudgetLens
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
            See your cash flow clearly, track daily expenses in seconds, and know how far your money takes you.
          </p>
        </div>

        {/* 3 Core Highlights */}
        <div style={{ padding: '24px 32px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {[
              {
                icon: 'lock',
                color: '#10b981',
                title: '100% Private & Offline',
                desc: 'All your finances stay locked on your device. No bank login or server storage.'
              },
              {
                icon: 'bolt',
                color: '#3b82f6',
                title: '3-Second Quick Logging',
                desc: 'Type the price, remark, category, and hit Enter. Fast and effortless.'
              },
              {
                icon: 'upload_file',
                color: '#8b5cf6',
                title: 'Smart Statement Reader',
                desc: 'Drop in monthly bank PDF or CSV statements anytime to auto-fill transactions.'
              }
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  flexShrink: 0,
                  background: `${color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>{icon}</span>
                </div>
                <div>
                  <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>{title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* PWA Install CTA if supported */}
          {canPrompt && !installed && (
            <div style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>download</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '12.5px', fontWeight: 700, margin: 0 }}>Install on your Home Screen</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>Works offline like a native app</p>
              </div>
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  opacity: installing ? 0.7 : 1
                }}
              >
                {installing ? 'Installing…' : 'Install'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={onStartTour}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(16,185,129,0.35)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
              <span>Start Quick Interactive Tour</span>
            </button>

            <button
              onClick={onDismiss}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Explore on my own
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
