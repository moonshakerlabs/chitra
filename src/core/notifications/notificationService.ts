import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { getPreferences } from '@/core/storage/preferences';
import {
  isWebNotificationsSupported,
  requestWebNotificationPermission,
  scheduleWebNotification,
  cancelWebNotification,
  cancelAllWebNotifications,
  showWebNotification,
} from './webNotificationService';

export interface NotificationSettings {
  vaccinationRemindersEnabled: boolean;
  medicineRemindersEnabled: boolean;
  feedingRemindersEnabled: boolean;
}

// Notification IDs are based on entity IDs for easy cancellation
const generateNotificationId = (entityId: string): number => {
  let hash = 0;
  for (let i = 0; i < entityId.length; i++) {
    const char = entityId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Check if running on native platform
 * Works even when using remote server URL in capacitor config
 */
export const isNativePlatform = (): boolean => {
  // Check multiple indicators for native platform
  const capacitorNative = Capacitor.isNativePlatform();
  const hasNativeBridge = !!(window as any).Capacitor?.isNativePlatform?.();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  return capacitorNative || hasNativeBridge || isAndroid || isIOS;
};

/**
 * Check if notifications are supported (native or web)
 */
export const isNotificationsSupported = (): boolean => {
  return isNativePlatform() || isWebNotificationsSupported();
};

/**
 * Initialize notifications and request permissions
 */
export const initializeNotifications = async (): Promise<boolean> => {
  console.log('[Notifications] Initializing... Platform:', Capacitor.getPlatform(), 'Native:', isNativePlatform());
  
  if (isNativePlatform()) {
    try {
      // First check current permission status
      const currentStatus = await LocalNotifications.checkPermissions();
      console.log('[Notifications] Current permission status:', currentStatus.display);
      
      if (currentStatus.display === 'granted') {
        return true;
      }
      
      // Request permission if not granted
      const permission = await LocalNotifications.requestPermissions();
      console.log('[Notifications] Permission request result:', permission.display);
      return permission.display === 'granted';
    } catch (error) {
      console.error('[Notifications] Failed to initialize native notifications:', error);
      // Fall back to web notifications
      if (isWebNotificationsSupported()) {
        console.log('[Notifications] Falling back to web notifications');
        return await requestWebNotificationPermission();
      }
      return false;
    }
  } else if (isWebNotificationsSupported()) {
    console.log('[Notifications] Using web notifications fallback');
    return await requestWebNotificationPermission();
  }
  
  console.log('[Notifications] Notifications not supported on this platform');
  return false;
};

/**
 * Schedule a vaccination due date reminder
 */
export const scheduleVaccinationReminder = async (
  vaccinationId: string,
  vaccineName: string,
  dueDate: string,
  hospitalName?: string,
  doctorName?: string
): Promise<void> => {
  if (!isNotificationsSupported()) return;

  const prefs = await getPreferences();
  if (!prefs.vaccinationRemindersEnabled) return;

  const notificationId = generateNotificationId(vaccinationId);
  const scheduleDate = new Date(dueDate);
  scheduleDate.setHours(9, 0, 0, 0); // 9 AM on due date

  // Cancel any existing notification for this vaccination
  await cancelNotification(notificationId);

  if (scheduleDate <= new Date()) return; // Don't schedule past notifications

  const title = `Vaccination Due: ${vaccineName}`;
  const body = hospitalName 
    ? `Time for vaccination at ${hospitalName}${doctorName ? ` with Dr. ${doctorName}` : ''}`
    : 'Tap to mark as completed or snooze';
  const extra = {
    type: 'vaccination',
    vaccinationId,
    vaccineName,
    hospitalName,
    doctorName,
  };

  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { 
            at: scheduleDate,
            allowWhileIdle: true, // Required for Android Doze mode
          },
          actionTypeId: 'VACCINATION_ACTION',
          extra,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      console.log(`[Notifications] Native vaccination reminder scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('[Notifications] Failed to schedule native vaccination reminder:', error);
      // Fallback to web notification
      scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
    }
  } else {
    // Use web notifications
    scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
  }
};

/**
 * Schedule a follow-up vaccination reminder (for snooze or ignored)
 */
export const scheduleVaccinationFollowUp = async (
  vaccinationId: string,
  vaccineName: string,
  hoursFromNow: number,
  hospitalName?: string,
  doctorName?: string
): Promise<void> => {
  if (!isNotificationsSupported()) return;

  const notificationId = generateNotificationId(vaccinationId + '_followup');
  const scheduleDate = new Date();
  scheduleDate.setHours(scheduleDate.getHours() + hoursFromNow);

  const title = `Reminder: ${vaccineName}`;
  const body = 'Vaccination still pending. Have you completed it?';
  const extra = {
    type: 'vaccination_followup',
    vaccinationId,
    vaccineName,
    hospitalName,
    doctorName,
  };

  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { 
            at: scheduleDate,
            allowWhileIdle: true,
          },
          actionTypeId: 'VACCINATION_ACTION',
          extra,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      console.log(`[Notifications] Native vaccination follow-up scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('[Notifications] Failed to schedule native vaccination follow-up:', error);
      scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
    }
  } else {
    scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
  }
};

/**
 * Schedule a medicine reminder
 */
export const scheduleMedicineReminder = async (
  scheduleId: string,
  medicineName: string,
  reminderTime: Date
): Promise<void> => {
  if (!isNotificationsSupported()) return;

  const prefs = await getPreferences();
  if (!prefs.medicineRemindersEnabled) return;

  const notificationId = generateNotificationId(scheduleId + reminderTime.toISOString());

  if (reminderTime <= new Date()) return;

  const title = `Medicine Time: ${medicineName}`;
  const body = 'Tap to mark as taken or snooze';
  const extra = {
    type: 'medicine',
    scheduleId,
    medicineName,
  };

  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { 
            at: reminderTime,
            allowWhileIdle: true,
          },
          actionTypeId: 'MEDICINE_ACTION',
          extra,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      console.log(`[Notifications] Native medicine reminder scheduled for ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('[Notifications] Failed to schedule native medicine reminder:', error);
      scheduleWebNotification(notificationId, title, body, reminderTime, extra);
    }
  } else {
    scheduleWebNotification(notificationId, title, body, reminderTime, extra);
  }
};

/**
 * Schedule a medicine follow-up reminder (every 20 minutes if no action)
 */
export const scheduleMedicineFollowUp = async (
  scheduleId: string,
  medicineName: string,
  minutesFromNow: number = 20
): Promise<void> => {
  if (!isNotificationsSupported()) return;

  const notificationId = generateNotificationId(scheduleId + '_followup_' + Date.now());
  const scheduleDate = new Date();
  scheduleDate.setMinutes(scheduleDate.getMinutes() + minutesFromNow);

  const title = `Reminder: ${medicineName}`;
  const body = 'Medicine intake still pending';
  const extra = {
    type: 'medicine_followup',
    scheduleId,
    medicineName,
  };

  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { 
            at: scheduleDate,
            allowWhileIdle: true,
          },
          actionTypeId: 'MEDICINE_ACTION',
          extra,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      console.log(`[Notifications] Native medicine follow-up scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('[Notifications] Failed to schedule native medicine follow-up:', error);
      scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
    }
  } else {
    scheduleWebNotification(notificationId, title, body, scheduleDate, extra);
  }
};

