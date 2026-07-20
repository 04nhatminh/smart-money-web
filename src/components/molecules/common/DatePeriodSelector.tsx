'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from 'next-intl';
import { MdChevronLeft, MdChevronRight, MdSwapHoriz, MdCalendarToday } from 'react-icons/md';

interface DatePeriodSelectorProps {
  currentMonth: number;
  currentYear: number;
  onChange: (month: number, year: number) => void;
  showMonth?: boolean;
  className?: string;
}

export const DatePeriodSelector: React.FC<DatePeriodSelectorProps> = ({
  currentMonth,
  currentYear,
  onChange,
  showMonth = true,
  className = '',
}) => {
  const { colors } = useTheme();
  const locale = useLocale();
  const [selectorMode, setSelectorMode] = useState<'slider' | 'quick'>('slider');
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const handlePrev = () => {
    if (showMonth) {
      if (currentMonth === 1) {
        onChange(12, currentYear - 1);
      } else {
        onChange(currentMonth - 1, currentYear);
      }
    } else {
      onChange(currentMonth, currentYear - 1);
    }
  };

  const handleNext = () => {
    if (showMonth) {
      if (currentMonth === 12) {
        onChange(1, currentYear + 1);
      } else {
        onChange(currentMonth + 1, currentYear);
      }
    } else {
      onChange(currentMonth, currentYear + 1);
    }
  };

  const getLabel = () => {
    if (!showMonth) return `${currentYear}`;
    if (locale === 'vi') {
      return `Tháng ${currentMonth} ${currentYear}`;
    }
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(locale, { month: 'long' });
    return `${monthName} ${currentYear}`;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 relative ${className}`}>
      {/* Click-outside backdrop */}
      {(isMonthOpen || isYearOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent cursor-default"
          onClick={() => {
            setIsMonthOpen(false);
            setIsYearOpen(false);
          }}
        />
      )}

      {selectorMode === 'slider' ? (
        <div
          className="flex items-center h-10 gap-3 px-3 rounded-xl border transition-all"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 active:scale-95 hover:cursor-pointer"
            style={{
              color: colors.interactive.primary,
              backgroundColor: `${colors.interactive.primary}10`,
            }}
          >
            <MdChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold min-w-[100px] text-center select-none" style={{ color: colors.text.primary }}>
            {getLabel()}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 active:scale-95 hover:cursor-pointer"
            style={{
              color: colors.interactive.primary,
              backgroundColor: `${colors.interactive.primary}10`,
            }}
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center h-10 gap-2 px-3 rounded-xl border transition-all"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
        >
          {showMonth && (
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => {
                  setIsMonthOpen(!isMonthOpen);
                  setIsYearOpen(false);
                }}
                className="px-2.5 h-7 rounded-lg border outline-none font-semibold text-xs flex items-center justify-between gap-1.5 transition hover:opacity-80 hover:cursor-pointer min-w-[64px]"
                style={{
                  borderColor: colors.border.light,
                  backgroundColor: colors.background.primary,
                  color: colors.text.primary,
                }}
              >
                <span>{new Date(2024, currentMonth - 1).toLocaleString(locale, { month: 'short' })}</span>
                <span className="text-[8px] opacity-70">▼</span>
              </button>
              {isMonthOpen && (
                <div
                  className="absolute left-0 mt-1 w-28 max-h-56 overflow-y-auto rounded-xl border shadow-xl z-50 py-1"
                  style={{
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isSelected = m === currentMonth;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          onChange(m, currentYear);
                          setIsMonthOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected ? `${colors.interactive.primary}15` : 'transparent',
                          color: isSelected ? colors.interactive.primary : colors.text.primary,
                        }}
                      >
                        {new Date(2024, m - 1).toLocaleString(locale, { month: 'long' })}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => {
                setIsYearOpen(!isYearOpen);
                setIsMonthOpen(false);
              }}
              className="px-2.5 h-7 rounded-lg border outline-none font-semibold text-xs flex items-center justify-between gap-1.5 transition hover:opacity-80 hover:cursor-pointer min-w-[64px]"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
              }}
            >
              <span>{currentYear}</span>
              <span className="text-[8px] opacity-70">▼</span>
            </button>
            {isYearOpen && (
              <div
                className="absolute left-0 mt-1 w-24 max-h-56 overflow-y-auto rounded-xl border shadow-xl z-50 py-1"
                style={{
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                }}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => {
                  const isSelected = y === currentYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        onChange(currentMonth, y);
                        setIsYearOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isSelected ? `${colors.interactive.primary}15` : 'transparent',
                        color: isSelected ? colors.interactive.primary : colors.text.primary,
                      }}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Switch Mode Segmented Control */}
      <div
        className="flex items-center h-10 p-0.5 border text-xs gap-0.5 rounded-xl"
        style={{
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light,
        }}
      >
        <button
          type="button"
          onClick={() => setSelectorMode('slider')}
          className="px-2.5 h-full rounded-lg text-xs font-semibold transition-all hover:cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: selectorMode === 'slider' ? colors.surface.primary : 'transparent',
            color: selectorMode === 'slider' ? colors.interactive.primary : colors.text.secondary,
            boxShadow: selectorMode === 'slider' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
          title={locale === 'vi' ? 'Duyệt theo từng tháng' : 'Step month-by-month'}
        >
          <MdSwapHoriz className="w-4 h-4" />
          <span>{locale === 'vi' ? 'Từng tháng' : 'Slider'}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectorMode('quick')}
          className="px-2.5 h-full rounded-lg text-xs font-semibold transition-all hover:cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: selectorMode === 'quick' ? colors.surface.primary : 'transparent',
            color: selectorMode === 'quick' ? colors.interactive.primary : colors.text.secondary,
            boxShadow: selectorMode === 'quick' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
          title={locale === 'vi' ? 'Chọn nhanh tháng/năm' : 'Quickly select month/year'}
        >
          <MdCalendarToday className="w-4 h-4" />
          <span>{locale === 'vi' ? 'Chọn nhanh' : 'Quick Jump'}</span>
        </button>
      </div>
    </div>
  );
};
