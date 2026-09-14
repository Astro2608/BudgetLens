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
    description: 'This gives you a clear, live overview of where your real money stands right now.',
    keyPoints: [
      {
        icon: 'account_balance_wallet',
        title: 'Safe-to-Spend Balance',
        text: 'The true amount of cash you have available in your pocket right now.'
      },
      {
        icon: 'verified',
        title: 'Surplus vs Deficit Badge',
        text: 'A green badge means you are safe with money to spare; red warns you if spending went over.'
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
    description: 'Log your daily expenses in just 3 seconds without leaving the keyboard.',
    keyPoints: [
      {
        icon: 'dialpad',
        title: 'Natural 4-Step Flow',
        text: 'Type the Price ➔ add a Remark (like Lunch) ➔ pick Category ➔ pick Date.'
      },
      {
        icon: 'palette',
        title: 'Dynamic Color Tint',
        text: 'The box changes color to match your category (Green for Income, Red for Bills, Teal for General).'
      },
      {
        icon: 'event',
        title: 'Scroll Wheel Date Picker',
        text: 'Click the date chip to spin the 3D scroll wheel, or tap Today or Yesterday.'
      },
      {
        icon: 'keyboard_return',
        title: 'Press Enter Anywhere',
        text: 'Hit Enter on your keyboard to instantly record the transaction into your ledger.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-chart',
    badge: 'Step 3 of 5 • Visual Trends',
    title: '📊 How to Read Your Cash Flow Chart',
    description: 'A visual picture of how your money moves over days and months.',
    keyPoints: [
      {
        icon: 'arrow_upward',
        title: 'Bars on Top (+)',
        text: 'Green bars going up show money received (salary, freelance, deposits).'
      },
      {
        icon: 'arrow_downward',
        title: 'Bars on Bottom (-)',
        text: 'Red bars dipping down show money spent on bills, food, or shopping.'
      },
      {
        icon: 'savings',
        title: 'Net Savings Line',
        text: 'Shows how much real money you kept in your pocket during that time.'
      },
      {
        icon: 'date_range',
        title: 'Time Buttons',
        text: 'Easily switch views between 1 Month, 3 Months, or 1 Year.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-donut',
    badge: 'Step 4 of 5 • Spending Slices',
    title: '🍩 Where Your Money Goes (Pie Chart)',
    description: 'A colorful breakdown showing which categories take up the biggest chunk of your money.',
    keyPoints: [
      {
        icon: 'pie_chart',
        title: 'Spending Slices',
        text: 'See the percentage of your spending divided across Bills, Food, Transport, and Savings.'
      },
      {
        icon: 'donut_large',
        title: 'Double Ring View',
        text: 'Outer ring shows every category; inner ring groups essentials vs extras.'
      },
      {
        icon: 'touch_app',
        title: 'Hover to See Details',
        text: 'Hover or tap any slice to see the exact dollar amount and percentage.'
      }
    ],
    position: 'top'
  },
  {
    targetSelector: 'center',
    badge: 'Step 5 of 5 • Extra Features',
    title: '🌟 Bonus Features & Helpful Tips',
    description: 'BudgetLens includes extra smart tools to make managing money simple and private.',
    keyPoints: [
      {
        icon: 'upload_file',
        title: 'Attach e-Statement',
        text: 'Drop bank PDFs (DBS, OCBC, UOB) or CSVs anytime to auto-import transactions.'
      },
      {
        icon: 'hourglass_bottom',
        title: 'Category Lifespan',
        text: 'Tells you how many months your savings will last under current spending habits.'
      },
      {
        icon: 'info',
        title: 'Helpful Info Icons (ℹ️)',
        text: 'Every single card on this dashboard has an info button explaining how it works.'
      },
      {
        icon: 'currency_exchange',
        title: 'Currency Switcher',
        text: 'Change your currency at the top right anytime (SGD, USD, EUR, and more).'
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
