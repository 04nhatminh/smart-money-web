'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MdGroup, MdCheckCircle, MdError, MdArrowForward, MdLogout } from 'react-icons/md';
import { CenteredLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { useAuth } from '@/context/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/context/ThemeContext';

function GroupInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('invites');
  const tCommon = useTranslations('common');
  const { user, logout, isAuthenticated, isInitializing } = useAuth();
  const { acceptGroupInvite } = useGroups();
  const { colors, colorScheme } = useTheme();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [groupName, setGroupName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle unauthenticated user redirect to login with locale preserved
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      const currentUrl = `/${locale}/invites/group${token ? `?token=${token}` : ''}`;
      const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(currentUrl)}`;
      router.push(loginUrl);
    }
  }, [isAuthenticated, isInitializing, router, locale, token]);

  const handleAcceptInvite = useCallback(async (inviteToken: string) => {
    setStatus('loading');
    const result = await acceptGroupInvite(inviteToken);
    if (result.success && result.data) {
      setStatus('success');
      setGroupName(result.data.name || null);
    } else {
      setStatus('error');
      setErrorMessage(result.error || t('invalidToken'));
    }
  }, [acceptGroupInvite, t]);

  // Execute group accept when authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated && status === 'idle') {
      if (!token) {
        setStatus('error');
        setErrorMessage(t('invalidToken'));
      } else {
        handleAcceptInvite(token);
      }
    }
  }, [isAuthenticated, isInitializing, status, token, handleAcceptInvite, t]);

  const handleSwitchAccount = () => {
    logout();
    const currentUrl = `/${locale}/invites/group${token ? `?token=${token}` : ''}`;
    const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(currentUrl)}`;
    router.push(loginUrl);
  };

  const isUserMismatch = errorMessage?.toLowerCase().includes('not issued to you') ||
    errorMessage?.toLowerCase().includes('mismatch');

  if (isInitializing || !isAuthenticated) {
    return (
      <CenteredLayout hideHeader hideFooter>
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-indigo-500 border-r-transparent"></div>
          <Heading level={3}>{t('loginToJoin')}</Heading>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout hideHeader hideFooter>
      <div className="w-full max-w-[500px] rounded-3xl p-8 sm:p-10 auth-glass-card text-center border shadow-xl transition-all">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              color: colors.interactive?.primary || '#6366f1',
            }}
          >
            <MdGroup size={44} />
          </div>
        </div>

        <Heading level={2} className="mb-2">
          {t('title')}
        </Heading>
        <Text className="mb-6 text-sm" style={{ color: colors.text?.secondary }}>
          {t('subtitle')}
        </Text>

        {token && (
          <div className="mb-6">
            <a
              href={`smartmoney://group-invite?token=${token}`}
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border transition-all hover:opacity-80"
              style={{
                borderColor: colors.interactive?.primary || '#6366f1',
                color: colors.interactive?.primary || '#6366f1',
                backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff'
              }}
            >
              <span>{t('openInMobileApp')}</span>
            </a>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="py-8 space-y-4 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <Text className="font-medium" style={{ color: colors.text?.primary }}>
              {t('processing')}
            </Text>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="py-4 space-y-6 animate-fadeIn">
            <div className="flex justify-center text-green-500">
              <MdCheckCircle size={56} className="animate-bounce" />
            </div>
            <div>
              <Heading level={3} className="text-green-600 dark:text-green-400 mb-2">
                {t('successTitle')}
              </Heading>
              {groupName && (
                <div
                  className="p-3 my-3 rounded-xl font-semibold text-lg inline-block border"
                  style={{
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: colors.interactive?.primary || '#6366f1',
                  }}
                >
                  {groupName}
                </div>
              )}
              <Text className="text-sm" style={{ color: colors.text?.secondary }}>
                {t('successMessage')}
              </Text>
            </div>

            <Button
              variant="primary"
              className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              <span>{t('goToDashboard')}</span>
              <MdArrowForward size={20} />
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="py-4 space-y-6 animate-fadeIn">
            <div className="flex justify-center text-amber-500">
              <MdError size={56} />
            </div>

            {isUserMismatch ? (
              <div className="space-y-4">
                <Heading level={3} className="text-amber-600 dark:text-amber-400 mb-2">
                  {t('mismatchTitle')}
                </Heading>
                <Text className="text-sm" style={{ color: colors.text?.secondary }}>
                  {t('mismatchMessage', { email: user?.email || user?.username || '' })}
                </Text>

                <div className="pt-2 space-y-3">
                  <Button
                    variant="primary"
                    className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
                    onClick={handleSwitchAccount}
                  >
                    <MdLogout size={20} />
                    <span>{t('switchAccount')}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
                    onClick={() => router.push(`/${locale}/dashboard`)}
                  >
                    <span>{t('goToDashboard')}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Heading level={3} className="text-red-600 dark:text-red-400 mb-2">
                  {t('errorTitle')}
                </Heading>
                <Text className="text-sm" style={{ color: colors.text?.secondary }}>
                  {errorMessage || t('invalidToken')}
                </Text>

                <Button
                  variant="secondary"
                  className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
                  onClick={() => router.push(`/${locale}/dashboard`)}
                >
                  <span>{t('goToDashboard')}</span>
                  <MdArrowForward size={20} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </CenteredLayout>
  );
}

export default function GroupInvitePage() {
  const tCommon = useTranslations('common');

  return (
    <Suspense
      fallback={
        <CenteredLayout hideHeader hideFooter>
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <Heading level={3}>{tCommon('loading')}</Heading>
          </div>
        </CenteredLayout>
      }
    >
      <GroupInviteContent />
    </Suspense>
  );
}
