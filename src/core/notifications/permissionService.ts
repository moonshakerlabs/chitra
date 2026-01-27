import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  isWebNotificationsSupported, 
  requestWebNotificationPermission,
  getWebNotificationPermission,
} from './webNotificationService';

export interface NotificationPermissionStatus {
  granted: boolean;
  deniedPermanently: boolean;
}

/**
 * Check the current notification permission status
 */
export const checkNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return {
        granted: result.display === 'granted',
        deniedPermanently: result.display === 'denied',
      };
    } catch (error) {
      console.error('Error checking native notification permissions:', error);
      return { granted: false, deniedPermanently: false };
    }
  } else if (isWebNotificationsSupported()) {
    const permission = getWebNotificationPermission();
    return {
      granted: permission === 'granted',
      deniedPermanently: permission === 'denied',
    };
  }
  return { granted: false, deniedPermanently: false };
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting native notification permissions:', error);
      return false;
    }
  } else if (isWebNotificationsSupported()) {
    return await requestWebNotificationPermission();
  }
  return false;
};

/**
 * Check if we can show notifications (permission granted + enabled in preferences)
 */
export const canShowNotifications = async (): Promise<boolean> => {
  const { granted } = await checkNotificationPermission();
  return granted;
};
