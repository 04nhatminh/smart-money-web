'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { HealthCheckResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/constants/api';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navItems?: NavItem[];
  appName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  navItems = [],
  appName = 'SmartMoney',
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { colors, colorScheme } = useTheme();
  const t = useTranslations();
  const { token, isInitializing } = useAuth();

  const handleLoginClick = () => {
    router.push(`/${locale}/login`);
  };

  const handleSignupClick = () => {
    router.push(`/${locale}/register`);
  };

  const showAuthActions = !isInitializing && !token;

  return (
    <header className="shadow-md transition-colors sticky top-0 z-50" style={{ backgroundColor: colors.background.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
        <div className="flex items-center py-2 relative h-full">
          {/* Logo - Centered */}
          <div className="flex items-center justify-center gap-3">
            <img src="/logo-nobg.png" alt={appName} className="h-14 w-14 object-contain flex-shrink-0" style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            <Heading 
              level={1} 
              className="text-2xl md:text-4xl m-0 font-bold flex items-center"
            >
              <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.primary }}>Smart</span>
              <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.secondary }}>Money</span>
            </Heading>
          </div>

          {/* Actions - Positioned Absolute Right */}
          {showAuthActions && (
            <div className="flex gap-4 absolute right-4 sm:right-6 lg:right-8">
              <Button variant="secondary" size="md" className="hidden sm:block" onClick={handleLoginClick}>
                {t('finance.hero.login')}
              </Button>
              <Button variant="primary" size="md" onClick={handleSignupClick}>
                {t('finance.hero.cta')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
