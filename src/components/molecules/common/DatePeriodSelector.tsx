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
}

export const DatePeriodSelector: React.FC<DatePeriodSelectorProps> = ({
  currentMonth,
  currentYear,
  onChange,
  showMonth = true,
}) => {
  const { colors } = useTheme();
  const locale = useLocale();
  const [selectorMode, setSelectorMode] = useState<'slider' | 'quick'>('slider');

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
    <div className="flex items-center gap-2 flex-wrap">
      {selectorMode === 'slider' ? (
        <div
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all"
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
        >
          {showMonth && (
            <select
              value={currentMonth}
              onChange={(e) => onChange(parseInt(e.target.value), currentYear)}
              className="px-2 py-1 rounded-lg border outline-none font-semibold text-xs"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString(locale, { month: 'short' })}
                </option>
              ))}
            </select>
          )}
          <select
            value={currentYear}
            onChange={(e) => onChange(currentMonth, parseInt(e.target.value))}
            className="px-2 py-1 rounded-lg border outline-none font-semibold text-xs"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Switch Mode Button */}
      <button
        type="button"
        onClick={() => setSelectorMode((prev) => (prev === 'slider' ? 'quick' : 'slider'))}
        className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:opacity-85 hover:cursor-pointer"
        style={{
          borderColor: colors.border.light,
          backgroundColor: colors.background.secondary,
          color: colors.interactive.primary,
        }}
        title={selectorMode === 'slider' ? 'Quick Jump' : 'Slider Mode'}
      >
        {selectorMode === 'slider' ? <MdSwapHoriz className="w-5 h-5" /> : <MdCalendarToday className="w-5 h-5" />}
      </button>
    </div>
  );
};
