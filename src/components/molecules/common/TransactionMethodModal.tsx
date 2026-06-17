'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Heading, Text } from '@/components/atoms';
import { MdClose, MdNoteAdd, MdImageSearch, MdMic, MdUploadFile } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface TransactionMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForm: () => void;
  onSelectImage: () => void;
  onSelectVoice: () => void;
  onSelectCsv: () => void;
}

export const TransactionMethodModal: React.FC<TransactionMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectForm,
  onSelectImage,
  onSelectVoice,
  onSelectCsv,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.background.primary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Heading level={3}>
            {t('transactions.addTransaction')}
          </Heading>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ color: colors.text.secondary }}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <Text style={{ color: colors.text.secondary }} className="text-sm mb-6">
          {t('transactions.chooseHowToAdd')}
        </Text>

        {/* Options */}
        <div className="space-y-4">
          {/* Form Option */}
          <button
            onClick={() => {
              onSelectForm();
              onClose();
            }}
            className="w-full p-4 rounded-lg border-2 transition-all text-left hover:opacity-80 hover:cursor-pointer"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <div className="flex items-start gap-3">
              <MdNoteAdd className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: colors.interactive.primary }} />
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  {t('transactions.methodForm')}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('transactions.methodFormDesc')}
                </p>
              </div>
            </div>
          </button>

          {/* Image Option */}
          <button
            onClick={() => {
              onSelectImage();
              onClose();
            }}
            className="w-full p-4 rounded-lg border-2 transition-all text-left hover:opacity-80 hover:cursor-pointer"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <div className="flex items-start gap-3">
              <MdImageSearch className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: colors.interactive.primary }} />
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  {t('transactions.methodImage')}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('transactions.methodImageDesc')}
                </p>
              </div>
            </div>
          </button>

          {/* Voice Option */}
          <button
            onClick={() => {
              onSelectVoice();
              onClose();
            }}
            className="w-full p-4 rounded-lg border-2 transition-all text-left hover:opacity-80 hover:cursor-pointer"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <div className="flex items-start gap-3">
              <MdMic className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: colors.interactive.primary }} />
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  {t('transactions.methodVoice')}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('transactions.methodVoiceDesc')}
                </p>
              </div>
            </div>
          </button>

          {/* CSV Option */}
          <button
            onClick={() => {
              onSelectCsv();
              onClose();
            }}
            className="w-full p-4 rounded-lg border-2 transition-all text-left hover:opacity-80 hover:cursor-pointer"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <div className="flex items-start gap-3">
              <MdUploadFile className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: colors.interactive.primary }} />
              <div>
                <p className="font-semibold" style={{ color: colors.text.primary }}>
                  {t('transactions.methodCsv')}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('transactions.methodCsvDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
