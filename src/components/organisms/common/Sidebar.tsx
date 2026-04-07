'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogoutButton } from '@/components/molecules/auth';
import { MdDashboard, MdTrendingUp, MdPersonOutline, MdAccountBalanceWallet } from 'react-icons/md';

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

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: <MdDashboard className="w-5 h-5" />,
    },
    {
      id: 'goals',
      label: 'Saving Goals',
      href: `/${locale}/goals`,
      icon: <MdTrendingUp className="w-5 h-5" />,
    },
    {
      id: 'spending',
      label: 'Spending Plan',
      href: `/${locale}/spending`,
      icon: <MdAccountBalanceWallet className="w-5 h-5" />,
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
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: active ? colors.interactive.primary : 'transparent',
                color: active ? colors.text.inverse : colors.text.primary,
              }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 py-6 border-t" style={{ borderTopColor: colors.border.light }}>
        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.surface.secondary }}>
          <p className="text-xs font-medium mb-1" style={{ color: colors.text.secondary }}>
            Logged in as
          </p>
          <p className="text-sm font-semibold truncate">{user?.fullName || user?.username}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
};
