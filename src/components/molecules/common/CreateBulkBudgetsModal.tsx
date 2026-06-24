'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { formatAmountInput, parseFormattedNumber, formatVietnamsePrice } from '@/lib/format';
import { useTranslations } from 'next-intl';
import { MdClose, MdAdd, MdDelete } from 'react-icons/md';

interface CreateBulkBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentMonth?: number;
  currentYear?: number;
  aiSuggestions?: Array<{
    category: string;
    suggestedAmount: number;
  }>;
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

interface BudgetItem {
  category: BudgetCategory;
  amountLimit: string;
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

export const CreateBulkBudgetsModal: React.FC<CreateBulkBudgetsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentMonth,
  currentYear,
  aiSuggestions = [],
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { isLoading, createBulkBudgets } = useBudgets();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date();
  const defaultMonth = currentMonth || today.getMonth() + 1;
  const defaultYear = currentYear || today.getFullYear();

  const [month, setMonth] = useState<number>(defaultMonth);
  const [year, setYear] = useState<number>(defaultYear);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { category: 'FOOD', amountLimit: '' },
  ]);

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

  const handleCategoryChange = (index: number, category: BudgetCategory) => {
    setBudgetItems(prev => {
      const newItems = [...prev];
      newItems[index].category = category;
      return newItems;
    });
  };

  const handleAmountChange = (index: number, value: string) => {
    const formatted = formatAmountInput(value);
    setBudgetItems(prev => {
      const newItems = [...prev];
      newItems[index].amountLimit = formatted;
      return newItems;
    });
  };

  const handleAddBudget = () => {
    setBudgetItems(prev => [
      ...prev,
      { category: 'OTHER', amountLimit: '' },
    ]);
  };

  const handleRemoveBudget = (index: number) => {
    if (budgetItems.length > 1) {
      setBudgetItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleApplyAISuggestions = () => {
    if (aiSuggestions.length === 0) return;

    const newItems: BudgetItem[] = aiSuggestions.map(suggestion => ({
      category: suggestion.category as BudgetCategory,
      amountLimit: formatVietnamsePrice(suggestion.suggestedAmount).replace(/[^\d.]/g, ''),
    }));

    setBudgetItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (budgetItems.length === 0) {
      setError('Please add at least one budget');
      return;
    }

    const invalidItems = budgetItems.filter(
      item => !item.category || !item.amountLimit || parseFloat(item.amountLimit) <= 0
    );

    if (invalidItems.length > 0) {
      setError('Please fill in all budget items with valid amounts');
      return;
    }

    // Check for duplicate categories
    const categories = budgetItems.map(item => item.category);
    const duplicates = categories.filter((cat, idx) => categories.indexOf(cat) !== idx);
    if (duplicates.length > 0) {
      setError(`Duplicate category: ${duplicates[0]}. Each category must be unique.`);
      return;
    }

    try {
      const result = await createBulkBudgets({
        month,
        year,
        budgets: budgetItems.map(item => ({
          category: item.category,
          amountLimit: parseFormattedNumber(item.amountLimit),
        })),
      });

      if (result.success) {
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to create budgets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  const availableCategories = BUDGET_CATEGORIES.filter(
    cat => !budgetItems.some(item => item.category === cat) || budgetItems.some(item => item.category === cat)
  );

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
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0">
              Create Multiple Budgets
            </Heading>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Success Message */}
            {success && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: `${colors.interactive.success}20`,
                  color: colors.interactive.success,
                }}
              >
                <Text className="font-semibold">Budgets created successfully!</Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert message={error} type="error" onClose={() => setError(null)} />
            )}

            {/* Month and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Month <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2024, m - 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Year <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Suggestions Button */}
            {aiSuggestions.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyAISuggestions}
                disabled={isLoading}
                className="w-full"
              >
                Apply AI Suggestions ({aiSuggestions.length} items)
              </Button>
            )}

            {/* Budget Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>
                  Budgets <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <Text variant="caption" style={{ color: colors.text.secondary }}>
                  {budgetItems.length} item(s)
                </Text>
              </div>

              {budgetItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: colors.text.primary }}>
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleCategoryChange(index, e.target.value as BudgetCategory)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                        style={{
                          borderColor: colors.border.light,
                          backgroundColor: colors.background.primary,
                          color: colors.text.primary,
                        }}
                      >
                        {BUDGET_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: colors.text.primary }}>
                        Amount Limit
                      </label>
                      <Input
                        type="text"
                        value={item.amountLimit}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Remove Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBudget(index)}
                        disabled={isLoading || budgetItems.length === 1}
                        className="w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: `${colors.interactive.danger}20`,
                          color: colors.interactive.danger,
                          opacity: isLoading || budgetItems.length === 1 ? 0.5 : 1,
                        }}
                      >
                        <MdDelete className="w-4 h-4" />
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <button
                type="button"
                onClick={handleAddBudget}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center gap-2"
                style={{
                  borderColor: colors.interactive.primary,
                  color: colors.interactive.primary,
                  backgroundColor: `${colors.interactive.primary}05`,
                }}
              >
                <MdAdd className="w-5 h-5" />
                <span>Add Another Budget</span>
              </button>
            </div>

            {/* Summary */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: `${colors.interactive.primary}10`,
                borderLeft: `4px solid ${colors.interactive.primary}`,
              }}
            >
              <Text variant="caption" style={{ color: colors.text.secondary }}>
                Total budgets to create: <span style={{ fontWeight: 'bold', color: colors.text.primary }}>{budgetItems.length}</span>
              </Text>
              <Text variant="caption" style={{ color: colors.text.secondary }}>
                Total amount: <span style={{ fontWeight: 'bold', color: colors.text.primary }}>
                  {formatVietnamsePrice(
                    budgetItems.reduce((sum, item) => sum + parseFormattedNumber(item.amountLimit), 0)
                  )}
                </span>
              </Text>
            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t sticky bottom-0" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
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
              onClick={handleSubmit}
            >
              {isLoading ? 'Creating...' : `Create ${budgetItems.length} Budgets`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
