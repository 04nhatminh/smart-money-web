'use client';

import React, { useEffect } from 'react';
import { Button, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { ProjectAdvisorResponse } from '@/types/project.api';
import { MdClose, MdCheckCircle } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface ProjectAdvisorResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  onDisagree: () => void;
  advisorData: ProjectAdvisorResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const ProjectAdvisorResultModal: React.FC<ProjectAdvisorResultModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  onDisagree,
  advisorData,
  isLoading = false,
  error = null,
  onClearError,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

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
          className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full pointer-events-auto my-8"
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
              {t('projects.createModal.advisorTitle')}
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:cursor-pointer"
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
              <Alert message={error} type="error" onClose={onClearError} />
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
                {t('projects.createModal.advisorHeading')}
              </Heading>

              <div className="space-y-4">
                {/* Monthly Savings */}
                <div>
                  <Text className="text-sm" style={{ color: colors.text.secondary }}>
                    {t('projects.createModal.advisorMonthly')}
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
                    {t('projects.createModal.advisorMonths')}
                  </Text>
                  <Heading
                    level={3}
                    style={{ color: colors.interactive.primary }}
                    className="mt-1"
                  >
                    {advisorData.numberOfMonths}
                  </Heading>
                </div>

                {/* Recommendation */}
                <div>
                  <Text className="text-sm" style={{ color: colors.text.secondary }}>
                    {t('projects.createModal.advisorSummary')}
                  </Text>
                  <Text
                    className="mt-2 text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    {t('projects.createModal.advisorSummaryText', {
                      saving: formatCurrency(advisorData.monthlySaving),
                      months: advisorData.numberOfMonths
                    })}
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
                {t('projects.createModal.advisorInfo')}
              </Text>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onDisagree}
                disabled={isLoading}
                className="flex-1 text-xs px-2"
              >
                {t('projects.createModal.advisorDisagree')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onAgree}
                disabled={isLoading}
                className="flex-1 text-xs px-2"
              >
                {isLoading ? t('projects.createModal.advisorAgreeing') : t('projects.createModal.advisorAgree')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
