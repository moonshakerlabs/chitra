import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed } from '@capacitor/local-notifications';
import { getPreferences } from '@/core/storage/preferences';
import {
  isWebNotificationsSupported,
  requestWebNotificationPermission,
  scheduleWebNotification,
  cancelWebNotification,
  cancelAllWebNotifications,
  getWebNotificationPermission,
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
 * Check if notifications are supported (native or web)
 */
export const isNotificationsSupported = (): boolean => {
  return Capacitor.isNativePlatform() || isWebNotificationsSupported();
};

/**
 * Check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialize notifications and request permissions
 */
export const initializeNotifications = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Failed to initialize native notifications:', error);
      return false;
    }
  } else if (isWebNotificationsSupported()) {
    console.log('Using web notifications fallback');
    return await requestWebNotificationPermission();
  }
  
  console.log('Notifications not supported on this platform');
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { at: scheduleDate },
          actionTypeId: 'VACCINATION_ACTION',
          extra,
        }],
      });
      console.log(`Native vaccination reminder scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native vaccination reminder:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { at: scheduleDate },
          actionTypeId: 'VACCINATION_ACTION',
          extra,
        }],
      });
      console.log(`Native vaccination follow-up scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native vaccination follow-up:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { at: reminderTime },
          actionTypeId: 'MEDICINE_ACTION',
          extra,
        }],
      });
      console.log(`Native medicine reminder scheduled for ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native medicine reminder:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { at: scheduleDate },
          actionTypeId: 'MEDICINE_ACTION',
          extra,
        }],
      });
      console.log(`Native medicine follow-up scheduled for ${scheduleDate.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native medicine follow-up:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId,
          title,
          body,
          schedule: { at: reminderTime },
          actionTypeId: 'FEEDING_ACTION',
          extra,
        }],
      });
      console.log(`Native feeding reminder scheduled for ${reminderTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule native feeding reminder:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error('Failed to cancel native notification:', error);
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

  if (Capacitor.isNativePlatform()) {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('Failed to cancel all native notifications:', error);
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
  if (Capacitor.isNativePlatform()) {
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
    } catch (error) {
      console.error('Failed to register notification actions:', error);
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

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.addListener('localNotificationActionPerformed', callback);
  }
  // Web notification clicks are handled via the 'web-notification-click' custom event
};

/**
 * Remove all notification listeners
 */
export const removeAllNotificationListeners = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.removeAllListeners();
  }
};

// checkNotificationPermission is exported from permissionService.ts
