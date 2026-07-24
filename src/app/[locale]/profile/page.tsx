'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Skeleton } from '@/components/atoms';
import { LogoutButton } from '@/components/molecules/auth';
import { Card, UserFinancialModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { UserFinancialProfileResponse } from '@/types/user-financial.api';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();
  const { getUserFinancial } = useUserFinancial();
  const [userFinancial, setUserFinancial] = useState<UserFinancialProfileResponse | null>(null);
  const [isUserFinancialModalOpen, setIsUserFinancialModalOpen] = useState(false);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    try {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');

      if (year && month && day) {
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('vi-VN');
        }
      }

      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN');
      }
    } catch {
      // Fallback
    }

    return dateString;
  };

  // Load user info on component mount
  useEffect(() => {
    loadUserFinancialProfile();
  }, []);

  const loadUserFinancialProfile = async () => {
    setIsLoadingFinancial(true);
    try {
      const result = await getUserFinancial();
      if (result.success && result.data) {
        setUserFinancial(result.data);
      }
    } catch (err) {
      console.error('Failed to load user financial profile:', err);
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  const handleUserFinancialSuccess = () => {
    loadUserFinancialProfile();
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Heading level={2}>
              {t('common.profile')}
            </Heading>
            <Text style={{ color: colors.text.secondary }}>
              {t('profile.editProfileDescription')}
            </Text>
          </div>
          <div className="hidden sm:flex gap-3 shrink-0">
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/profile/edit`)}
            >
              {t('profile.editProfile')}
            </Button>
            <LogoutButton variant="danger">
              {t('profile.logout')}
            </LogoutButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="md:col-span-1">
            <Card className="p-6 h-full flex flex-col justify-center">
              <div className="text-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || user.username}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: colors.interactive.primary }}
                  >
                    {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <Heading level={3} className="mb-2">
                  {user?.fullName || user?.username}
                </Heading>
                <p
                  className="text-sm mb-4 break-all"
                  style={{ color: colors.text.secondary }}
                >
                  {user?.email}
                </p>
              </div>
            </Card>
          </div>

          {/* Account Information Card */}
          <div className="md:col-span-2">
            <Card className="p-6">
              <Heading level={3} className="pb-3">{t('profile.accountInfo')}</Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('profile.username')}
                  </p>
                  <p className="text-lg font-semibold">{user?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('auth.email')}
                  </p>
                  <p className="text-lg font-semibold break-all">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('profile.phone')}
                  </p>
                  <p className="text-lg font-semibold">{user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('profile.dateOfBirth')}
                  </p>
                  <p className="text-lg font-semibold">{formatDate(user?.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('profile.role')}
                  </p>
                  <p className="text-lg font-semibold capitalize">{user?.role || t('profile.defaultRole')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* User Financial Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading level={3} className="m-0">{t('financialSetup.title')}</Heading>
            <Button
              variant="secondary"
              onClick={() => setIsUserFinancialModalOpen(true)}
              disabled={isLoadingFinancial}
            >
              {userFinancial ? t('common.edit') : t('profile.setUp')}
            </Button>
          </div>

          {isLoadingFinancial ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton height={14} width="40%" />
                  <Skeleton height={24} width="60%" />
                </div>
              ))}
            </div>
          ) : userFinancial ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('financialSetup.incomeLabel')}
                </p>
                <p className="text-lg font-semibold">
                  {userFinancial.income?.toLocaleString()} VND
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('financialSetup.savingPaceLabel')}
                </p>
                <p className="text-lg font-semibold">
                  {t.has(`financialSetup.savingPaceOptions.${userFinancial.savingPace}`)
                    ? t(`financialSetup.savingPaceOptions.${userFinancial.savingPace}`)
                    : userFinancial.savingPace}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('financialSetup.interventionLevelLabel')}
                </p>
                <p className="text-lg font-semibold">
                  {t.has(`financialSetup.interventionLevelOptions.${userFinancial.interventionLevel}`)
                    ? t(`financialSetup.interventionLevelOptions.${userFinancial.interventionLevel}`)
                    : userFinancial.interventionLevel}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('financialSetup.focusModeLabel')}
                </p>
                <p className="text-lg font-semibold">
                  {t.has(`financialSetup.focusModeOptions.${userFinancial.focusMode}`)
                    ? t(`financialSetup.focusModeOptions.${userFinancial.focusMode}`)
                    : userFinancial.focusMode}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('profile.autoInvest')}
                </p>
                <p className="text-lg font-semibold">
                  {userFinancial.autoInvestSurplus ? t('profile.enabled') : t('profile.disabled')}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <Text style={{ color: colors.text.secondary }}>
                {t('financialSetup.noInfo')}
              </Text>
            </div>
          )}
        </Card>

        {/* Mobile action buttons at the bottom */}
        <div className="flex flex-col gap-3 sm:hidden mt-8">
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/profile/edit`)}
            className="w-full justify-center"
          >
            {t('profile.editProfile')}
          </Button>
          <LogoutButton variant="danger" className="w-full justify-center">
            {t('profile.logout')}
          </LogoutButton>
        </div>

        {/* User Financial Modal */}
        <UserFinancialModal
          isOpen={isUserFinancialModalOpen}
          onClose={() => setIsUserFinancialModalOpen(false)}
          onSuccess={handleUserFinancialSuccess}
        />
      </div>
    </SidebarLayout>
  );
}
