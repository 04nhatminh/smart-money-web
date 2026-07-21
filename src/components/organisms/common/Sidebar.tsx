'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogoutButton } from '@/components/molecules/auth';
import { MdDashboard, MdPersonOutline, MdPieChart, MdFolderOpen, MdInsights, MdSwapHoriz, MdChevronLeft, MdChevronRight } from 'react-icons/md';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMounted?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  isMounted = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('sidebar.dashboard'),
      href: `/${locale}/dashboard`,
      icon: <MdDashboard className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'transactions',
      label: t('sidebar.transactions'),
      href: `/${locale}/transactions`,
      icon: <MdSwapHoriz className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'budgets',
      label: t('sidebar.budgets'),
      href: `/${locale}/budgets`,
      icon: <MdPieChart className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'analysis',
      label: t('sidebar.analysis'),
      href: `/${locale}/analysis`,
      icon: <MdInsights className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'projects',
      label: t('sidebar.projects'),
      href: `/${locale}/projects`,
      icon: <MdFolderOpen className="w-5 h-5 flex-shrink-0" />,
    },
    {
      id: 'profile',
      label: t('sidebar.profile'),
      href: `/${locale}/profile`,
      icon: <MdPersonOutline className="w-5 h-5 flex-shrink-0" />,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`min-h-screen flex flex-col fixed left-0 top-0 pt-16 sm:pt-20 shadow-lg z-45 ${
          isMounted ? 'transition-all duration-300 ease-in-out' : 'transition-none'
        } ${
          isCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: colors.surface.primary, borderRightColor: colors.border.light, borderRightWidth: '1px' }}
      >
        {/* Toggle Collapse Header for PC (Desktop) */}
        <div
          className={`hidden lg:flex items-center ${
            isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-5 py-3'
          } border-b transition-colors duration-200`}
          style={{ borderColor: colors.border.light }}
        >
          {!isCollapsed && (
            <span
              className="text-xs font-bold uppercase tracking-wider truncate select-none"
              style={{ color: colors.text.secondary }}
            >
              {t('sidebar.menu') || 'Danh mục'}
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-1.5 rounded-lg border transition-all duration-200 hover:cursor-pointer shadow-xs"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.interactive.primary}15`;
              e.currentTarget.style.borderColor = colors.interactive.primary;
              e.currentTarget.style.color = colors.interactive.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.primary;
              e.currentTarget.style.borderColor = colors.border.light;
              e.currentTarget.style.color = colors.text.primary;
            }}
            title={isCollapsed ? (t('sidebar.expand') || 'Mở rộng') : (t('sidebar.collapse') || 'Thu nhỏ')}
          >
            {isCollapsed ? (
              <MdChevronRight className="w-5 h-5" />
            ) : (
              <MdChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className={`flex-1 ${isCollapsed ? 'px-3' : 'px-6'} py-4 space-y-2`}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isHovered = hoveredId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  if (onClose) onClose();
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'gap-3 px-4'
                } py-3 rounded-lg transition-all duration-200 hover:cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2`}
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
                <span className={`font-medium truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
