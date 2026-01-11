import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationPermissionStatus {
  granted: boolean;
  deniedPermanently: boolean;
}

/**
 * Check the current notification permission status
 */
export const checkNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!Capacitor.isNativePlatform()) {
    // Web - check browser Notification API
    if ('Notification' in window) {
      const permission = Notification.permission;
      return {
        granted: permission === 'granted',
        deniedPermanently: permission === 'denied',
      };
    }
    return { granted: false, deniedPermanently: false };
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return {
      granted: result.display === 'granted',
      deniedPermanently: result.display === 'denied',
    };
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return { granted: false, deniedPermanently: false };
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // Web - use browser Notification API
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if we can show notifications (permission granted + enabled in preferences)
 */
export const canShowNotifications = async (): Promise<boolean> => {
  const { granted } = await checkNotificationPermission();
  return granted;
};
