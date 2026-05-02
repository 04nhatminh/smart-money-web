'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose } from 'react-icons/md';

interface EditBudgetModalProps {
  isOpen: boolean;
  budgetId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  category: string;
  amountLimit: string;
  spent: string;
  month: number;
  year: number;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  isOpen,
  budgetId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const { isLoading, getBudget, updateBudget } = useBudgets();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    category: '',
    amountLimit: '',
    spent: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
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

  // Load budget data when modal opens
  useEffect(() => {
    if (isOpen && budgetId) {
      loadBudgetData();
    }
  }, [isOpen, budgetId]);

  const loadBudgetData = async () => {
    if (!budgetId) return;

    try {
      setIsLoadingData(true);
      setError(null);

      const result = await getBudget(budgetId);

      if (result.success && result.data) {
        const budget = result.data;
        setFormData({
          category: budget.category,
          amountLimit: formatAmountInput(budget.amountLimit.toString()),
          spent: formatAmountInput(budget.spent.toString()),
          month: budget.month,
          year: budget.year,
        });
      } else {
        setError(result.error || 'Failed to load budget');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load budget';
      setError(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'amountLimit' || name === 'spent') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetId) return;

    setError(null);

    if (!formData.amountLimit || parseFloat(formData.amountLimit) <= 0) {
      setError('Please enter a valid amount limit');
      return;
    }

    if (formData.spent && parseFloat(formData.spent) < 0) {
      setError('Spent cannot be negative');
      return;
    }

    try {
      const updateData: any = {
        amountLimit: parseFormattedNumber(formData.amountLimit),
      };

      if (formData.spent) {
        updateData.spent = parseFormattedNumber(formData.spent);
      }

      const result = await updateBudget(budgetId, updateData);

      if (result.success) {
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update budget');
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
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
          <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>Edit Budget</Heading>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLoadingData ? (
            <div className="text-center py-8">
              <Text style={{ color: colors.text.secondary }}>Loading...</Text>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {success && (
                <div
                  className="p-4 rounded-lg text-center"
                  style={{
                    backgroundColor: `${colors.interactive.success}20`,
                    color: colors.interactive.success,
                  }}
                >
                  <Text className="font-semibold">Budget updated successfully!</Text>
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

              {/* Category (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Category
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  disabled={true}
                />
              </div>

              {/* Amount Limit and Spent */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Amount Limit <span style={{ color: '#EF4444' }}>*</span>
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
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Spent
                  </label>
                  <Input
                    type="text"
                    name="spent"
                    value={formData.spent}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Month and Year (Read-only) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Month
                  </label>
                  <Input
                    type="text"
                    value={new Date(2024, formData.month - 1).toLocaleString('default', { month: 'short' })}
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Year
                  </label>
                  <Input
                    type="text"
                    value={formData.year}
                    disabled={true}
                  />
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
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </>
          )}
        </form>
        </div>
      </div>
    </>
  );
};
