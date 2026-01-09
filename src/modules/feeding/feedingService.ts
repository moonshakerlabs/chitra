import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { FeedingSchedule, FeedingLog } from '@/core/types';

/**
 * Get all feeding schedules for a profile
 */
export const getAllFeedingSchedules = async (profileId?: string): Promise<FeedingSchedule[]> => {
  const db = await getDatabase();
  const schedules = await db.getAll('feedingSchedules');
  const filtered = profileId
    ? schedules.filter(s => s.profileId === profileId)
    : schedules;
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get active feeding schedules
 */
export const getActiveFeedingSchedules = async (profileId?: string): Promise<FeedingSchedule[]> => {
  const all = await getAllFeedingSchedules(profileId);
  return all.filter(s => s.isActive);
};

/**
 * Get a feeding schedule by ID
 */
export const getFeedingScheduleById = async (id: string): Promise<FeedingSchedule | undefined> => {
  const db = await getDatabase();
  return db.get('feedingSchedules', id);
};

/**
 * Add a new feeding schedule
 */
export const addFeedingSchedule = async (
  schedule: Omit<FeedingSchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FeedingSchedule> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const newSchedule: FeedingSchedule = {
    ...schedule,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.put('feedingSchedules', newSchedule);
  return newSchedule;
};

/**
 * Update a feeding schedule
 */
export const updateFeedingSchedule = async (
  id: string,
  updates: Partial<Omit<FeedingSchedule, 'id' | 'profileId' | 'createdAt'>>
): Promise<FeedingSchedule | null> => {
  const db = await getDatabase();
  const existing = await db.get('feedingSchedules', id);

  if (!existing) return null;

  const updated: FeedingSchedule = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put('feedingSchedules', updated);
  return updated;
};

/**
 * Delete a feeding schedule
 */
export const deleteFeedingSchedule = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.get('feedingSchedules', id);

  if (!existing) return false;

  // Also delete associated logs
  const logs = await db.getAll('feedingLogs');
  for (const log of logs) {
    if (log.scheduleId === id) {
      await db.delete('feedingLogs', log.id);
    }
  }

  await db.delete('feedingSchedules', id);
  return true;
};

/**
 * Toggle feeding schedule active status
 */
export const toggleFeedingSchedule = async (id: string): Promise<FeedingSchedule | null> => {
  const schedule = await getFeedingScheduleById(id);
  if (!schedule) return null;

  return updateFeedingSchedule(id, { isActive: !schedule.isActive });
};

// ============ Feeding Logs ============

/**
 * Get all feeding logs
 */
export const getAllFeedingLogs = async (profileId?: string): Promise<FeedingLog[]> => {
  const db = await getDatabase();
  const logs = await db.getAll('feedingLogs');
  const filtered = profileId
    ? logs.filter(l => l.profileId === profileId)
    : logs;
  return filtered.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get feeding logs by schedule
 */
export const getFeedingLogsBySchedule = async (scheduleId: string): Promise<FeedingLog[]> => {
  const db = await getDatabase();
  const logs = await db.getAll('feedingLogs');
  return logs
    .filter(l => l.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get today's feeding logs
 */
export const getTodaysFeedingLogs = async (profileId?: string): Promise<FeedingLog[]> => {
  const today = new Date().toISOString().split('T')[0];
  const logs = await getAllFeedingLogs(profileId);
  return logs.filter(l => l.createdAt.startsWith(today));
};

/**
 * Create a feeding log (mark as completed)
 */
export const createFeedingLog = async (
  scheduleId: string,
  profileId: string
): Promise<FeedingLog> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const log: FeedingLog = {
    id: generateId(),
    scheduleId,
    profileId,
    completedAt: now,
    snoozed: false,
    createdAt: now,
  };

  await db.put('feedingLogs', log);
  return log;
};

/**
 * Snooze a feeding reminder
 */
export const snoozeFeedingReminder = async (
  scheduleId: string,
  profileId: string,
  minutes: number = 30
): Promise<FeedingLog> => {
  const db = await getDatabase();
  const now = new Date();
  const snoozeUntil = new Date(now.getTime() + minutes * 60 * 1000);

  const log: FeedingLog = {
    id: generateId(),
    scheduleId,
    profileId,
    completedAt: now.toISOString(),
    snoozed: true,
    snoozeUntil: snoozeUntil.toISOString(),
    createdAt: now.toISOString(),
  };

  await db.put('feedingLogs', log);
  return log;
};

/**
 * Get next feeding time based on schedule
 */
export const getNextFeedingTime = (schedule: FeedingSchedule): Date | null => {
  if (!schedule.isActive) return null;

  const now = new Date();

  if (schedule.reminderType === 'time' && schedule.reminderTime) {
    // Fixed time reminder
    const [hours, minutes] = schedule.reminderTime.split(':').map(Number);
    const nextTime = new Date();
    nextTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  } else if (schedule.reminderType === 'interval' && schedule.intervalHours) {
    // Interval-based reminder
    const nextTime = new Date(now.getTime() + schedule.intervalHours * 60 * 60 * 1000);
    return nextTime;
  }

  return null;
};
