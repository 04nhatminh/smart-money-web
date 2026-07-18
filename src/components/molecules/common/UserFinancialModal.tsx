'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { MdClose, MdAutoAwesome } from 'react-icons/md';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import {
  SavingPace,
  InterventionLevel,
  FocusMode,
  CreateUserFinancialProfileRequest,
} from '@/types/user-financial.api';

interface UserFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  income: string;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  autoInvestSurplus: boolean;
}

export const UserFinancialModal: React.FC<UserFinancialModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { updateUser } = useAuth();
  const { isLoading, createUserFinancial, updateUserFinancial, getUserFinancial } = useUserFinancial();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    income: '',
    savingPace: 'BALANCED',
    interventionLevel: 'GENTLE',
    focusMode: 'SAVE_MORE',
    autoInvestSurplus: true,
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

  // Load existing user financial profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserFinancial();
    }
  }, [isOpen]);

  const loadUserFinancial = async () => {
    const result = await getUserFinancial();
    if (result.success && result.data) {
      const profile = result.data;
      setFormData({
        income: profile.income ? formatAmountInput(profile.income.toString()) : '',
        savingPace: profile.savingPace || 'BALANCED',
        interventionLevel: profile.interventionLevel || 'GENTLE',
        focusMode: profile.focusMode || 'SAVE_MORE',
        autoInvestSurplus: profile.autoInvestSurplus !== undefined ? profile.autoInvestSurplus : true,
      });
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'income') {
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

    const parsedIncome = parseFormattedNumber(formData.income);
    if (!formData.income || parsedIncome <= 0) {
      setError(t('financialSetup.incomeRequired'));
      return;
    }

    try {
      const requestData: CreateUserFinancialProfileRequest = {
        income: parsedIncome,
        savingPace: formData.savingPace,
        interventionLevel: formData.interventionLevel,
        focusMode: formData.focusMode,
        autoInvestSurplus: formData.autoInvestSurplus,
      };

      let result;
      if (isEditMode) {
        result = await updateUserFinancial(requestData);
      } else {
        result = await createUserFinancial(requestData);
      }

      if (result.success) {
        // Update AuthContext states
        updateUser({ financialSetupCompleted: true });

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || t('financialSetup.errorSave'));
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
          zIndex: 10001,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 10002 }}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <div className="flex items-center gap-2">
              <MdAutoAwesome className="w-5 h-5" style={{ color: colors.interactive.primary }} />
              <Heading level={3} className="m-0">
                {isEditMode ? t('financialSetup.titleEdit') : t('financialSetup.titleCreate')}
              </Heading>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity hover:cursor-pointer"
              aria-label="Close modal"
            >
              <MdClose size={24} style={{ color: colors.text.secondary }} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Description */}
            <Text style={{ color: colors.text.secondary }} className="text-sm">
              {t('financialSetup.description')}
            </Text>

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
                  {isEditMode ? t('financialSetup.successUpdate') : t('financialSetup.successCreate')}
                </Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert message={error} type="error" onClose={() => setError(null)} />
            )}

            {/* Income */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                {t('financialSetup.incomeLabel')}
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="income"
                  value={formData.income}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  disabled={isLoading}
                  required
                  className="flex-1"
                />
                <div
                  className="px-3 py-2 rounded-lg border flex items-center justify-center font-semibold"
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                    color: colors.text.primary,
                    minWidth: '80px',
                  }}
                >
                  VND
                </div>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                {t('financialSetup.incomeHint')}
              </Text>
            </div>

            {/* Saving Pace */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                {t('financialSetup.savingPaceLabel')}
              </label>
              <select
                name="savingPace"
                value={formData.savingPace}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="RELAXED">{t('financialSetup.savingPaceOptions.RELAXED')}</option>
                <option value="BALANCED">{t('financialSetup.savingPaceOptions.BALANCED')}</option>
                <option value="AGGRESIVE">{t('financialSetup.savingPaceOptions.AGGRESIVE')}</option>
              </select>
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                {t('financialSetup.savingPaceHint')}
              </Text>
            </div>

            {/* Intervention Level */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                {t('financialSetup.interventionLevelLabel')}
              </label>
              <select
                name="interventionLevel"
                value={formData.interventionLevel}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="NOTIFY">{t('financialSetup.interventionLevelOptions.NOTIFY')}</option>
                <option value="GENTLE">{t('financialSetup.interventionLevelOptions.GENTLE')}</option>
                <option value="HARD">{t('financialSetup.interventionLevelOptions.HARD')}</option>
              </select>
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                {t('financialSetup.interventionLevelHint')}
              </Text>
            </div>

            {/* Focus Mode */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                {t('financialSetup.focusModeLabel')}
              </label>
              <select
                name="focusMode"
                value={formData.focusMode}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="SAVE_MORE">{t('financialSetup.focusModeOptions.SAVE_MORE')}</option>
                <option value="REDUCE_SPENDING">{t('financialSetup.focusModeOptions.REDUCE_SPENDING')}</option>
                <option value="TRACK_ONLY">{t('financialSetup.focusModeOptions.TRACK_ONLY')}</option>
              </select>
              <Text style={{ color: colors.text.secondary }} className="text-xs">
                {t('financialSetup.focusModeHint')}
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
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : isEditMode ? t('common.save') : t('profile.setUp')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
