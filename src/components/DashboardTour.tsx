import React, { useState, useEffect, useCallback } from 'react';

const TOUR_DONE_KEY = 'budgetlens_tour_done';

interface TourStep {
  targetSelector: string;
  title: string;
  badge: string;
  description: string;
  position: 'bottom' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '.tour-hero',
    badge: 'Step 1 of 3 • Money Summary',
    title: '💰 Your Bank Balance & Totals',
    description: 'Here you see your Total Balance, Money In (Income), and Money Out (Expenses). Click the "+ Add Transaction" button here anytime to record new spending or income.',
    position: 'bottom'
  },
  {
    targetSelector: '.tour-chart',
    badge: 'Step 2 of 3 • Visual Graph',
    title: '📊 Income vs Spending Chart',
    description: 'This chart shows where your money goes over time. Green is income, and colored bars show your spending by category. Move your mouse over any bar to see the details.',
    position: 'bottom'
  },
  {
    targetSelector: '.tour-ledger',
    badge: 'Step 3 of 3 • Transaction List',
    title: '📝 Your Activity List',
    description: 'All your past transactions are stored here. You can search by name, filter by income or expenses, and edit or delete any item with one click.',
    position: 'top'
  }
];

interface DashboardTourProps {
  manualRun?: boolean;
  onTourEnd?: () => void;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ manualRun = false, onTourEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check whether to auto-run on first install/session
  useEffect(() => {
    if (manualRun) {
      setCurrentStepIdx(0);
      setIsOpen(true);
      return;
    }
    const isDone = localStorage.getItem(TOUR_DONE_KEY);
    if (!isDone) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [manualRun]);

  const updateRect = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIdx];
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, currentStepIdx]);

  useEffect(() => {
    updateRect();
    const handleResize = () => updateRect();
    const handleScroll = () => {
      const step = TOUR_STEPS[currentStepIdx];
      if (step) {
        const el = document.querySelector(step.targetSelector);
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateRect, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_DONE_KEY, 'true');
    setIsOpen(false);
    onTourEnd?.();
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIdx];

  // Calculate tooltip position relative to viewport
  const padding = 12;
  const isTop = currentStep.position === 'top';
  
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    width: '360px',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px 24px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
    animation: 'tourFadeScale 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    transition: 'top 0.3s ease, left 0.3s ease'
  };

  if (targetRect) {
    const left = Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180));
    if (isTop) {
      tooltipStyle.top = `${Math.max(16, targetRect.top - 210)}px`;
      tooltipStyle.left = `${left}px`;
    } else {
      tooltipStyle.top = `${Math.min(window.innerHeight - 230, targetRect.bottom + padding)}px`;
      tooltipStyle.left = `${left}px`;
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <style>{`
        @keyframes tourFadeScale {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tourPulseGlow {
          0%, 100% { box-shadow: 0 0 0 3px #6366f1, 0 0 25px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 4px #818cf8, 0 0 35px rgba(99, 102, 241, 0.65); }
        }
      `}</style>

      {/* Dark Backdrop Mask with Spotlight Cutout */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.68)',
          backdropFilter: 'blur(2px)',
          zIndex: 99990,
          pointerEvents: 'auto',
          transition: 'all 0.3s ease'
        }}
        onClick={handleComplete}
      />

      {/* Spotlight cutout around the target element */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 99995,
            border: '2px solid #6366f1',
            animation: 'tourPulseGlow 2s infinite ease-in-out',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div style={tooltipStyle}>
        {/* Step Badge & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: '#e0e7ff',
            color: '#4338ca'
          }}>
            {currentStep.badge}
          </span>
          <button
            onClick={handleComplete}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close Tutorial"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Title & Description */}
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          {currentStep.title}
        </h3>
        <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
          {currentStep.description}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleComplete}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Skip Tutorial
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)'
              }}
            >
              <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {currentStepIdx === TOUR_STEPS.length - 1 ? 'check' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
