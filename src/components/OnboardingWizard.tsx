import React, { useState } from 'react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'how-it-works' | 'install' | 'ready';

const STEPS: Step[] = ['welcome', 'how-it-works', 'install', 'ready'];

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isFirefox = /firefox/i.test(navigator.userAgent);
const isSafariDesktop = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !isIOS;
const isChrome = /chrome/i.test(navigator.userAgent) && !isFirefox;
const isEdge = /edg\//i.test(navigator.userAgent);

function getBrowserInfo() {
  if (isIOS) return { name: 'Safari (iOS)', canInstall: true, installMethod: 'ios' };
  if (isEdge) return { name: 'Microsoft Edge', canInstall: true, installMethod: 'prompt' };
  if (isChrome) return { name: 'Google Chrome', canInstall: true, installMethod: 'prompt' };
  if (isSafariDesktop) return { name: 'Safari (macOS)', canInstall: true, installMethod: 'safari-mac' };
  if (isFirefox) return { name: 'Mozilla Firefox', canInstall: false, installMethod: 'none' };
  return { name: 'Your Browser', canInstall: true, installMethod: 'prompt' };
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const browser = getBrowserInfo();
  const stepIdx = STEPS.indexOf(step);

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1]);
  };
  const prev = () => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Step dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            width: i === stepIdx ? '24px' : '8px', height: '8px',
            borderRadius: '4px',
            background: i === stepIdx ? '#10b981' : i < stepIdx ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '560px', maxWidth: '90vw',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '48px',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 1,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)'
      }}>

        {/* STEP 1: WELCOME */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 40px rgba(16,185,129,0.35)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#fff' }}>lens</span>
            </div>
            <p style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Welcome to
            </p>
            <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.1 }}>
              BudgetLens
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '28px' }}>
              Cash Flow in Focus
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', lineHeight: 1.7, marginBottom: '0' }}>
              A personal finance dashboard that helps you understand where your money goes, how long it lasts, and what's ahead. No cloud. No subscription. Just clarity.
            </p>
          </div>
        )}

        {/* STEP 2: HOW IT WORKS */}
        {step === 'how-it-works' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>How BudgetLens Works</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '32px' }}>Three things to know before you dive in</p>

            {[
              { icon: 'storage', color: '#10b981', title: 'Your data stays on-device', desc: 'All transactions are stored in your browser\'s local storage (IndexedDB). Nothing leaves your device — no server, no account needed.' },
              { icon: 'upload_file', color: '#6366f1', title: 'Import bank statements', desc: 'Drag in CSV files from your bank or type entries manually. BudgetLens auto-categorizes income, food, transport, and more.' },
              { icon: 'downloading', color: '#f59e0b', title: 'Export anytime', desc: 'Download your data as a Markdown or CSV file anytime. You own your data — open it in Obsidian, Excel, or any text editor.' },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color }}>{icon}</span>
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>{title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: INSTALL */}
        {step === 'install' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Install as a Desktop App</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '28px' }}>
              You're using <strong style={{ color: '#fff' }}>{browser.name}</strong>. Here's what you can do:
            </p>

            {/* Feature table */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { feature: 'Add to Desktop / Home Screen', supported: browser.canInstall },
                { feature: 'Works offline (cached)', supported: true },
                { feature: 'Data persists between sessions', supported: true },
                { feature: 'File System API (auto-sync)', supported: !isFirefox && !isIOS },
                { feature: 'Native install prompt', supported: isChrome || isEdge },
              ].map(({ feature, supported }, i) => (
                <div key={feature} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 16px',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{feature}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                    background: supported ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                    color: supported ? '#10b981' : '#ef4444'
                  }}>
                    {supported ? '✓ YES' : '✗ NO'}
                  </span>
                </div>
              ))}
            </div>

            {/* Install instructions */}
            {browser.installMethod === 'ios' && (
              <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>📱 iOS Safari Install</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                  Tap the <strong style={{ color: '#fff' }}>Share</strong> button (box with arrow) → <strong style={{ color: '#fff' }}>Add to Home Screen</strong> → BudgetLens appears as an app icon.
                </p>
              </div>
            )}
            {(browser.installMethod === 'prompt') && (
              <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>🖥️ Chrome / Edge Install</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                  Look for the <strong style={{ color: '#fff' }}>install icon (⊕)</strong> in the address bar, or go to the browser menu → <strong style={{ color: '#fff' }}>Install BudgetLens</strong>. A desktop shortcut will be created automatically.
                </p>
              </div>
            )}
            {browser.installMethod === 'none' && (
              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>ℹ️ Firefox Note</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                  Firefox doesn't support PWA install to desktop. BudgetLens still works fully in the browser — just bookmark it! For the desktop shortcut experience, open in <strong style={{ color: '#fff' }}>Chrome or Edge</strong>.
                </p>
              </div>
            )}
            {browser.installMethod === 'safari-mac' && (
              <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>🍎 Safari (macOS) Install</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                  Go to <strong style={{ color: '#fff' }}>File → Add to Dock</strong> to install BudgetLens as a native-looking macOS app.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: READY */}
        {step === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 50px rgba(16,185,129,0.4)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#fff' }}>rocket_launch</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '30px', fontWeight: 800, margin: '0 0 12px' }}>You're all set!</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7, marginBottom: '32px' }}>
              Your dashboard is ready. Start by setting your opening balance, then add or import your transactions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '8px' }}>
              {[
                { num: '1', text: 'Go to ⚙️ Settings → set your opening cash balance' },
                { num: '2', text: 'Add a transaction manually or drag in a bank CSV' },
                { num: '3', text: 'Watch your runway update in real time' },
              ].map(({ num, text }) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#10b981', fontSize: '12px', fontWeight: 800
                  }}>{num}</div>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px' }}>
          <button
            onClick={prev}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.45)', padding: '10px 20px',
              borderRadius: '10px', cursor: stepIdx === 0 ? 'default' : 'pointer',
              fontSize: '13px', fontWeight: 600,
              opacity: stepIdx === 0 ? 0 : 1, pointerEvents: stepIdx === 0 ? 'none' : 'auto',
              transition: 'all 0.2s'
            }}
          >
            ← Back
          </button>

          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
            {stepIdx + 1} of {STEPS.length}
          </span>

          {step !== 'ready' ? (
            <button
              onClick={next}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', padding: '10px 24px',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
                boxShadow: '0 4px 15px rgba(16,185,129,0.35)',
                transition: 'all 0.2s'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onComplete}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', padding: '12px 28px',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 800,
                boxShadow: '0 4px 20px rgba(16,185,129,0.45)',
                transition: 'all 0.2s'
              }}
            >
              Launch Dashboard →
            </button>
          )}
        </div>
      </div>

      {/* Skip link */}
      {step !== 'ready' && (
        <button
          onClick={onComplete}
          style={{
            marginTop: '24px', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.2)', fontSize: '12px', cursor: 'pointer',
            position: 'relative', zIndex: 1
          }}
        >
          Skip intro
        </button>
      )}
    </div>
  );
};
