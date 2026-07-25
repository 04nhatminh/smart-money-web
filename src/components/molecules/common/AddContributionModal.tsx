'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { formatAmountInput, parseFormattedNumber, formatPrice } from '@/lib/format';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string | null;
  projectName: string | null;
  currency: string;
  remainingAmount?: number;
}

interface FormData {
  amount: string;
}

export const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  currency,
  remainingAmount,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { isLoading, addContribution } = useProjects();
  const [error, setError] = useState<string | null>(null);
  const [isExceeding, setIsExceeding] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    amount: '',
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

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsExceeding(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setError(null);
    setIsExceeding(false);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsExceeding(false);

    if (!projectId) {
      setError('Project ID is missing');
      return;
    }

    const numericAmount = parseFormattedNumber(formData.amount);

    // Validation
    if (!formData.amount || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (remainingAmount !== undefined && numericAmount > remainingAmount) {
      setIsExceeding(true);
      setError(
        t('projects.exceedsRemainingError', {
          amount: formatPrice(numericAmount, currency),
          remaining: formatPrice(remainingAmount, currency),
        })
      );
      return;
    }

    try {
      const result = await addContribution(projectId, {
        amount: numericAmount,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          amount: '',
        });

        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        const errMsg = result.error || 'Failed to add contribution';
        setError(errMsg);
        if (errMsg.includes('PROJECT_CONTRIBUTION_EXCEEDS_REMAINING') || errMsg.toLowerCase().includes('exceeds')) {
          setIsExceeding(true);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errMsg);
      if (errMsg.includes('PROJECT_CONTRIBUTION_EXCEEDS_REMAINING') || errMsg.toLowerCase().includes('exceeds')) {
        setIsExceeding(true);
      }
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
          className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full pointer-events-auto"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>Add Contribution</Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:cursor-pointer"
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
                <Text className="font-semibold">Contribution added successfully!</Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="space-y-2">
                <Alert message={error} type="error" onClose={() => { setError(null); setIsExceeding(false); }} />
                {isExceeding && remainingAmount !== undefined && remainingAmount > 0 && (
                  <div
                    className="p-3 rounded-xl flex items-center justify-between gap-3 border"
                    style={{
                      backgroundColor: `${colors.interactive.primary}10`,
                      borderColor: `${colors.interactive.primary}30`,
                    }}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.text.primary }}>
                      {t('projects.suggestFillRemaining')}
                    </Text>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setFormData({ amount: formatAmountInput(remainingAmount.toString()) });
                        setError(null);
                        setIsExceeding(false);
                      }}
                      className="text-xs py-1 px-3 whitespace-nowrap"
                    >
                      {t('projects.adjustToRemainingBtn', { remaining: formatPrice(remainingAmount, currency) })}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Project Info */}
            {projectName && (
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderLeft: `4px solid ${colors.background.primary}`,
                }}
              >
                <Text className="text-sm" style={{ color: colors.text.secondary }}>
                  Project
                </Text>
                <Text className="font-semibold" style={{ color: colors.text.primary }}>
                  {projectName}
                </Text>
              </div>
            )}

            {/* Remaining Amount & Quick Fill */}
            {remainingAmount !== undefined && remainingAmount > 0 && (
              <div
                className="p-3.5 rounded-xl flex items-center justify-between gap-3"
                style={{
                  backgroundColor: colors.background.secondary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <div>
                  <Text className="text-xs font-medium" style={{ color: colors.text.secondary }}>
                    {t('projects.remainingNeeded')}
                  </Text>
                  <Text className="font-bold text-sm" style={{ color: colors.text.primary }}>
                    {formatPrice(remainingAmount, currency)}
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFormData({ amount: formatAmountInput(remainingAmount.toString()) });
                    setError(null);
                  }}
                  className="text-xs py-1.5 px-3 whitespace-nowrap"
                >
                  {t('projects.quickFillBtn')}
                </Button>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Amount ({currency}) <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <Input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isLoading}
                required
                autoFocus
              />
              <Text className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                Enter the amount you want to contribute to this project
              </Text>
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
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
