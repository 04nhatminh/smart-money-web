'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogoutButton } from '@/components/molecules/auth';
import { MdDashboard, MdPersonOutline, MdPieChart, MdFolderOpen } from 'react-icons/md';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: <MdDashboard className="w-5 h-5" />,
    },
    {
      id: 'budgets',
      label: 'Budgets',
      href: `/${locale}/budgets`,
      icon: <MdPieChart className="w-5 h-5" />,
    },
    {
      id: 'projects',
      label: 'Projects',
      href: `/${locale}/projects`,
      icon: <MdFolderOpen className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      href: `/${locale}/profile`,
      icon: <MdPersonOutline className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 pt-20 shadow-lg"
      style={{ backgroundColor: colors.surface.primary, borderRightColor: colors.border.light, borderRightWidth: '1px' }}
    >
      <div className="flex-1 px-6 py-8 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: active 
                  ? colors.interactive.primary 
                  : isHovered 
                  ? `${colors.interactive.primary}20`
                  : 'transparent',
                color: active ? colors.text.inverse : colors.text.primary,
              }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
