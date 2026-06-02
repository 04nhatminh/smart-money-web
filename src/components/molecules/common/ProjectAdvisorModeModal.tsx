'use client';

import React, { useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { MdClose } from 'react-icons/md';

interface ProjectAdvisorModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'RELAXED' | 'URGENT') => void;
  isLoading?: boolean;
}

export const ProjectAdvisorModeModal: React.FC<ProjectAdvisorModeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  isLoading = false,
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
              Choose Savings Strategy
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
            <div>
              <Text style={{ color: colors.text.secondary }} className="mb-4">
                How would you like to approach this savings goal?
              </Text>
            </div>

            {/* Relaxed Option */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-opacity-100"
              style={{
                borderColor: colors.interactive.primary,
                backgroundColor: colors.background.secondary,
              }}
              onClick={() => onSelectMode('RELAXED')}
            >
              <Heading level={4} style={{ color: colors.interactive.primary }} className="mb-2">
                Relaxed
              </Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Comfortable monthly savings with flexible deadlines. Lower pressure, steady progress.
              </Text>
            </div>

            {/* Urgent Option */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-opacity-100"
              style={{
                borderColor: '#F59E0B',
                backgroundColor: colors.background.secondary,
              }}
              onClick={() => onSelectMode('URGENT')}
            >
              <Heading level={4} style={{ color: '#F59E0B' }} className="mb-2">
                Urgent
              </Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Aggressive savings plan with shorter deadlines. Higher monthly commitment for faster results.
              </Text>
            </div>

            {/* Info */}
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: `${colors.interactive.primary}10`,
              }}
            >
              <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                💡 Tip: AI will analyze your income and suggest monthly savings based on your chosen strategy.
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
