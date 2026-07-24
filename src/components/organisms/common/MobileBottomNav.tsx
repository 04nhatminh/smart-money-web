'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { MdDashboard, MdPersonOutline, MdPieChart, MdFolderOpen, MdInsights, MdLightbulb, MdBarChart, MdSwapHoriz } from 'react-icons/md';

export const MobileBottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const navItems = [
    {
      id: 'dashboard',
      label: t('sidebar.dashboard'),
      href: `/${locale}/dashboard`,
      icon: <MdDashboard className="w-5 h-5" />,
    },
    {
      id: 'transactions',
      label: t('sidebar.transactions'),
      href: `/${locale}/transactions`,
      icon: <MdSwapHoriz className="w-5 h-5" />,
    },
    {
      id: 'budgets',
      label: t('sidebar.budgets'),
      href: `/${locale}/budgets`,
      icon: <MdPieChart className="w-5 h-5" />,
    },
    {
      id: 'analysis',
      label: t('sidebar.analysis'),
      href: `/${locale}/analysis`,
      icon: <MdInsights className="w-5 h-5" />,
    },
    {
      id: 'projects',
      label: t('sidebar.projects'),
      href: `/${locale}/projects`,
      icon: <MdFolderOpen className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: t('sidebar.profile'),
      href: `/${locale}/profile`,
      icon: <MdPersonOutline className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around shadow-lg border-t lg:hidden transition-colors"
      style={{
        backgroundColor: colors.surface.primary,
        borderTopColor: colors.border.light,
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] sm:text-xs font-medium focus:outline-none transition-colors relative"
          >
            {active && (
              <div
                className="absolute top-0 w-10 h-0.5 rounded-b-md"
                style={{ backgroundColor: colors.interactive.primary }}
              />
            )}
            <div
              className="p-1 px-3 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: active ? `${colors.interactive.primary}15` : 'transparent',
                color: active ? colors.interactive.primary : colors.text.secondary,
              }}
            >
              {item.icon}
            </div>
            <span
              className="truncate max-w-[60px] sm:max-w-none mt-0.5"
              style={{
                color: active ? colors.interactive.primary : colors.text.secondary,
                fontWeight: active ? 600 : 500,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
