import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DateWheelPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (newDate: string) => void;
  accentColor?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026, 2027];
const ITEM_HEIGHT = 36; // px per drum wheel item
const VISIBLE_ITEMS = 5;

export const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  value,
  onChange,
  accentColor = '#0d9488'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 1-12
  const [selectedDay, setSelectedDay] = useState<number>(14);

  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3) {
        setSelectedYear(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedDay(parts[2]);
      }
    }
  }, [value]);

  // Days in selected month & year
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Sync back to parent
  const emitDate = useCallback((y: number, m: number, d: number) => {
    const validDay = Math.min(d, new Date(y, m, 0).getDate());
    const mm = String(m).padStart(2, '0');
    const dd = String(validDay).padStart(2, '0');
    onChange(`${y}-${mm}-${dd}`);
  }, [onChange]);

  const updateYear = (y: number) => {
    setSelectedYear(y);
    emitDate(y, selectedMonth, selectedDay);
  };

  const updateMonth = (m: number) => {
    setSelectedMonth(m);
    emitDate(selectedYear, m, selectedDay);
  };

  const updateDay = (d: number) => {
    setSelectedDay(d);
    emitDate(selectedYear, selectedMonth, d);
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format label for display
  const getDisplayLabel = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (value === todayStr) return 'Today';
    if (value === yesterdayStr) return 'Yesterday';

    const monthStr = MONTH_NAMES[selectedMonth - 1] || '';
    return `${selectedDay} ${monthStr}`;
  };

  const setOffsetDays = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(day);
    emitDate(y, m, day);
  };

  // Wheel Column Component for Drum Roll
  const DrumWheel = ({
    items,
    selectedVal,
    onSelect,
    formatItem
  }: {
    items: number[];
    selectedVal: number;
    onSelect: (val: number) => void;
    formatItem?: (val: number) => string;
  }) => {
    const colRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const currentIndex = items.indexOf(selectedVal);
      if (currentIndex === -1) return;

      if (e.deltaY > 0 && currentIndex < items.length - 1) {
        onSelect(items[currentIndex + 1]);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        onSelect(items[currentIndex - 1]);
      }
    };

    // Auto center scroll on selected
    useEffect(() => {
      const idx = items.indexOf(selectedVal);
      if (colRef.current && idx !== -1) {
        colRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }, [selectedVal, items]);

    return (
      <div
        onWheel={handleWheel}
        style={{
          position: 'relative',
          height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`,
          flex: 1,
          overflow: 'hidden',
          cursor: 'grab'
        }}
      >
        <div
          ref={colRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            paddingTop: `${ITEM_HEIGHT * 2}px`,
            paddingBottom: `${ITEM_HEIGHT * 2}px`,
            boxSizing: 'content-box'
          }}
        >
          {items.map((item) => {
            const isSelected = item === selectedVal;
            const diff = Math.abs(items.indexOf(item) - items.indexOf(selectedVal));
            const opacity = isSelected ? 1 : Math.max(0.45, 0.9 - diff * 0.2);
            const scale = isSelected ? 1.08 : Math.max(0.88, 1 - diff * 0.06);

            return (
              <div
                key={item}
                onClick={() => onSelect(item)}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isSelected ? '14px' : '13px',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? accentColor : 'var(--text-main)',
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  scrollSnapAlign: 'center',
                  userSelect: 'none'
                }}
              >
                {formatItem ? formatItem(item) : item}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Trigger Button Chip */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '38px',
          padding: '0 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: isOpen ? `1.5px solid ${accentColor}` : '1px solid var(--border-subtle)',
          backgroundColor: isOpen ? `${accentColor}12` : 'var(--bg-canvas-subtle)',
          color: 'var(--text-main)',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          outline: 'none',
          whiteSpace: 'nowrap',
          boxSizing: 'border-box'
        }}
        title="Click to open modern scroll wheel date picker"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '17px', color: accentColor }}>
          event
        </span>
        <span>{getDisplayLabel()}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {selectedDay} {MONTH_NAMES[selectedMonth - 1]}
        </span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease'
          }}
        >
          expand_more
        </span>
      </button>

      {/* Floating 3D Scroll Wheel Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1050,
            width: '260px',
            backgroundColor: 'var(--bg-card)',
            border: `1px solid var(--border-subtle)`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 30px -4px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.06)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Popover Header & Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Scroll Wheel Date
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setOffsetDays(0)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-canvas-subtle)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setOffsetDays(-1)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-canvas-subtle)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Drum Roll Columns (Day | Month | Year) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
          >
            {/* Center Active Lens Highlight */}
            <div
              style={{
                position: 'absolute',
                top: `${ITEM_HEIGHT * 2}px`,
                left: 0,
                right: 0,
                height: `${ITEM_HEIGHT}px`,
                backgroundColor: `${accentColor}18`,
                borderTop: `1px solid ${accentColor}40`,
                borderBottom: `1px solid ${accentColor}40`,
                pointerEvents: 'none',
                zIndex: 1
              }}
            />

            {/* Top & Bottom Vignette Mask */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${ITEM_HEIGHT * 1.5}px`,
                background: 'linear-gradient(to bottom, var(--bg-canvas-subtle) 20%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 2
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${ITEM_HEIGHT * 1.5}px`,
                background: 'linear-gradient(to top, var(--bg-canvas-subtle) 20%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 2
              }}
            />

            {/* Wheel 1: Day */}
            <DrumWheel
              items={daysArray}
              selectedVal={selectedDay}
              onSelect={updateDay}
            />

            {/* Wheel 2: Month */}
            <DrumWheel
              items={Array.from({ length: 12 }, (_, i) => i + 1)}
              selectedVal={selectedMonth}
              onSelect={updateMonth}
              formatItem={(m) => MONTH_NAMES[m - 1]}
            />

            {/* Wheel 3: Year */}
            <DrumWheel
              items={YEARS}
              selectedVal={selectedYear}
              onSelect={updateYear}
            />
          </div>

          {/* Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>
              Spin wheel or click item
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
