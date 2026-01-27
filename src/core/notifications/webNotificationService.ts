/**
 * Web Notification Service - Fallback for browser environments
 * Uses the browser's native Notification API
 */

interface WebNotification {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  extra?: Record<string, unknown>;
  timeoutId?: number;
}

// Store scheduled notifications in memory
const scheduledNotifications = new Map<number, WebNotification>();

/**
 * Check if web notifications are supported
 */
export const isWebNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Request web notification permission
 */
export const requestWebNotificationPermission = async (): Promise<boolean> => {
  if (!isWebNotificationsSupported()) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (error) {
    console.error('Failed to request web notification permission:', error);
    return false;
  }
};

/**
 * Check web notification permission status
 */
export const getWebNotificationPermission = (): 'granted' | 'denied' | 'default' => {
  if (!isWebNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Show an immediate web notification
 */
export const showWebNotification = (
  title: string,
  body: string,
  extra?: Record<string, unknown>
): void => {
  if (!isWebNotificationsSupported() || Notification.permission !== 'granted') {
    console.log('Web notifications not available or not permitted');
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: extra?.type as string || 'default',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Dispatch custom event for notification click handling
      window.dispatchEvent(new CustomEvent('web-notification-click', { detail: extra }));
    };

    // Auto close after 30 seconds
    setTimeout(() => notification.close(), 30000);
  } catch (error) {
    console.error('Failed to show web notification:', error);
  }
};

/**
 * Schedule a web notification for a future time
 */
export const scheduleWebNotification = (
  id: number,
  title: string,
  body: string,
  scheduledAt: Date,
  extra?: Record<string, unknown>
): void => {
  if (!isWebNotificationsSupported()) {
    return;
  }

  // Cancel existing notification with same ID
  cancelWebNotification(id);

  const now = new Date();
  const delay = scheduledAt.getTime() - now.getTime();

  if (delay <= 0) {
    // Show immediately if time has passed
    showWebNotification(title, body, extra);
    return;
  }

  // Schedule the notification
  const timeoutId = window.setTimeout(() => {
    showWebNotification(title, body, extra);
    scheduledNotifications.delete(id);
  }, delay);

  scheduledNotifications.set(id, {
    id,
    title,
    body,
    scheduledAt,
    extra,
    timeoutId,
  });

  console.log(`Web notification scheduled for ${scheduledAt.toLocaleString()}`);
};

/**
 * Cancel a scheduled web notification
 */
export const cancelWebNotification = (id: number): void => {
  const notification = scheduledNotifications.get(id);
  if (notification?.timeoutId) {
    window.clearTimeout(notification.timeoutId);
    scheduledNotifications.delete(id);
  }
};

/**
 * Cancel all scheduled web notifications
 */
export const cancelAllWebNotifications = (): void => {
  scheduledNotifications.forEach((notification) => {
    if (notification.timeoutId) {
      window.clearTimeout(notification.timeoutId);
    }
  });
  scheduledNotifications.clear();
};

/**
 * Get all pending web notifications
 */
export const getPendingWebNotifications = (): WebNotification[] => {
  return Array.from(scheduledNotifications.values());
};
