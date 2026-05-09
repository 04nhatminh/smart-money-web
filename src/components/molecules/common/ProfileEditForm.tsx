'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MdClose, MdCloudUpload } from 'react-icons/md';
import { Button, Heading, Input, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import { formatDateToInput } from '@/lib/format';

interface ProfileEditFormProps {
  onSuccess?: () => void;
  isLoading?: boolean;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onSuccess, isLoading = false }) => {
  const t = useTranslations();
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const { updateProfile, loading: submitting, error: hookError, clearError } = useProfile();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with authUser data immediately
  useEffect(() => {
    console.log('🔵 ProfileEditForm - authUser:', authUser);
    if (authUser) {
      const formatted = formatDateToInput(authUser.dateOfBirth);
      console.log('🔵 ProfileEditForm - formatted date:', authUser.dateOfBirth, '->', formatted);
      setFormData({
        fullName: authUser.fullName || '',
        phone: authUser.phone || '',
        dateOfBirth: formatted,
      });
      if (authUser.avatar) {
        setAvatarPreview(authUser.avatar);
      }
    }
  }, [authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    clearError();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.avatarTooLarge'));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalidImageFormat'));
        return;
      }

      setAvatarFile(file);
      clearError();
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    // Phone validation
    if (formData.phone) {
      // Check if phone contains non-digit characters
      if (!/^\d+$/.test(formData.phone)) {
        setError(t('profile.phoneInvalid'));
        return false;
      }
      
      // Check if phone has exactly 10 digits and starts with 0
      if (!/^0\d{9}$/.test(formData.phone)) {
        setError(t('profile.phoneFormatInvalid'));
        return false;
      }
    }

    // Full name validation
    if (formData.fullName && formData.fullName.length > 40) {
      setError(t('profile.nameToolong'));
      return false;
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
      const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!datePattern.test(formData.dateOfBirth)) {
        setError(t('profile.dateFormatInvalid'));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      const updateData: any = {};

      if (formData.fullName) {
        updateData.fullName = formData.fullName;
      }
      if (formData.phone) {
        updateData.phone = formData.phone;
      }
      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      await updateProfile(updateData);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      // Error is already handled by useProfile hook
      // No need to set error here to avoid duplication
    }
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(authUser?.avatar || null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium" style={{ color: colors.text.primary }}>
            {t('profile.avatar')}
          </label>
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.surface.secondary }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="text-2xl font-bold" style={{ color: colors.interactive.primary }}>
                  {(formData.fullName || authUser?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Upload and Clear Buttons */}
            <div className="flex-1 flex gap-2">
              <label className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                >
                  <MdCloudUpload size={18} />
                  {t('profile.uploadAvatar')}
                </Button>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleClearAvatar}
                  className="px-4"
                >
                  <MdClose size={18} />
                </Button>
              )}
            </div>
          </div>
          <Text style={{ color: colors.text.secondary }} className="text-xs">
            {t('profile.avatarHint')}
          </Text>
        </div>

        {/* Full Name */}
        <div>
          <Input
            label={t('profile.fullName')}
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder={t('profile.fullNamePlaceholder')}
            maxLength={40}
          />
        </div>

        {/* Date of Birth */}
        <div>
          <Input
            label={t('profile.dateOfBirth')}
            name="dateOfBirth"
            type="text"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            placeholder={t('profile.dateOfBirthPlaceholder')}
          />
          <Text style={{ color: colors.text.secondary }} className="text-xs mt-1">
            {t('profile.dateFormatHint')}
          </Text>
        </div>

        {/* Phone */}
        <div>
          <Input
            label={t('profile.phone')}
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder={t('profile.phonePlaceholder')}
            maxLength={10}
          />
          <Text style={{ color: colors.text.secondary }} className="text-xs mt-1">
            {t('profile.phoneFormatInvalid')}
          </Text>
        </div>

        {/* Error Message */}
        {(error || hookError) && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: colors.interactive.danger + '20', borderLeft: `4px solid ${colors.interactive.danger}` }}
          >
            <Text style={{ color: colors.interactive.danger }} className="text-sm">
              {hookError || error}
            </Text>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: colors.interactive.success + '20', borderLeft: `4px solid ${colors.interactive.success}` }}
          >
            <Text style={{ color: colors.interactive.success }} className="text-sm">
              {t('profile.updateSuccess')}
            </Text>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? t('common.loading') : t('common.save')}
        </Button>
      </form>
    </div>
  );
};
