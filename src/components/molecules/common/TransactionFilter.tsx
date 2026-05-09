'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import { MdClose, MdFilterList, MdSearch } from 'react-icons/md';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState<string>(initialFilters.search || '');
  const [modalFilters, setModalFilters] = useState<Omit<TransactionFilterState, 'search'>>(
    initialFilters
  );
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
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
      setDateError('End date/time must be after start date/time');
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
              placeholder="Search description..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: colors.text.primary }}
            />
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap hover:opacity-90 hover:cursor-pointer"
          style={{
            backgroundColor: colors.interactive.primary,
            color: 'white',
            border: `1px solid ${colors.interactive.primary}`,
          }}
        >
          <MdFilterList className="w-5 h-5" />
          Filter
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
                Filters
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
                  Transaction Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: undefined, label: 'All' },
                    { value: 'INCOME', label: 'Income' },
                    { value: 'EXPENSE', label: 'Expense' },
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
                        border: `1px solid ${
                          modalFilters.type === option.value
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
                  Category
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
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
                  Amount Range
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      Minimum Amount
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
                      Maximum Amount
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
                  Date Range
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: colors.text.secondary }}>
                      From Date & Time
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
                      To Date & Time
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
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={!!dateError}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all text-sm hover:opacity-90 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.interactive.primary }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
