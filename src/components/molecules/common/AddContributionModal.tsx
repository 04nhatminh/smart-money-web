'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose } from 'react-icons/md';

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string | null;
  projectName: string | null;
  currency: string;
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
}) => {
  const { colors } = useTheme();
  const { isLoading, addContribution } = useProjects();
  const [error, setError] = useState<string | null>(null);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

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

    if (!projectId) {
      setError('Project ID is missing');
      return;
    }

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const result = await addContribution(projectId, {
        amount: parseFormattedNumber(formData.amount),
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
        setError(result.error || 'Failed to add contribution');
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
              <Alert message={error} type="error" onClose={() => setError(null)} />
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
