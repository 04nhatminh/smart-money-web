'use client';

import React from 'react';
import { Button, Text } from '@/components/atoms';
import { ThemeToggle, LanguageToggle } from '@/components/molecules';
import { useTheme } from '@/context';

interface FooterProps {
  year?: number;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  year = new Date().getFullYear(),
  companyName = 'My Company',
}) => {
  const { colors } = useTheme();

  return (
    <footer className="mt-12 shadow-lg transition-colors" style={{ backgroundColor: colors.surface.secondary, borderTopColor: colors.border.light, borderTopWidth: '1px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>About</Text>
            <Text variant="caption" style={{ color: colors.text.secondary }}>
              Building amazing products.
            </Text>
          </div>
          <div>
            <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>Links</Text>
            <ul className="space-y-2">
              <li>
                <a href="#" className="transition-colors hover:opacity-70" style={{ color: colors.text.secondary }}>
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:opacity-70" style={{ color: colors.text.secondary }}>
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:opacity-70" style={{ color: colors.text.secondary }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <Text className="font-semibold mb-4" style={{ color: colors.text.primary }}>Settings</Text>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Text variant="caption" style={{ color: colors.text.secondary }}>Theme:</Text>
                <ThemeToggle />
              </div>
              <LanguageToggle />
            </div>
          </div>
        </div>
        <div className="pt-8" style={{ borderTopColor: colors.border.light, borderTopWidth: '1px' }}>
          <Text variant="caption" className="text-center" style={{ color: colors.text.secondary }}>
            Copyright {year} {companyName}. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
};
