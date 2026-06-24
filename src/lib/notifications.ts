/**
 * Helper to get the localStorage key for a specific user
 */
const getReadNotificationsKey = (userId: string): string => `read_notifications_${userId}`;

/**
 * Get the list of read notification IDs for a user
 */
export function getReadNotificationIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(getReadNotificationsKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading read notifications from localStorage', e);
    return [];
  }
}

/**
 * Mark specific notification IDs as read for a user
 */
export function markNotificationsAsRead(userId: string, notificationIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getReadNotificationIds(userId);
    const updated = Array.from(new Set([...existing, ...notificationIds]));
    localStorage.setItem(getReadNotificationsKey(userId), JSON.stringify(updated));
  } catch (e) {
    console.error('Error writing read notifications to localStorage', e);
  }
}

/**
 * Mark all notification IDs as read for a user
 */
export function markAllNotificationsAsRead(userId: string, notificationIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getReadNotificationsKey(userId), JSON.stringify(notificationIds));
  } catch (e) {
    console.error('Error writing read notifications to localStorage', e);
  }
}
