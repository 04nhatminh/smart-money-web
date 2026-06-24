'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { MdClose } from 'react-icons/md';
import {
  UserRole,
  LivingStatus,
  IncomeLevel,
  TransportMode,
  SpendingStyle,
  WorkStyle,
  FamilyStatus,
  StudyIntensity,
  HealthNeed,
  CreateUserFinancialProfileRequest,
} from '@/types/user-financial.api';

interface UserFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  role: UserRole;
  living_status: LivingStatus;
  income_level: IncomeLevel;
  transport_mode: TransportMode;
  spending_style: SpendingStyle;
  work_style: WorkStyle;
  family_status: FamilyStatus;
  study_intensity: StudyIntensity;
  health_need: HealthNeed;
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
    role: 'STUDENT',
    living_status: 'WITH_FAMILY',
    income_level: 'MEDIUM',
    transport_mode: 'MOTORBIKE',
    spending_style: 'BALANCED',
    work_style: 'NONE',
    family_status: 'SINGLE',
    study_intensity: 'NORMAL',
    health_need: 'NORMAL',
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
        role: profile.role || 'STUDENT',
        living_status: profile.living_status || 'WITH_FAMILY',
        income_level: profile.income_level || 'MEDIUM',
        transport_mode: profile.transport_mode || 'MOTORBIKE',
        spending_style: profile.spending_style || 'BALANCED',
        work_style: profile.work_style || 'NONE',
        family_status: profile.family_status || 'SINGLE',
        study_intensity: profile.study_intensity || 'NORMAL',
        health_need: profile.health_need || 'NORMAL',
      });
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const requestData: CreateUserFinancialProfileRequest = {
        role: formData.role,
        living_status: formData.living_status,
        income_level: formData.income_level,
        transport_mode: formData.transport_mode,
        spending_style: formData.spending_style,
        work_style: formData.work_style,
        family_status: formData.family_status,
        study_intensity: formData.study_intensity,
        health_need: formData.health_need,
      };

      let result;
      if (isEditMode) {
        result = await updateUserFinancial(requestData);
      } else {
        result = await createUserFinancial(requestData);
      }

      if (result.success) {
        // Also update AuthContext states and cookie
        updateUser({ financialSetupCompleted: true });

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to save financial profile');
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
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0">
              {isEditMode ? 'Edit Financial Profile' : 'Create Financial Profile'}
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
                  {isEditMode ? 'Financial profile updated successfully!' : 'Financial profile created successfully!'}
                </Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert message={error} type="error" onClose={() => setError(null)} />
            )}

            {/* Role */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                User Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="STUDENT">Student</option>
                <option value="OFFICE_WORKER">Office Worker</option>
                <option value="FREELANCER">Freelancer</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
              </select>
            </div>

            {/* Living Status */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Living Status *
              </label>
              <select
                name="living_status"
                value={formData.living_status}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="WITH_FAMILY">With Family</option>
                <option value="RENT_ROOM">Renting Room</option>
                <option value="DORM">Dormitory</option>
                <option value="OWN_HOUSE">Own House</option>
              </select>
            </div>

            {/* Income Level */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Income Level *
              </label>
              <select
                name="income_level"
                value={formData.income_level}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Transport Mode */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Transport Mode *
              </label>
              <select
                name="transport_mode"
                value={formData.transport_mode}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="MOTORBIKE">Motorbike</option>
                <option value="BUS">Bus</option>
                <option value="CAR">Car</option>
                <option value="RIDE_HAILING">Ride Hailing</option>
              </select>
            </div>

            {/* Spending Style */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Spending Style *
              </label>
              <select
                name="spending_style"
                value={formData.spending_style}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="BALANCED">Balanced</option>
                <option value="FRUGAL">Frugal</option>
                <option value="SPENDER">Spender</option>
              </select>
            </div>

            {/* Work Style */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Work Style *
              </label>
              <select
                name="work_style"
                value={formData.work_style}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="NONE">None</option>
                <option value="ONSITE">Onsite</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>

            {/* Family Status */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Family Status *
              </label>
              <select
                name="family_status"
                value={formData.family_status}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
              </select>
            </div>

            {/* Study Intensity */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Study Intensity *
              </label>
              <select
                name="study_intensity"
                value={formData.study_intensity}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="NORMAL">Normal</option>
                <option value="COURSE_HEAVY">Course Heavy</option>
              </select>
            </div>

            {/* Health Need */}
            <div className="space-y-2">
              <label style={{ color: colors.text.primary }} className="block text-sm font-semibold">
                Health Need *
              </label>
              <select
                name="health_need"
                value={formData.health_need}
                onChange={handleSelectChange}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
                <option value="HIGH">High</option>
              </select>
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
