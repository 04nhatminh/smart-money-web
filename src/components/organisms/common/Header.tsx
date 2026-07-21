'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Button, Heading, Text } from '@/components/atoms';
import { ThemeToggle, LanguageToggle } from '@/components/molecules';
import { useTheme } from '@/context';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { HealthCheckResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/constants/api';
import { NavItem } from './Sidebar';

interface HeaderProps {
  navItems?: Partial<NavItem>[];
  appName?: string;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  navItems = [],
  appName = 'SmartMoney',
  showSidebarToggle = false,
  onToggleSidebar,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const { colors, colorScheme } = useTheme();
  const t = useTranslations();
  const { token, isInitializing, user, logout } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!token || !user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiClient.get<any>('/api/v1/notifications');
      let notifs = [];
      if (res && res.success && res.data) {
        notifs = res.data;
      } else if (res && Array.isArray(res)) {
        notifs = res;
      }
      const count = notifs.filter((n: any) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleNotificationsChanged = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notifications-changed', handleNotificationsChanged);
    return () => {
      window.removeEventListener('notifications-changed', handleNotificationsChanged);
    };
  }, [token, user]);

  const handleLoginClick = () => {
    router.push(`/${locale}/login`);
  };

  const handleSignupClick = () => {
    router.push(`/${locale}/register`);
  };

  const handleNotificationClick = () => {
    router.push(`/${locale}/notifications`);
  };

  const handleLogout = () => {
    logout();
    setOpenUserMenu(false);
    router.push(`/${locale}`);
  };

  const handleProfileClick = () => {
    router.push(`/${locale}/profile`);
    setOpenUserMenu(false);
  };

  const handleDashboardClick = () => {
    router.push(`/${locale}/dashboard`);
    setOpenUserMenu(false);
  };

  const showAuthActions = !isInitializing && !token;
  const showUserActions = !isInitializing && token && user;

  // Get avatar initials from fullName or username
  const getAvatarInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.username?.charAt(0).toUpperCase() || '?';
  };

  return (
    <header className="shadow-md transition-colors sticky top-0 z-50" style={{ backgroundColor: colors.background.primary, borderBottomColor: colors.border.light, borderBottomWidth: '1px' }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
        <div className="flex items-center py-2 relative h-full justify-between">
          <div className="flex items-center">
            {/* Sidebar Toggle Hamburger - Left on mobile */}
            {showSidebarToggle && (
              <button
                onClick={onToggleSidebar}
                className="p-2 mr-2 rounded-lg lg:hidden hover:cursor-pointer transition-colors duration-200"
                style={{
                  color: colors.text.primary,
                }}
                title="Toggle Sidebar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            {/* Logo - Left */}
            <Link href={token ? `/${locale}/dashboard` : `/${locale}`} className="flex items-center justify-start gap-1.5 sm:gap-3 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt={appName} className="h-8 w-8 sm:h-14 sm:w-14 object-contain flex-shrink-0" style={{ filter: colorScheme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
              <Heading
                level={1}
                className="text-lg sm:text-2xl md:text-3xl m-0 font-bold hidden sm:flex items-center"
              >
                <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.primary }}>Smart</span>
                <span style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.tertiary }}>Money</span>
              </Heading>
            </Link>
          </div>

          {/* Actions - Right */}
          <div className="flex gap-2 sm:gap-4 items-center">
            <ThemeToggle />
            <LanguageToggle />
            {showAuthActions && (
              <>
                <Button variant="secondary" size="md" className="hidden sm:block" onClick={handleLoginClick}>
                  {t('finance.hero.login')}
                </Button>
                <Button variant="primary" size="md" className="hidden sm:block" onClick={handleSignupClick}>
                  {t('finance.hero.cta')}
                </Button>
                <Button variant="primary" size="sm" className="sm:hidden" onClick={handleLoginClick}>
                  {t('finance.hero.login')}
                </Button>
              </>
            )}

            {showUserActions && (
              <div className="flex gap-2 sm:gap-4 items-center">
                {/* Notification Bell */}
                <button
                  onClick={handleNotificationClick}
                  className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center relative hover:cursor-pointer"
                  style={{
                    backgroundColor: `${colors.interactive.primary}10`,
                    color: colors.interactive.primary,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}20`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`}
                  title={t('common.notifications') || 'Notifications'}
                >
                  {/* Bell Icon SVG */}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: colors.interactive.danger }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Avatar - Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenUserMenu(!openUserMenu)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-200 hover:opacity-80 hover:cursor-pointer"
                    style={{ backgroundColor: colors.interactive.primary }}
                    title={user?.fullName || user?.username}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName || user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getAvatarInitials()
                    )}
                  </button>

                  {/* User Menu Dropdown */}
                  {openUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-2 z-50"
                      style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}
                    >
                      {/* User Info */}
                      <div className="px-4 py-2 border-b" style={{ borderColor: colors.border.light }}>
                        <p className="font-semibold" style={{ color: colors.text.primary }}>
                          {user?.fullName || user?.username}
                        </p>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={handleDashboardClick}
                        className="w-full text-left px-4 py-2 hover:bg-opacity-50 transition-colors hover:cursor-pointer"
                        style={{ color: colors.text.primary, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('common.dashboard') || 'Dashboard'}
                      </button>

                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 hover:bg-opacity-50 transition-colors hover:cursor-pointer"
                        style={{ color: colors.text.primary, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('common.profile') || 'Profile'}
                      </button>

                      <div style={{ borderColor: colors.border.light, borderTopWidth: '1px' }}></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 transition-colors hover:cursor-pointer"
                        style={{ color: colors.interactive.danger, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.danger}10`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {t('common.logout') || 'Logout'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
