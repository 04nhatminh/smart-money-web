'use client';

import React from 'react';
import { Button, Text, Heading } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';

interface FooterProps {
  year?: number;
  appName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  year = new Date().getFullYear(),
  appName = 'SmartMoney',
}) => {
  const { colors, colorScheme } = useTheme();
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
    <footer className="mt-12 transition-colors border-t" style={{ backgroundColor: colors.background.primary, borderTopColor: colors.border.light }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt={appName} className="h-12 w-12 object-contain flex-shrink-0" style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
                <Heading
                  level={2}
                  className="text-xl m-0 font-bold flex items-center"
                >
                  <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.primary }}>Smart</span>
                  <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.tertiary }}>Money</span>
                </Heading>
              </div>
              <Text variant="caption" style={{ color: colors.text.secondary }}>
                {t('finance.appDescription')}
              </Text>
            </div>

            {/* Product */}
            <div>
              <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>
                {t('common.features')}
              </Text>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80"
                      style={{ color: colors.text.secondary }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>
                {t('common.about')}
              </Text>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80"
                      style={{ color: colors.text.secondary }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>
                {t('common.settings')}
              </Text>
              <ul className="space-y-2">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition-colors hover:opacity-80"
                      style={{ color: colors.text.secondary }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTopColor: colors.border.light, borderTopWidth: '1px' }} className="py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Text variant="caption" style={{ color: colors.text.secondary }} className="text-center md:text-left">
                © {year} {appName}. {t('page.copyright')}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
