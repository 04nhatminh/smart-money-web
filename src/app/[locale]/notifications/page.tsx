'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Alert } from '@/components/atoms';
import { Card } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { useGroups } from '@/hooks/useGroups';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MdCheck, MdClose, MdNotifications } from 'react-icons/md';

interface NotificationData {
  id: string;
  userId: string;
  content: string;
  deepLink: string | null;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { colors } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { acceptGroupInvite, declineGroupInvite } = useGroups();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Check auth
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Listen to new notifications from WebSocket
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newNotif = customEvent.detail;
      if (newNotif) {
        setNotifications(prev => [newNotif, ...prev]);
      }
    };
    window.addEventListener('notification-received', handleNewNotification);
    return () => {
      window.removeEventListener('notification-received', handleNewNotification);
    };
  }, []);

  // Load notifications (initial)
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications(0, true);
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

  const loadNotifications = async (pageNum = 0, isInitial = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<any>(`/api/v1/notifications?page=${pageNum}&size=${pageSize}`);
      let loadedNotifications: NotificationData[] = [];
      if (res && res.success && res.data) {
        loadedNotifications = res.data;
      } else if (res && Array.isArray(res)) {
        loadedNotifications = res;
      }

      if (isInitial) {
        setNotifications(loadedNotifications);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...loadedNotifications]);
        setPage(pageNum + 1);
      }

      if (loadedNotifications.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
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

  const handleMarkAllAsRead = async () => {
    if (user && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        try {
          setActionLoading('markAll');
          await apiClient.patch('/api/v1/notifications/read', { notificationIds: unreadIds });
          setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
          );
          window.dispatchEvent(new CustomEvent('notifications-changed'));
        } catch (err) {
          console.error('Failed to mark all notifications as read:', err);
          setError(t('errors.failedToUpdate') || 'Failed to mark notifications as read');
        } finally {
          setActionLoading(null);
        }
      }
    }
  };

  const handleToggleReadStatus = async (id: string, currentReadStatus: boolean) => {
    try {
      setActionLoading(id);
      await apiClient.patch('/api/v1/notifications/read', { notificationIds: [id] });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    } catch (err) {
      console.error('Failed to toggle notification read status:', err);
      setError(t('errors.failedToUpdate') || 'Failed to update notification status');
    } finally {
      setActionLoading(null);
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

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const displayedNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  if (isInitializing || (isInitialLoading && notifications.length === 0)) {
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
                disabled={actionLoading !== null}
              >
                {t('notifications.markAllAsRead') || 'Mark all as read'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadNotifications(0, true)}
              disabled={isLoading || isInitialLoading}
            >
              {t('analysis.refresh') || 'Refresh'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} />
        )}

        {success && (
          <Alert message={success} type="success" onClose={() => setSuccess(null)} />
        )}

        {/* Tabs */}
        <div className="flex border-b mb-6" style={{ borderColor: colors.border.light }}>
          <button
            onClick={() => setActiveTab('all')}
            className="px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 relative border-b-2 hover:cursor-pointer"
            style={{
              borderColor: activeTab === 'all' ? colors.interactive.primary : 'transparent',
              color: activeTab === 'all' ? colors.interactive.primary : colors.text.secondary,
            }}
          >
            {t('notifications.all') || 'All'}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className="px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 relative border-b-2 hover:cursor-pointer"
            style={{
              borderColor: activeTab === 'unread' ? colors.interactive.primary : 'transparent',
              color: activeTab === 'unread' ? colors.interactive.primary : colors.text.secondary,
            }}
          >
            {t('notifications.unread') || 'Unread'}
            {unreadNotificationsCount > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: colors.interactive.primary }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {displayedNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <MdNotifications className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.text.secondary }} />
              <Heading level={3}>
                {activeTab === 'unread'
                  ? (t('notifications.noUnreadNotifications') || 'No Unread Notifications')
                  : (t('notifications.noNotifications') || 'No Notifications')}
              </Heading>
              <Text style={{ color: colors.text.secondary }}>
                {activeTab === 'unread'
                  ? (t('notifications.noUnreadNotificationsDesc') || "You don't have any unread notifications.")
                  : (t('notifications.noNotificationsDesc') || "You don't have any notifications yet.")}
              </Text>
            </Card>
          ) : (
            <>
              {displayedNotifications.map(notification => {
                const token = getInviteToken(notification.deepLink);
                const isInvite = token !== null;
                const isUnread = !notification.read;

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

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isInvite && (
                        <>
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
                        </>
                      )}
                      {!notification.read && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleReadStatus(notification.id, notification.read)}
                          disabled={actionLoading !== null}
                        >
                          {t('notifications.markAsRead') || 'Mark as read'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}


            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
