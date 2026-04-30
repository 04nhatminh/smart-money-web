'use client';

import React from 'react';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { MdClose } from 'react-icons/md';
import { ImageUpload } from './ImageUpload';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
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
              Upload Receipt Image
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
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
          <div className="p-6">
            <Text
              style={{ color: colors.text.secondary }}
              className="text-sm mb-4"
            >
              Upload a receipt photo to extract transaction details.
            </Text>
            <ImageUpload
              onSuccess={() => {
                onSuccess?.();
                onClose();
              }}
              onError={(error) => {
                console.error('Image upload error:', error);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
