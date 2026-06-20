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

interface NotificationData {
  id: string;
  userId: string;
  content: string;
  deepLink: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
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

  // Check auth
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<any>('/api/v1/notifications');
      // Backend returns CheckResponse<List<Notification>>
      if (res && res.success && res.data) {
        setNotifications(res.data);
      } else if (res && Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Could not load notifications from server.');
    } finally {
      setIsLoading(false);
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
            <Heading level={1} style={{ color: colors.interactive.primary }}>
              {t('common.notifications') || 'Notifications'}
            </Heading>
            <Text style={{ color: colors.text.secondary }}>
              {notifications.length > 0
                ? `You have ${notifications.length} notifications.`
                : 'All caught up!'}
            </Text>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={loadNotifications}
            >
              Refresh
            </Button>
          )}
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
              <Heading level={3} style={{ color: colors.text.primary }}>
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
              
              return (
                <div
                  key={notification.id}
                  className="p-5 transition-all duration-200 border-l-4 rounded-lg bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{
                    borderLeftColor: isInvite ? '#F59E0B' : colors.interactive.primary,
                    border: `1px solid ${colors.border.light}`,
                  }}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Heading
                        level={4}
                        className="m-0"
                        style={{ color: colors.text.primary }}
                      >
                        {isInvite ? 'Group Invitation' : 'Notification'}
                      </Heading>
                    </div>
                    <Text style={{ color: colors.text.secondary }}>
                      {notification.content}
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
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeclineInvite(notification.id, token)}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-1.5"
                        style={{ color: '#EF4444', borderColor: '#EF444420' }}
                      >
                        <MdClose size={16} />
                        Decline
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
