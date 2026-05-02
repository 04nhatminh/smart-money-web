'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { useTranslations } from 'next-intl';
import { MdClose } from 'react-icons/md';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentMonth?: number;
  currentYear?: number;
}

type BudgetCategory =
  | 'FOOD'
  | 'TRANSPORTATION'
  | 'CLOTHING'
  | 'UTILITIES'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'SHOPPING'
  | 'OTHER';

interface FormData {
  category: BudgetCategory | null;
  amountLimit: string;
  month: number;
  year: number;
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
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

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentMonth,
  currentYear,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { isLoading, createBudget } = useBudgets();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date();
  const defaultMonth = currentMonth || today.getMonth() + 1;
  const defaultYear = currentYear || today.getFullYear();

  const [formData, setFormData] = useState<FormData>({
    category: 'FOOD',
    amountLimit: '',
    month: defaultMonth,
    year: defaultYear,
  });

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'amountLimit') {
      const formatted = formatAmountInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted,
      }));
    } else if (name === 'month' || name === 'year') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCategoryChange = (category: BudgetCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (!formData.amountLimit || parseFloat(formData.amountLimit) <= 0) {
      setError('Please enter a valid amount limit');
      return;
    }

    try {
      const result = await createBudget({
        category: formData.category,
        amountLimit: parseFormattedNumber(formData.amountLimit),
        month: formData.month,
        year: formData.year,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          category: 'FOOD',
          amountLimit: '',
          month: defaultMonth,
          year: defaultYear,
        });

        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to create budget');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
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
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 rounded-t-lg" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
          <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>Create Budget</Heading>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{
              color: colors.text.secondary,
              backgroundColor: `${colors.interactive.primary}10`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}20`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`}
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Success Message */}
            {success && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: `${colors.interactive.success}20`,
                  color: colors.interactive.success,
                }}
              >
                <Text className="font-semibold">Budget created successfully!</Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: `${colors.interactive.danger}20`,
                  color: colors.interactive.danger,
                }}
              >
                <Text className="font-semibold">{error}</Text>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Category <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUDGET_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className="px-2 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: formData.category === cat ? colors.background.primary : colors.background.secondary,
                      color: formData.category === cat ? colors.text.primary : colors.text.secondary,
                      border: formData.category === cat ? `2px solid ${colors.border.dark}` : `1px solid ${colors.border.light}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Limit */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Amount Limit <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <Input
                type="text"
                name="amountLimit"
                value={formData.amountLimit}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isLoading}
                required
              />
            </div>

            {/* Month and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Month <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Year <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
