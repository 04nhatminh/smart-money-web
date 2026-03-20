'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { PRIMARY_COLORS } from '@/constants';

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
  const { colors } = useTheme();
  const t = useTranslations();

  const defaultNavItems = navItems.length > 0 ? navItems : [
    { label: t('common.home'), href: '#' },
    { label: t('common.pricing'), href: '#pricing' },
    { label: t('common.about'), href: '#about' },
  ];

  return (
    <header className="shadow-md transition-colors sticky top-0 z-50" style={{ backgroundColor: PRIMARY_COLORS.background.primary, borderBottomColor: PRIMARY_COLORS.border.light, borderBottomWidth: '1px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo-nobg.png" alt={appName} className="h-14 w-14 object-contain flex-shrink-0" />
            <Heading 
              level={1} 
              className="text-2xl md:text-4xl m-0 font-bold"
              style={{
                background: `linear-gradient(90deg, ${PRIMARY_COLORS.palette[900]} 0%, ${PRIMARY_COLORS.palette[350]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
              }}
            >
              {appName}
            </Heading>
          </div>



          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="hidden sm:block">
              {t('finance.hero.login')}
            </Button>
            <Button variant="primary" size="sm">
              {t('finance.hero.cta')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
