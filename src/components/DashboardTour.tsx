import React, { useState, useEffect, useCallback } from 'react';

const TOUR_DONE_KEY = 'budgetlens_tour_done';

interface TourPoint {
  icon: string;
  title: string;
  text: string;
}

interface TourStep {
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  keyPoints: TourPoint[];
  position: 'bottom' | 'top' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '.tour-hero',
    badge: 'Step 1 of 5 • Money Summary',
    title: '💰 Bank Balance & Live Cash Status',
    description: 'Provides an accurate, real-time summary of your current bank balance and overall cashflow.',
    keyPoints: [
      {
        icon: 'account_balance_wallet',
        title: 'Safe-to-Spend Balance',
        text: 'The calculated total of your starting bank balance plus income minus recorded expenses.'
      },
      {
        icon: 'verified',
        title: 'Balance Status Indicator',
        text: 'Displays a green badge when your total bank balance is positive, or a red badge if your balance dips into deficit.'
      },
      {
        icon: 'payments',
        title: 'Total Money In & Out',
        text: 'Two simple summary cards showing all income received vs all expenses paid.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-quick-entry',
    badge: 'Step 2 of 5 • Fast Data Entry',
    title: '⚡ 1-Liner Quick Log Bar',
    description: 'Log daily expenses or income in seconds without leaving your keyboard.',
    keyPoints: [
      {
        icon: 'dialpad',
        title: 'Fast 4-Field Entry',
        text: 'Enter the Amount ➔ Title / Merchant ➔ optional Description ➔ pick Category & Date.'
      },
      {
        icon: 'palette',
        title: 'Dynamic Category Tinting',
        text: 'The input bar automatically updates its color accent to match your selected category.'
      },
      {
        icon: 'keyboard_return',
        title: 'Press Enter Anywhere',
        text: 'Press Enter on your keyboard at any point to record the transaction directly into your ledger.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-chart',
    badge: 'Step 3 of 5 • Visual Trends',
    title: '📊 Cash Flow Activity Chart',
    description: 'Visual breakdown showing how your money moves over days, weeks, and months.',
    keyPoints: [
      {
        icon: 'arrow_upward',
        title: 'Income Bars (Top)',
        text: 'Green bars going up show incoming money (salary, freelance, deposits).'
      },
      {
        icon: 'arrow_downward',
        title: 'Expense Bars (Bottom)',
        text: 'Red bars going down show money spent on bills, food, or shopping.'
      },
      {
        icon: 'date_range',
        title: 'Timeframe Filters',
        text: 'Easily filter chart views across 1 Month, 3 Months, 1 Year, or All time.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-donut',
    badge: 'Step 4 of 5 • Spending Breakdown',
    title: '🍩 Category Distribution Donut Chart',
    description: 'Visual breakdown showing which categories account for your largest expenditures.',
    keyPoints: [
      {
        icon: 'pie_chart',
        title: 'Categorized Slices',
        text: 'See the proportion of your spending allocated across Food, Bills, Rent, and Transport.'
      },
      {
        icon: 'touch_app',
        title: 'Interactive Inspection',
        text: 'Hover over any slice to view exact dollar amounts and percentage shares.'
      }
    ],
    position: 'top'
  },
  {
    targetSelector: 'center',
    badge: 'Step 5 of 5 • Extra Tools',
    title: '🌟 Dashboard Tools & Privacy Features',
    description: 'BudgetLens is 100% offline and browser-based to keep your data private.',
    keyPoints: [
      {
        icon: 'upload_file',
        title: 'Statement Import',
        text: 'Drop bank e-Statements (PDF, CSV, MD) to auto-extract transaction tables with verification safety.'
      },
      {
        icon: 'download',
        title: 'Export & Reset Backups',
        text: 'Export your ledger anytime to CSV or Markdown, or reset with full backup format choices.'
      },
      {
        icon: 'info',
        title: 'Info Tooltips (ℹ️)',
        text: 'Click the info icons on any section header to learn how metrics are calculated.'
      },
      {
        icon: 'currency_exchange',
        title: 'Multi-Currency Support',
        text: 'Switch your active currency code in Settings anytime (SGD, USD, EUR, GBP, etc.).'
      }
    ],
    position: 'center'
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

  // Trigger tour when manualRun changes to true
  useEffect(() => {
    if (manualRun) {
      setCurrentStepIdx(0);
      setIsOpen(true);
    }
  }, [manualRun]);

  const updateRect = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIdx];
    if (!step || step.position === 'center' || step.targetSelector === 'center') {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIdx]);

  useEffect(() => {
    updateRect();
    const handleResize = () => updateRect();
    const handleScroll = () => {
      const step = TOUR_STEPS[currentStepIdx];
      if (step && step.targetSelector !== 'center') {
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
  const isCenter = currentStep.position === 'center' || !targetRect;
  const isTop = currentStep.position === 'top';

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    width: '420px',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '20px 22px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.38), 0 0 0 1px rgba(226, 232, 240, 0.9)',
    animation: 'tourFadeScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    transition: 'top 0.25s ease, left 0.25s ease',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  if (targetRect && !isCenter) {
    const left = Math.max(16, Math.min(window.innerWidth - 440, targetRect.left + (targetRect.width / 2) - 210));
    if (isTop) {
      tooltipStyle.top = `${Math.max(16, targetRect.top - 280)}px`;
      tooltipStyle.left = `${left}px`;
    } else {
      tooltipStyle.top = `${Math.min(window.innerHeight - 320, targetRect.bottom + 12)}px`;
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
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tourPulseGlow {
          0%, 100% { box-shadow: 0 0 0 3px #10b981, 0 0 25px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 4px #059669, 0 0 35px rgba(16, 185, 129, 0.65); }
        }
      `}</style>

      {/* Dark Backdrop Mask */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(3px)',
          zIndex: 99990,
          pointerEvents: 'auto'
        }}
        onClick={handleComplete}
      />

      {/* Spotlight cutout border over the active element */}
      {targetRect && !isCenter && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '16px',
            border: '2px solid #10b981',
            zIndex: 99995,
            pointerEvents: 'none',
            animation: 'tourPulseGlow 2.5s infinite ease-in-out'
          }}
        />
      )}

      {/* Tour Step Popover Card */}
      <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
        {/* Step Badge & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid #a7f3d0'
            }}
          >
            {currentStep.badge}
          </span>
          <button
            onClick={handleComplete}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Skip Tour"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
          {currentStep.title}
        </h3>

        {/* Description */}
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>
          {currentStep.description}
        </p>

        {/* Detailed Element Breakdown (Simple & Friendly) */}
        {currentStep.keyPoints && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {currentStep.keyPoints.map((point) => (
              <div
                key={point.title}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 10px'
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: '#10b981', marginTop: '1px', flexShrink: 0 }}
                >
                  {point.icon}
                </span>
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  <strong style={{ color: '#0f172a' }}>{point.title}: </strong>
                  <span style={{ color: '#475569' }}>{point.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            style={{
              background: 'none',
              border: 'none',
              color: currentStepIdx === 0 ? '#cbd5e1' : '#475569',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: currentStepIdx === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            <span>Back</span>
          </button>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === currentStepIdx ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === currentStepIdx ? '#10b981' : '#cbd5e1',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {currentStepIdx === TOUR_STEPS.length - 1 ? 'done' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
