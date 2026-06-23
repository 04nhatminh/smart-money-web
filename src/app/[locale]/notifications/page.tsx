'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { useGroups } from '@/hooks/useGroups';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MdCheck, MdClose, MdNotifications } from 'react-icons/md';
import { getReadNotificationIds, markNotificationsAsRead } from '@/lib/notifications';

interface NotificationData {
  id: string;
  userId: string;
  content: string;
  deepLink: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { colors } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { acceptGroupInvite, declineGroupInvite } = useGroups();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load notifications and initial read status
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedReadIds = getReadNotificationIds(user.id);
      setReadIds(new Set(savedReadIds));
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  const parseNotificationContent = (content: string) => {
    if (content.startsWith('notification.notification_done|')) {
      const parts = content.split('|');
      if (parts.length >= 4) {
        const typeKey = parts[1];
        const amount = parts[2];
        const category = parts[3];

        const typeTranslated = typeKey === 'notification.expense'
          ? (t('notifications.expense') || 'Expense')
          : (t('notifications.income') || 'Income');

        const categoryTranslated = t(`categories.${category}`) || category;
        const formattedAmount = Number(amount).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');

        return t('notifications.notification_done', {
          type: typeTranslated,
          amount: formattedAmount,
          category: categoryTranslated,
        }) || `${typeTranslated} ${formattedAmount} VND in ${categoryTranslated}`;
      }
    }

    const inviteRegex = /You've been invited to join group "(.*)"\. Tap to accept\./;
    const match = content.match(inviteRegex);
    if (match) {
      const groupName = match[1];
      return t('notifications.inviteDescription', { groupName }) || `You've been invited to join group "${groupName}". Tap to accept.`;
    }

    return content;
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<any>('/api/v1/notifications');
      let loadedNotifications: NotificationData[] = [];
      // Backend returns CheckResponse<List<Notification>>
      if (res && res.success && res.data) {
        loadedNotifications = res.data;
      } else if (res && Array.isArray(res)) {
        loadedNotifications = res;
      }
      setNotifications(loadedNotifications);

      // Automatically mark fetched notifications as read in localStorage,
      // so next time user sees the header or reloads the page, they are read.
      if (user && loadedNotifications.length > 0) {
        const ids = loadedNotifications.map(n => n.id);
        markNotificationsAsRead(user.id, ids);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      const errMessage = err instanceof Error ? err.message : '';
      if (errMessage.toLowerCase().includes('failed to fetch') || errMessage.toLowerCase().includes('load notifications')) {
        setError(t('errors.failedToFetch') || 'Could not load notifications from server.');
      } else {
        setError(errMessage || t('errors.failedToFetch') || 'Could not load notifications from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = () => {
    if (user && notifications.length > 0) {
      const ids = notifications.map(n => n.id);
      markNotificationsAsRead(user.id, ids);
      setReadIds(new Set(ids));
    }
  };

  const getInviteToken = (deepLink: string | null) => {
    if (!deepLink) return null;
    const match = deepLink.match(/token=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleAcceptInvite = async (notifId: string, token: string) => {
    setActionLoading(notifId);
    setError(null);
    setSuccess(null);
    try {
      const res = await acceptGroupInvite(token);
      if (res.success) {
        setSuccess('Successfully joined the group!');
        // Remove or reload notifications
        setNotifications(prev => prev.filter(n => n.id !== notifId));
        // Redirect to groups tab in projects page
        router.push(`/${locale}/projects?tab=groups`);
      } else {
        setError(res.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvite = async (notifId: string, token: string) => {
    setActionLoading(notifId);
    setError(null);
    setSuccess(null);
    try {
      const res = await declineGroupInvite(token);
      if (res.success) {
        setSuccess('Declined group invitation.');
        setNotifications(prev => prev.filter(n => n.id !== notifId));
      } else {
        setError(res.error || 'Failed to decline invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notificationsPage.justNow') || 'just now';
    if (diffMins < 60) return t('notificationsPage.minsAgo', { mins: diffMins }) || `${diffMins}m ago`;
    if (diffHours < 24) return t('notificationsPage.hoursAgo', { hours: diffHours }) || `${diffHours}h ago`;
    if (diffDays < 7) return t('notificationsPage.daysAgo', { days: diffDays }) || `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  const unreadNotificationsCount = notifications.filter(n => !readIds.has(n.id)).length;

  if (isInitializing || isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Text>{t('common.loading') || 'Loading...'}</Text>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1}>
              {t('common.notifications') || 'Notifications'}
            </Heading>
            <Text style={{ color: colors.text.secondary }}>
              {unreadNotificationsCount > 0
                ? t('notificationsPage.unreadCount', { count: unreadNotificationsCount }) || `You have ${unreadNotificationsCount} unread notifications.`
                : t('notificationsPage.allCaughtUp') || 'All caught up!'}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                {t('notifications.markAllAsRead') || 'Mark all as read'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={loadNotifications}
              >
                {t('analysis.refresh') || 'Refresh'}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
            <Text className="font-semibold text-sm">{error}</Text>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
            <Text className="font-semibold text-sm">{success}</Text>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <MdNotifications className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.text.secondary }} />
              <Heading level={3}>
                {t('notifications.noNotifications') || 'No Notifications'}
              </Heading>
              <Text style={{ color: colors.text.secondary }}>
                {t('notifications.noNotificationsDesc') || 'You don\'t have any notifications yet.'}
              </Text>
            </Card>
          ) : (
            notifications.map(notification => {
              const token = getInviteToken(notification.deepLink);
              const isInvite = token !== null;
              const isUnread = !readIds.has(notification.id);

              return (
                <div
                  key={notification.id}
                  className="p-5 transition-all duration-200 border-l-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{
                    backgroundColor: isUnread ? `${colors.interactive.primary}0c` : colors.background.primary,
                    borderLeftColor: isInvite ? '#F59E0B' : colors.interactive.primary,
                    border: `1px solid ${isUnread ? colors.interactive.primary : colors.border.light}`,
                    boxShadow: isUnread ? `0 0 8px ${colors.interactive.primary}20` : 'none',
                  }}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: colors.interactive.primary }} 
                          title="Unread"
                        />
                      )}
                      <Heading
                        level={4}
                        style={{ fontWeight: isUnread ? 'bold' : 'normal' }}
                      >
                        {isInvite 
                          ? (t('notifications.groupInvitation') || 'Group Invitation')
                          : (t('notifications.notificationTitle') || 'Notification')}
                      </Heading>
                    </div>
                    <Text style={{ color: colors.text.secondary, fontWeight: isUnread ? '500' : 'normal' }}>
                      {parseNotificationContent(notification.content)}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      {formatTime(notification.createdAt)}
                    </Text>
                  </div>

                  {/* Actions (Invite accept/decline or standard dismiss) */}
                  {isInvite ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptInvite(notification.id, token)}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-1.5"
                      >
                        <MdCheck size={16} />
                        {t('common.accept') || 'Accept'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeclineInvite(notification.id, token)}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-1.5"
                      >
                        <MdClose size={16} />
                        {t('common.decline') || 'Decline'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
