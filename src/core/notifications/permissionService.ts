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
 * Check if running on native platform - works with remote server URL
 */
const isNativePlatform = (): boolean => {
  const capacitorNative = Capacitor.isNativePlatform();
  const hasNativeBridge = !!(window as any).Capacitor?.isNativePlatform?.();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  return capacitorNative || hasNativeBridge || isAndroid || isIOS;
};

/**
 * Check the current notification permission status
 */
export const checkNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  console.log('[Permissions] Checking notification permission...');
  console.log('[Permissions] Platform:', Capacitor.getPlatform(), 'Native:', isNativePlatform());
  
  if (isNativePlatform()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      console.log('[Permissions] Native permission status:', result.display);
      return {
        granted: result.display === 'granted',
        deniedPermanently: result.display === 'denied',
      };
    } catch (error) {
      console.error('[Permissions] Error checking native notification permissions:', error);
      // Try web fallback
      if (isWebNotificationsSupported()) {
        const permission = getWebNotificationPermission();
        return {
          granted: permission === 'granted',
          deniedPermanently: permission === 'denied',
        };
      }
      return { granted: false, deniedPermanently: false };
    }
  } else if (isWebNotificationsSupported()) {
    const permission = getWebNotificationPermission();
    console.log('[Permissions] Web permission status:', permission);
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
  console.log('[Permissions] Requesting notification permission...');
  
  if (isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('[Permissions] Native permission request result:', result.display);
      return result.display === 'granted';
    } catch (error) {
      console.error('[Permissions] Error requesting native notification permissions:', error);
      // Try web fallback
      if (isWebNotificationsSupported()) {
        return await requestWebNotificationPermission();
      }
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
