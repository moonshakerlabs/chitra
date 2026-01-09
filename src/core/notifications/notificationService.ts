import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, ActionPerformed } from '@capacitor/local-notifications';
import { getPreferences } from '@/core/storage/preferences';

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
 * Check if notifications are supported
 */
export const isNotificationsSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initialize notifications and request permissions
 */
export const initializeNotifications = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    console.log('Notifications not supported on web');
    return false;
  }

  try {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return false;
  }
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

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Vaccination Due: ${vaccineName}`,
          body: hospitalName 
            ? `Time for vaccination at ${hospitalName}${doctorName ? ` with Dr. ${doctorName}` : ''}`
            : 'Tap to mark as completed or snooze',
          schedule: { at: scheduleDate },
          actionTypeId: 'VACCINATION_ACTION',
          extra: {
            type: 'vaccination',
            vaccinationId,
            vaccineName,
            hospitalName,
            doctorName,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule vaccination reminder:', error);
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

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Reminder: ${vaccineName}`,
          body: 'Vaccination still pending. Have you completed it?',
          schedule: { at: scheduleDate },
          actionTypeId: 'VACCINATION_ACTION',
          extra: {
            type: 'vaccination_followup',
            vaccinationId,
            vaccineName,
            hospitalName,
            doctorName,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule vaccination follow-up:', error);
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

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Medicine Time: ${medicineName}`,
          body: 'Tap to mark as taken or snooze',
          schedule: { at: reminderTime },
          actionTypeId: 'MEDICINE_ACTION',
          extra: {
            type: 'medicine',
            scheduleId,
            medicineName,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule medicine reminder:', error);
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

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Reminder: ${medicineName}`,
          body: 'Medicine intake still pending',
          schedule: { at: scheduleDate },
          actionTypeId: 'MEDICINE_ACTION',
          extra: {
            type: 'medicine_followup',
            scheduleId,
            medicineName,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule medicine follow-up:', error);
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

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Feeding Time: ${feedingName}`,
          body: 'Tap to mark as done or snooze',
          schedule: { at: reminderTime },
          actionTypeId: 'FEEDING_ACTION',
          extra: {
            type: 'feeding',
            scheduleId,
            feedingName,
            profileId,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule feeding reminder:', error);
  }
};

/**
 * Cancel a specific notification
 */
export const cancelNotification = async (notificationId: number): Promise<void> => {
  if (!isNotificationsSupported()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  } catch (error) {
    console.error('Failed to cancel notification:', error);
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

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
};

/**
 * Register notification action types
 */
export const registerNotificationActions = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

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
};

/**
 * Add listener for notification actions
 */
export const addNotificationActionListener = (
  callback: (action: ActionPerformed) => void
): void => {
  if (!isNotificationsSupported()) return;

  LocalNotifications.addListener('localNotificationActionPerformed', callback);
};

/**
 * Remove all notification listeners
 */
export const removeAllNotificationListeners = async (): Promise<void> => {
  if (!isNotificationsSupported()) return;

  await LocalNotifications.removeAllListeners();
};
