'use client';

import React from 'react';
import { Button, Heading } from '@/components/atoms';

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
  return (
    <header className="bg-white border-b border-gray-200 shadow-md">
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
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
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
