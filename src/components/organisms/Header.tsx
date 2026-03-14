'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navItems?: NavItem[];
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  navItems = [],
  title = 'My Application',
}) => {
  const { colors } = useTheme();

  return (
    <header className="shadow-md transition-colors" style={{ backgroundColor: colors.surface.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Heading level={1} className="text-2xl">
            {title}
          </Heading>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-medium transition-colors hover:opacity-70"
                style={{ color: colors.text.primary }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
