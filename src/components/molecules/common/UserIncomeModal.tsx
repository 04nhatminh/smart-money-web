'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useUserIncome } from '@/hooks/useUserIncome';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { useTranslations } from 'next-intl';
import { MdClose } from 'react-icons/md';

interface UserIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  netIncome: string;
  usableIncome: string;
  currency: string;
  calculationNote: string;
  autoInvestSurplus: boolean;
}

export const UserIncomeModal: React.FC<UserIncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { isLoading, createUserIncome, updateUserIncome, getUserIncome } = useUserIncome();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    netIncome: '',
    usableIncome: '',
    currency: 'VND',
    calculationNote: '',
    autoInvestSurplus: false,
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

  // Load existing user income when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserIncome();
    }
  }, [isOpen]);

  const loadUserIncome = async () => {
    const result = await getUserIncome();
    if (result.success && result.data) {
      const income = result.data;
      setFormData({
        netIncome: income.netIncome?.toString() || '',
        usableIncome: income.usableIncome?.toString() || '',
        currency: income.currency || 'VND',
        calculationNote: income.calculationNote || '',
        autoInvestSurplus: income.autoInvestSurplus || false,
      });
      setIsEditMode(true);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'netIncome' || name === 'usableIncome') {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.netIncome || parseFloat(formData.netIncome) <= 0) {
      setError('Please enter a valid net income');
      return;
    }

    if (!formData.usableIncome || parseFloat(formData.usableIncome) <= 0) {
      setError('Please enter a valid usable income');
      return;
    }

    if (!formData.currency) {
      setError('Please select a currency');
      return;
    }

    try {
      const requestData = {
        netIncome: parseFormattedNumber(formData.netIncome),
        usableIncome: parseFormattedNumber(formData.usableIncome),
        currency: formData.currency,
        calculationNote: formData.calculationNote || undefined,
        autoInvestSurplus: formData.autoInvestSurplus,
      };

      let result;
      if (isEditMode) {
        result = await updateUserIncome(requestData);
      } else {
        result = await createUserIncome(requestData);
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to save user income');
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
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0">
              {isEditMode ? 'Edit User Income' : 'Create User Income'}
            </Heading>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="Close modal"
            >
              <MdClose size={24} style={{ color: colors.text.secondary }} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Success Message */}
            {success && (
              <div
                className="p-3 rounded-lg text-center"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                }}
              >
                <Text className="font-semibold">
                  {isEditMode ? 'User income updated successfully!' : 'User income created successfully!'}
                </Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-center"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                }}
              >
                <Text className="font-semibold">{error}</Text>
              </div>
            )}

            {/* Net Income */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Net Income *
              </label>
              <Input
                type="text"
                name="netIncome"
                value={formData.netIncome}
                onChange={handleInputChange}
                placeholder="Enter net income"
                disabled={isLoading}
              />
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                Your total monthly earnings
              </Text>
            </div>

            {/* Usable Income */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Usable Income *
              </label>
              <Input
                type="text"
                name="usableIncome"
                value={formData.usableIncome}
                onChange={handleInputChange}
                placeholder="Enter usable income"
                disabled={isLoading}
              />
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                Amount available for spending after taxes and deductions
              </Text>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="VND">VND (Vietnamese Đồng)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="JPY">JPY (Japanese Yen)</option>
                <option value="CNY">CNY (Chinese Yuan)</option>
                <option value="THB">THB (Thai Baht)</option>
                <option value="SGD">SGD (Singapore Dollar)</option>
                <option value="MYR">MYR (Malaysian Ringgit)</option>
              </select>
            </div>

            {/* Calculation Note */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Calculation Note
              </label>
              <textarea
                name="calculationNote"
                value={formData.calculationNote}
                onChange={handleInputChange}
                placeholder="E.g., Calculated from salary minus taxes and deductions"
                disabled={isLoading}
                maxLength={255}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border resize-none transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              />
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                {formData.calculationNote.length}/255
              </Text>
            </div>

            {/* Auto Invest Surplus */}
            <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: colors.background.secondary }}>
              <input
                type="checkbox"
                name="autoInvestSurplus"
                id="autoInvestSurplus"
                checked={formData.autoInvestSurplus}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="autoInvestSurplus" className="flex-1 cursor-pointer">
                <Text style={{ color: colors.text.primary }} className="font-semibold text-sm">
                  Auto invest surplus
                </Text>
                <Text style={{ color: colors.text.secondary }} className="text-xs">
                  Automatically invest unused balance
                </Text>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
