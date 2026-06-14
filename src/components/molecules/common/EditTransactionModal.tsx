'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose } from 'react-icons/md';

interface EditTransactionModalProps {
  isOpen: boolean;
  transactionId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type TransactionType = 'INCOME' | 'EXPENSE';
type TransactionCategory =
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
  amount: string;
  type: TransactionType;
  category: TransactionCategory | null;
  description: string;
  date: string;
}

const TRANSACTION_TYPES: TransactionType[] = ['INCOME', 'EXPENSE'];
const TRANSACTION_CATEGORIES: TransactionCategory[] = [
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

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transactionId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const { isLoading, error: apiError, getTransaction, updateTransaction } = useTransactions();
  const [isLoading2, setIsLoading2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    type: 'EXPENSE',
    category: 'FOOD',
    description: '',
    date: '',
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

  // Load transaction data when modal opens
  useEffect(() => {
    if (isOpen && transactionId) {
      loadTransactionData();
    }
  }, [isOpen, transactionId]);

  const loadTransactionData = async () => {
    if (!transactionId) return;

    try {
      setIsLoadingData(true);
      setError(null);

      const result = await getTransaction(transactionId);

      if (result.success && result.data) {
        const tx = result.data;
        setFormData({
          amount: formatAmountInput(tx.amount.toString()),
          type: tx.type as TransactionType,
          // Always keep category value from DB
          category: tx.category as TransactionCategory || 'OTHER',
          description: tx.description || '',
          date: tx.date,
        });
      } else {
        setError(result.error || 'Failed to load transaction');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transaction';
      setError(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      // Use handleTypeChange for type changes
      return;
    }
    
    // Format amount input when it's the amount field
    if (name === 'amount') {
      const formatted = formatAmountInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      type: value as TransactionType,
      // Always set a category (API requires it)
      // For INCOME, use 'OTHER' as default
      category: value === 'INCOME' ? 'OTHER' : 'FOOD',
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    const amount = parseFormattedNumber(formData.amount);
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!formData.type) {
      setError('Transaction type is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.date) {
      setError('Date is required');
      return false;
    }

    // Validate date format: dd/mm/yyyy hh:mm
    const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
    if (!dateRegex.test(formData.date)) {
      setError('Date format must be dd/mm/yyyy hh:mm');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !transactionId) {
      return;
    }

    try {
      setIsLoading2(true);
      setError(null);

      const result = await updateTransaction(transactionId, {
        amount: parseFormattedNumber(formData.amount),
        type: formData.type,
        category: formData.category || undefined, // Always send category (API requires it)
        description: formData.description || undefined,
        date: formData.date,
      });

      if (result.success) {
        setSuccess(true);

        // Close modal after 1.5 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update transaction');
      }
    } finally {
      setIsLoading2(false);
    }
  };

  if (!isOpen) return null;

  if (isLoadingData) {
    return (
      <>
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
        />
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 1000 }}>
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 pointer-events-auto"
            style={{ backgroundColor: colors.background.primary }}
          >
            <Text style={{ color: colors.text.primary }}>Loading transaction...</Text>
          </div>
        </div>
      </>
    );
  }

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
          className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b sticky top-0"
            style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}
          >
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>
              Edit Transaction
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{
                color: colors.text.secondary,
                backgroundColor: `${colors.interactive.primary}10`,
              }}
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
                <Text className="font-semibold">Transaction updated successfully!</Text>
              </div>
            )}

            {/* Error Message */}
            {(error || apiError) && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: `${colors.interactive.danger}20`,
                  color: colors.interactive.danger,
                }}
              >
                <Text className="font-semibold">{error || apiError}</Text>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Amount <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <Input
                type="text"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Type <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                {TRANSACTION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type === 'INCOME' ? 'Income' : 'Expense'}
                  </option>
                ))}
              </select>
            </div>

            {/* Category - Only shown for EXPENSE */}
            {formData.type === 'EXPENSE' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Category <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                    color: colors.text.primary,
                  }}
                >
                  {TRANSACTION_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Date & Time <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <Input
                type="text"
                name="date"
                placeholder="dd/mm/yyyy hh:mm"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
              <Text className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                Format: dd/mm/yyyy hh:mm (e.g., 15/03/2024 14:30)
              </Text>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Description
              </label>
              <textarea
                name="description"
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              />
              <Text className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                {formData.description.length}/500 characters
              </Text>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading2}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                disabled={isLoading2}
              >
                {isLoading2 ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
