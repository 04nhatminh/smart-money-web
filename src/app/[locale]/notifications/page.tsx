'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const t = useTranslations();

  // Mock notifications data - in real app, this would come from API
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: t('notifications.welcome') || 'Welcome',
      message: 'Welcome to SmartMoney!',
      type: 'success',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: '2',
      title: t('notifications.accountUpdated') || 'Account Updated',
      message: 'Your profile information has been updated successfully.',
      type: 'info',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: false,
    },
    {
      id: '3',
      title: t('notifications.transaction') || 'Transaction Confirmed',
      message: 'Your recent transaction has been confirmed.',
      type: 'success',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return colors.interactive.success || '#10B981';
      case 'error':
        return colors.interactive.danger || '#EF4444';
      case 'warning':
        return colors.interactive.secondary || '#F59E0B';
      case 'info':
      default:
        return colors.interactive.primary || '#3B82F6';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} style={{ color: colors.interactive.primary }}>
              {t('common.notifications') || 'Notifications'}
            </Heading>
            <Text style={{ color: colors.text.secondary }}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You are all caught up!'}
            </Text>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              {t('notifications.markAllAsRead') || 'Mark All as Read'}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: colors.text.secondary }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <Heading level={3} style={{ color: colors.text.primary }}>
                {t('notifications.noNotifications') || 'No Notifications'}
              </Heading>
              <Text style={{ color: colors.text.secondary }}>
                {t('notifications.noNotificationsDesc') || 'You don\'t have any notifications yet.'}
              </Text>
            </Card>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className="p-4 transition-all duration-200 border-l-4 rounded-lg"
                style={{
                  backgroundColor: notification.read
                    ? colors.background.primary
                    : `${colors.interactive.primary}08`,
                  borderLeftColor: getNotificationIconColor(notification.type),
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Icon and Content */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${getNotificationIconColor(notification.type)}20` }}
                    >
                      {notification.type === 'success' && (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: getNotificationIconColor(notification.type) }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {notification.type === 'error' && (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: getNotificationIconColor(notification.type) }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {notification.type === 'warning' && (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: getNotificationIconColor(notification.type) }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {notification.type === 'info' && (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: getNotificationIconColor(notification.type) }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Heading
                          level={4}
                          className="m-0"
                          style={{ color: colors.text.primary }}
                        >
                          {notification.title}
                        </Heading>
                        {!notification.read && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors.interactive.primary }}
                          ></span>
                        )}
                      </div>
                      <Text
                        className="mt-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {notification.message}
                      </Text>
                      <Text
                        className="text-sm mt-2"
                        style={{ color: colors.text.tertiary }}
                      >
                        {formatTime(notification.timestamp)}
                      </Text>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 rounded hover:bg-opacity-20 transition-colors"
                        style={{
                          backgroundColor: `${colors.interactive.primary}20`,
                          color: colors.interactive.primary,
                        }}
                        title="Mark as read"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-1 rounded hover:bg-opacity-20 transition-colors"
                      style={{
                        backgroundColor: `${colors.interactive.danger}20`,
                        color: colors.interactive.danger,
                      }}
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
