'use client';

import React from 'react';
import { Button, Text, Heading } from '@/components/atoms';
import { useTheme, useAuth } from '@/context';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface FooterProps {
  year?: number;
  appName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  year = new Date().getFullYear(),
  appName = 'SmartMoney',
}) => {
  const { colors, colorScheme } = useTheme();
  const { token } = useAuth();
  const t = useTranslations();
  const locale = useLocale();

  const footerLinks = [
    { label: t('common.privacy'), href: `/${locale}/privacy` },
    { label: t('common.helpCenter'), href: `/${locale}/help` },
    { label: t('common.contact'), href: `/${locale}/contact` },
  ];

  return (
    <footer className="mt-12 transition-colors border-t" style={{ backgroundColor: colors.background.primary, borderTopColor: colors.border.light }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand & Copyright Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link href={token ? `/${locale}/dashboard` : `/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt={appName} className="h-8 w-8 object-contain flex-shrink-0" style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
              <Heading
                level={2}
                className="text-lg m-0 font-bold flex items-center"
              >
                <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.primary }}>Smart</span>
                <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.tertiary }}>Money</span>
              </Heading>
            </Link>
            <Text variant="caption" style={{ color: colors.text.secondary }} className="sm:border-l sm:pl-4 sm:border-gray-300 dark:sm:border-gray-700">
              © {year} {appName}. {t('page.copyright')}
            </Text>
          </div>

          {/* Minimal Links */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:opacity-80"
                style={{ color: colors.text.secondary }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
