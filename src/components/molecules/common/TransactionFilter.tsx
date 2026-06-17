'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import { MdClose, MdFilterList, MdSearch } from 'react-icons/md';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { useTranslations } from 'next-intl';

export interface TransactionFilterState {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string; // Format: dd/MM/yyyy
  endDate?: string;   // Format: dd/MM/yyyy
  search?: string;
}

interface TransactionFilterProps {
  onFilterChange: (filters: TransactionFilterState) => void;
  initialFilters?: TransactionFilterState;
}

const EXPENSE_CATEGORIES = [
  'FOOD',
  'TRANSPORTATION',
  'CLOTHING',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'SHOPPING',
  'OTHER',
];

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  onFilterChange,
  initialFilters = {},
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState<string>(initialFilters.search || '');

  // Helper to split "dd/MM/yyyy HH:mm" into separate date and time
  const parseDateTimeParam = (dateTimeStr?: string, defaultTime: string = '00:00') => {
    if (!dateTimeStr) return { date: undefined, time: defaultTime };
    const parts = dateTimeStr.trim().split(/\s+/);
    const date = parts[0];
    const time = parts[1] || defaultTime;
    return { date, time };
  };

  const [modalFilters, setModalFilters] = useState<Omit<TransactionFilterState, 'search'>>(() => {
    const start = parseDateTimeParam(initialFilters.startDate, '00:00');
    const end = parseDateTimeParam(initialFilters.endDate, '23:59');
    const filters = { ...initialFilters };
    if (start.date) filters.startDate = start.date;
    if (end.date) filters.endDate = end.date;
    return filters;
  });

  const [startTime, setStartTime] = useState<string>(() => {
    return parseDateTimeParam(initialFilters.startDate, '00:00').time;
  });
  const [endTime, setEndTime] = useState<string>(() => {
    return parseDateTimeParam(initialFilters.endDate, '23:59').time;
  });
  const [dateError, setDateError] = useState<string>('');

  const isDateTimeValid = (): boolean => {
    if (!modalFilters.startDate || !modalFilters.endDate) {
      setDateError('');
      return true; // Valid if either date is empty
    }

    // Convert dd/MM/yyyy to comparable format
    const [startDay, startMonth, startYear] = modalFilters.startDate.split('/').map(Number);
    const [endDay, endMonth, endYear] = modalFilters.endDate.split('/').map(Number);

    // Create comparable timestamps
    const startDateTime = new Date(startYear, startMonth - 1, startDay);
    const [startHour, startMin] = startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMin, 0);

    const endDateTime = new Date(endYear, endMonth - 1, endDay);
    const [endHour, endMin] = endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMin, 0);

    if (endDateTime < startDateTime) {
      setDateError(t('transactions.dateError'));
      return false;
    }

    setDateError('');
    return true;
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Update search in real-time
    onFilterChange({
      ...modalFilters,
      search: value,
    });
  };

  const handleModalFilterChange = (
    key: keyof Omit<TransactionFilterState, 'search'>,
    value: any
  ) => {
    // Format amount inputs
    if (key === 'minAmount' || key === 'maxAmount') {
      const numValue = parseFormattedNumber(value.toString());
      const newFilters = { ...modalFilters, [key]: numValue };
      setModalFilters(newFilters);
    } else {
      const newFilters = { ...modalFilters, [key]: value };
      setModalFilters(newFilters);
    }
  };

  const handleAmountInputChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const formatted = formatAmountInput(value);
    const numValue = parseFormattedNumber(formatted);
    setModalFilters(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleApplyFilters = () => {
    // Validate date/time
    if (!isDateTimeValid()) {
      return;
    }

    // Combine date and time with format: dd/MM/yyyy HH:mm
    const filtersToApply = { ...modalFilters, search };

    if (modalFilters.startDate) {
      filtersToApply.startDate = `${modalFilters.startDate} ${startTime}`;
    }
    if (modalFilters.endDate) {
      filtersToApply.endDate = `${modalFilters.endDate} ${endTime}`;
    }

    onFilterChange(filtersToApply);
    setIsModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setModalFilters({});
    setDateError('');
    setStartTime('00:00');
    setEndTime('23:59');
    onFilterChange({ search: '' });
  };

  const hasActiveFilters = Object.values(modalFilters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div
            className="flex items-center px-4 py-2.5 rounded-lg border"
            style={{
              backgroundColor: colors.surface.secondary,
              borderColor: colors.border.light,
            }}
          >
            <MdSearch className="w-5 h-5 mr-2" style={{ color: colors.text.secondary }} />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: colors.text.primary }}
            />
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => {
            const start = parseDateTimeParam(initialFilters.startDate, '00:00');
            const end = parseDateTimeParam(initialFilters.endDate, '23:59');
            setModalFilters({
              ...initialFilters,
              startDate: start.date,
              endDate: end.date,
            });
            setStartTime(start.time);
            setEndTime(end.time);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap hover:opacity-90 hover:cursor-pointer"
          style={{
            backgroundColor: colors.interactive.primary,
            color: 'white',
            border: `1px solid ${colors.interactive.primary}`,
          }}
        >
          <MdFilterList className="w-5 h-5" />
          {t('transactions.filterBtn')}
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full font-semibold" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
            }}>
              {Object.values(modalFilters).filter((v) => v).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              pointerEvents: 'auto',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ backgroundColor: colors.surface.primary, zIndex: 1000 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: colors.border.light }}
            >
              <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                {t('transactions.filterModalTitle')}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setDateError('');
                }}
                className="p-1 hover:opacity-70 transition-opacity hover:cursor-pointer"
                style={{ color: colors.text.secondary }}
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  {t('transactions.typeLabel')}
                </label>
                <div className="flex gap-2">
                  {[
                    { value: undefined, label: t('transactions.typeAll') },
                    { value: 'INCOME', label: t('transactions.typeIncome') },
                    { value: 'EXPENSE', label: t('transactions.typeExpense') },
                  ].map((option) => (
                    <button
                      key={option.value || 'all'}
                      onClick={() => handleModalFilterChange('type', option.value)}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm hover:opacity-90 hover:cursor-pointer"
                      style={{
                        backgroundColor:
                          modalFilters.type === option.value
                            ? colors.interactive.primary
                            : colors.surface.secondary,
                        color:
                          modalFilters.type === option.value
                            ? 'white'
                            : colors.text.primary,
                        border: `1px solid ${modalFilters.type === option.value
                            ? colors.interactive.primary
                            : colors.border.light
                          }`,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  {t('transactions.categoryLabel')}
                </label>
                <select
                  value={modalFilters.category || ''}
                  onChange={(e) => handleModalFilterChange('category', e.target.value || undefined)}
                  className="w-full px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                  style={{
                    backgroundColor: colors.surface.secondary,
                    borderColor: colors.border.light,
                    color: colors.text.primary,
                  }}
                >
                  <option value="">{t('transactions.allCategories')}</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  {t('transactions.amountRange')}
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      {t('transactions.minAmount')}
                    </label>
                    <input
                      type="text"
                      placeholder="0"
                      value={modalFilters.minAmount ? formatAmountInput(modalFilters.minAmount.toString()) : ''}
                      onChange={(e) => handleAmountInputChange('minAmount', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-sm hover:opacity-90 hover:cursor-pointer"
                      style={{
                        backgroundColor: colors.surface.secondary,
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      {t('transactions.maxAmount')}
                    </label>
                    <input
                      type="text"
                      placeholder="1,000,000"
                      value={modalFilters.maxAmount ? formatAmountInput(modalFilters.maxAmount.toString()) : ''}
                      onChange={(e) => handleAmountInputChange('maxAmount', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                      style={{
                        backgroundColor: colors.surface.secondary,
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  {t('transactions.dateRange')}
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      {t('transactions.fromDate')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          modalFilters.startDate
                            ? modalFilters.startDate.split('/').reverse().join('-')
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split('-');
                            handleModalFilterChange('startDate', `${day}/${month}/${year}`);
                          } else {
                            handleModalFilterChange('startDate', undefined);
                          }
                          isDateTimeValid();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                        style={{
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.light,
                          color: colors.text.primary,
                        }}
                      />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          isDateTimeValid();
                        }}
                        className="w-40 px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                        style={{
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.light,
                          color: colors.text.primary,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      {t('transactions.toDate')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          modalFilters.endDate
                            ? modalFilters.endDate.split('/').reverse().join('-')
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split('-');
                            handleModalFilterChange('endDate', `${day}/${month}/${year}`);
                          } else {
                            handleModalFilterChange('endDate', undefined);
                          }
                          isDateTimeValid();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                        style={{
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.light,
                          color: colors.text.primary,
                        }}
                      />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          isDateTimeValid();
                        }}
                        className="w-40 px-4 py-2 rounded-lg border text-sm hover:cursor-pointer"
                        style={{
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.light,
                          color: colors.text.primary,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {dateError && (
                <div
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                  }}
                >
                  {dateError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex gap-3 px-6 py-4 border-t"
              style={{ borderColor: colors.border.light }}
            >
              <button
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:cursor-pointer"
                style={{
                  backgroundColor: colors.surface.secondary,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                {t('transactions.clearAll')}
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={!!dateError}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all text-sm hover:opacity-90 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.interactive.primary }}
              >
                {t('transactions.applyFilters')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
