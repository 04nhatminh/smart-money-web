'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';

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
  const { colors, colorScheme } = useTheme();
  const t = useTranslations();

  const defaultNavItems = navItems.length > 0 ? navItems : [
    { label: t('common.home'), href: '#' },
    { label: t('common.pricing'), href: '#pricing' },
    { label: t('common.about'), href: '#about' },
  ];

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
          <div className="flex gap-4 absolute right-4 sm:right-6 lg:right-8">
            <Button variant="secondary" size="md" className="hidden sm:block">
              {t('finance.hero.login')}
            </Button>
            <Button variant="primary" size="md">
              {t('finance.hero.cta')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
