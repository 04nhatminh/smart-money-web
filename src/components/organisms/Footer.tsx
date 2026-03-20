'use client';

import React from 'react';
import { Button, Text, Heading } from '@/components/atoms';
import { ThemeToggle, LanguageToggle } from '@/components/molecules';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { PRIMARY_COLORS } from '@/constants/colors';

interface FooterProps {
  year?: number;
  appName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  year = new Date().getFullYear(),
  appName = 'SmartMoney',
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const productLinks = [
    { label: t('common.features'), href: '#features' },
    { label: t('common.pricing'), href: '#pricing' },
    { label: t('common.security'), href: '#security' },
  ];

  const companyLinks = [
    { label: t('common.about'), href: '#about' },
    { label: t('common.blog'), href: '#blog' },
    { label: t('common.contact'), href: '#contact' },
  ];

  const supportLinks = [
    { label: t('common.helpCenter'), href: '#help' },
    { label: t('common.contact'), href: '#contact' },
    { label: t('common.privacy'), href: '#privacy' },
  ];

  return (
    <footer className="mt-12 transition-colors" style={{ backgroundColor: PRIMARY_COLORS.base }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-nobg.png" alt={appName} className="h-10 w-10 object-contain" />
                <Heading level={3} className="text-white m-0 text-lg">
                  {appName}
                </Heading>
              </div>
              <Text variant="caption" className="text-white opacity-70">
                {t('finance.appDescription')}
              </Text>
            </div>

            {/* Product */}
            <div>
              <Text className="font-semibold mb-4 text-white">
                {t('common.features')}
              </Text>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80 text-white opacity-70"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <Text className="font-semibold mb-4 text-white">
                {t('common.about')}
              </Text>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80 text-white opacity-70"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <Text className="font-semibold mb-4 text-white">
                {t('common.settings')}
              </Text>
              <ul className="space-y-2">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80 text-white opacity-70"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTopColor: 'rgba(255, 255, 255, 0.2)', borderTopWidth: '1px' }} className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Text variant="caption" className="text-white opacity-70 text-center md:text-left">
                © {year} {appName}. {t('page.copyright')} reserved.
              </Text>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Text variant="caption" className="text-white opacity-70">
                    {t('common.theme')}:
                  </Text>
                  <ThemeToggle />
                </div>
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
