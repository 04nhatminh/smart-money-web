'use client';

import React, { useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { ProjectAdvisorResponse } from '@/types/project.api';
import { MdClose, MdCheckCircle, MdError } from 'react-icons/md';

interface ProjectAdvisorResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  onDisagree: () => void;
  advisorData: ProjectAdvisorResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

export const ProjectAdvisorResultModal: React.FC<ProjectAdvisorResultModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  onDisagree,
  advisorData,
  isLoading = false,
  error = null,
}) => {
  const { colors } = useTheme();

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

  if (!isOpen || !advisorData) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
          zIndex: 9999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto"
        style={{ zIndex: 10000 }}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto my-8"
          style={{ backgroundColor: colors.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b sticky top-0"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.background.primary,
            }}
          >
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>
              AI Recommendation
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              disabled={isLoading}
              style={{
                color: colors.text.secondary,
                backgroundColor: `${colors.interactive.primary}10`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = `${colors.interactive.primary}20`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`)
              }
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Box */}
            {error && (
              <div
                className="p-4 rounded-lg border flex gap-3"
                style={{
                  borderColor: '#EF4444',
                  backgroundColor: '#FEE2E2',
                }}
              >
                <MdError className="w-5 h-5 flex-shrink-0" style={{ color: '#DC2626' }} />
                <Text className="text-sm" style={{ color: '#7F1D1D' }}>
                  {error}
                </Text>
              </div>
            )}

            {/* Success Icon */}
            <div className="flex justify-center">
              <MdCheckCircle className="w-12 h-12" style={{ color: '#10B981' }} />
            </div>

            {/* AI Recommendation Box */}
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.background.secondary,
              }}
            >
              <Heading level={4} style={{ color: colors.text.primary }} className="mb-3">
                Here's what we recommends:
              </Heading>

              <div className="space-y-4">
                {/* Monthly Savings */}
                <div>
                  <Text className="text-sm" style={{ color: colors.text.secondary }}>
                    Monthly Savings
                  </Text>
                  <Heading
                    level={3}
                    style={{ color: colors.interactive.primary }}
                    className="mt-1"
                  >
                    {formatCurrency(advisorData.monthlySaving)}
                  </Heading>
                </div>

                {/* Duration */}
                <div>
                  <Text className="text-sm" style={{ color: colors.text.secondary }}>
                    Months to Goal
                  </Text>
                  <Heading
                    level={3}
                    style={{ color: colors.interactive.primary }}
                    className="mt-1"
                  >
                    {advisorData.numberOfMonths} months
                  </Heading>
                </div>

                {/* Recommendation */}
                <div>
                  <Text className="text-sm" style={{ color: colors.text.secondary }}>
                    Summary
                  </Text>
                  <Text
                    className="mt-2 text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    You need to save {formatCurrency(advisorData.monthlySaving)} per month for {advisorData.numberOfMonths} months to reach your goal.
                  </Text>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: `${colors.interactive.primary}10`,
              }}
            >
              <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                ℹ️ If you agree, your project will be created with these suggested parameters.
              </Text>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onDisagree}
                disabled={isLoading}
                className="flex-1"
              >
                Disagree
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onAgree}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Agree & Create'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
