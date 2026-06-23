'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { MdClose } from 'react-icons/md';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();

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
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto overflow-hidden"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b rounded-t-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>
              {title}
            </Heading>
            <button
              onClick={onCancel}
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
          <div className="p-6 space-y-6">
            <Text style={{ color: colors.text.secondary }}>
              {message}
            </Text>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Deleting...' : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
