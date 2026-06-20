'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { LogoutButton } from '@/components/molecules/auth';
import { Card, UserIncomeModal, UserFinancialModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useUserIncome } from '@/hooks/useUserIncome';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { UserIncomeResponse } from '@/types/user-income.api';
import { UserFinancialProfileResponse } from '@/types/user-financial.api';
import { formatAmountInput } from '@/lib/format';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();
  const { getUserIncome } = useUserIncome();
  const { getUserFinancial } = useUserFinancial();
  const [userIncome, setUserIncome] = useState<UserIncomeResponse | null>(null);
  const [userFinancial, setUserFinancial] = useState<UserFinancialProfileResponse | null>(null);
  const [isUserIncomeModalOpen, setIsUserIncomeModalOpen] = useState(false);
  const [isUserFinancialModalOpen, setIsUserFinancialModalOpen] = useState(false);
  const [isLoadingIncome, setIsLoadingIncome] = useState(false);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    // If already in dd/MM/yyyy format, return as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    try {
      // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');

      if (year && month && day) {
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('vi-VN');
        }
      }

      // Fallback: try parsing the date as is
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN');
      }
    } catch {
      // If all parsing fails, return original string
    }

    return dateString;
  };

  // Load user info on component mount
  useEffect(() => {
    loadUserIncome();
    loadUserFinancialProfile();
  }, []);

  const loadUserIncome = async () => {
    setIsLoadingIncome(true);
    try {
      const result = await getUserIncome();
      if (result.success && result.data) {
        setUserIncome(result.data);
      }
    } catch (err) {
      console.error('Failed to load user income:', err);
    } finally {
      setIsLoadingIncome(false);
    }
  };

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

  const handleUserIncomeSuccess = () => {
    loadUserIncome();
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
          <div className="flex gap-3 shrink-0">
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/profile/edit`)}
            >
              {t('profile.editProfile')}
            </Button>
            <LogoutButton variant="secondary">
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

        {/* User Income Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading level={3} className="m-0">{t('profile.incomeInfo')}</Heading>
            <Button
              variant="secondary"
              onClick={() => setIsUserIncomeModalOpen(true)}
              disabled={isLoadingIncome}
            >
              {userIncome ? t('common.edit') : t('profile.setUp')}
            </Button>
          </div>

          {userIncome ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('profile.netIncome')}
                </p>
                <p className="text-lg font-semibold">
                  {userIncome.netIncome?.toLocaleString()} {userIncome.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('profile.usableIncome')}
                </p>
                <p className="text-lg font-semibold">
                  {userIncome.usableIncome?.toLocaleString()} {userIncome.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('profile.safeSpending')}
                </p>
                <p className="text-lg font-semibold">
                  {userIncome.safeSpending?.toLocaleString()} {userIncome.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  {t('profile.autoInvest')}
                </p>
                <p className="text-lg font-semibold">
                  {userIncome.autoInvestSurplus ? t('profile.enabled') : t('profile.disabled')}
                </p>
              </div>
              {userIncome.calculationNote && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                    {t('profile.calcNote')}
                  </p>
                  <p className="text-sm" style={{ color: colors.text.primary }}>
                    {userIncome.calculationNote}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <Text style={{ color: colors.text.secondary }}>
                {t('profile.noIncomeInfo')}
              </Text>
            </div>
          )}
        </Card>

        {/* User Financial Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading level={3} className="m-0">Financial Profile</Heading>
            <Button
              variant="secondary"
              onClick={() => setIsUserFinancialModalOpen(true)}
              disabled={isLoadingFinancial}
            >
              {userFinancial ? t('common.edit') : t('profile.setUp')}
            </Button>
          </div>

          {userFinancial ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Role
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.role?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Living Status
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.living_status?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Income Level
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.income_level?.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Transport Mode
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.transport_mode?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Spending Style
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.spending_style?.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Work Style
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.work_style?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Family Status
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.family_status?.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Study Intensity
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.study_intensity?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                  Health Need
                </p>
                <p className="text-lg font-semibold capitalize">
                  {userFinancial.health_need?.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-lg text-center"
              style={{ backgroundColor: colors.background.secondary }}
            >
              <Text style={{ color: colors.text.secondary }}>
                No financial profile information set up yet.
              </Text>
            </div>
          )}
        </Card>



        {/* User Income Modal */}
        <UserIncomeModal
          isOpen={isUserIncomeModalOpen}
          onClose={() => setIsUserIncomeModalOpen(false)}
          onSuccess={handleUserIncomeSuccess}
        />

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