/**
 * Schedule a feeding reminder
 */
export const scheduleFeedingReminder = async (
  scheduleId: string,
  feedingName: string,
  profileId: string,
  reminderTime: Date
): Promise<void> => {
  if (!isNotificationsSupported()) return;

  const prefs = await getPreferences();
  if (!prefs.feedingRemindersEnabled) return;

  const notificationId = generateNotificationId(scheduleId + reminderTime.toISOString());

  if (reminderTime <= new Date()) return;

  const title = `Feeding Time: ${feedingName}`;
  const body = 'Tap to mark as done or snooze';
  const extra = {
    type: 'feeding',
    scheduleId,
    feedingName,
    profileId,
  };

  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { 
            at: reminderTime,
            allowWhileIdle: true,
          },
          actionTypeId: 'FEEDING_ACTION',
          extra,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      console.log(`[Notifications] Native feeding reminder scheduled for ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('[Notifications] Failed to schedule native feeding reminder:', error);
      scheduleWebNotification(notificationId, title, body, reminderTime, extra);
    }
  } else {
    scheduleWebNotification(notificationId, title, body, reminderTime, extra);
  }
};

/**
 * Cancel a specific notification
 */
export const cancelNotification = async (notificationId: number): Promise<void> => {
  if (!isNotificationsSupported()) return;

  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error('[Notifications] Failed to cancel native notification:', error);
    }
  } else {
    cancelWebNotification(notificationId);
  }
};

/**
 * Cancel notification by entity ID
 */
export const cancelNotificationByEntityId = async (entityId: string): Promise<void> => {
  const notificationId = generateNotificationId(entityId);
  await cancelNotification(notificationId);
};

/**
 * Cancel all pending notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

  if (isNativePlatform()) {
    try {
      const pending = await LocalNotifications.getPending();
      console.log(`[Notifications] Cancelling ${pending.notifications.length} pending notifications`);
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('[Notifications] Failed to cancel all native notifications:', error);
    }
  } else {
    cancelAllWebNotifications();
  }
};

/**
 * Register notification action types
 */
export const registerNotificationActions = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

  // Only register action types on native platforms
  if (isNativePlatform()) {
    try {
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'VACCINATION_ACTION',
            actions: [
              { id: 'yes', title: 'Yes, Done' },
              { id: 'snooze', title: 'Snooze 6h' },
            ],
          },
          {
            id: 'MEDICINE_ACTION',
            actions: [
              { id: 'taken', title: 'Taken' },
              { id: 'snooze_10', title: 'Snooze 10m' },
              { id: 'snooze_30', title: 'Snooze 30m' },
            ],
          },
          {
            id: 'FEEDING_ACTION',
            actions: [
              { id: 'done', title: 'Done' },
              { id: 'snooze', title: 'Snooze 30m' },
            ],
          },
        ],
      });
      console.log('[Notifications] Action types registered successfully');
    } catch (error) {
      console.error('[Notifications] Failed to register notification actions:', error);
    }
  }
  // Web notifications don't support action types, but the click handler is set up
};

/**
 * Add listener for notification actions
 */
export const addNotificationActionListener = (
  callback: (action: ActionPerformed) => void
): void => {
  if (!isNotificationsSupported()) return;

  if (isNativePlatform()) {
    LocalNotifications.addListener('localNotificationActionPerformed', callback);
    console.log('[Notifications] Action listener registered');
  }
  // Web notification clicks are handled via the 'web-notification-click' custom event
};

/**
 * Remove all notification listeners
 */
export const removeAllNotificationListeners = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

  if (isNativePlatform()) {
    await LocalNotifications.removeAllListeners();
  }
};

/**
 * Test notification - fires immediately for debugging
 */
export const sendTestNotification = async (): Promise<boolean> => {
  console.log('[Notifications] Sending test notification...');
  console.log('[Notifications] Platform:', Capacitor.getPlatform());
  console.log('[Notifications] isNativePlatform:', isNativePlatform());
  
  if (isNativePlatform()) {
    try {
      // Check current permission
      const permStatus = await LocalNotifications.checkPermissions();
      console.log('[Notifications] Permission status:', permStatus.display);
      
      if (permStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        console.log('[Notifications] Permission request result:', requestResult.display);
        if (requestResult.display !== 'granted') {
          console.log('[Notifications] Permission denied, using web fallback');
          showWebNotification('Test Notification', 'Notifications are working! (Web fallback)', { type: 'test' });
          return true;
        }
      }
      
      // Schedule notification for 3 seconds from now
      const scheduleTime = new Date(Date.now() + 3000);
      const notificationId = Math.floor(Math.random() * 100000);
      
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title: 'Test Notification',
          body: 'Notifications are working correctly!',
          schedule: {
            at: scheduleTime,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#E91E63',
        }],
      });
      
      console.log('[Notifications] Test notification scheduled for:', scheduleTime.toLocaleString());
      
      // Also list pending notifications
      const pending = await LocalNotifications.getPending();
      console.log('[Notifications] Pending notifications:', pending.notifications.length);
      
      return true;
    } catch (error) {
      console.error('[Notifications] Failed to send test notification:', error);
      // Fallback to web
      showWebNotification('Test Notification', 'Notifications working! (Web fallback)', { type: 'test' });
      return true;
    }
  } else if (isWebNotificationsSupported()) {
    showWebNotification('Test Notification', 'Notifications are working correctly!', { type: 'test' });
    return true;
  }
  
  console.log('[Notifications] No notification method available');
  return false;
};

// checkNotificationPermission is exported from permissionService.ts
