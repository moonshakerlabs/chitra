import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { FeedingSchedule, FeedingLog, FeedingType, QuantityUnit, FeedingStatistics } from '@/core/types';

// ============ Feeding Schedules ============

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
    feedingType: schedule.feedingType || 'breast_milk',
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
  return logs.filter(l => l.createdAt.startsWith(today) && !l.snoozed);
};

/**
 * Get feeding logs for date range
 */
export const getFeedingLogsForDateRange = async (
  profileId: string,
  startDate: string,
  endDate: string
): Promise<FeedingLog[]> => {
  const logs = await getAllFeedingLogs(profileId);
  return logs.filter(l => {
    const logDate = l.createdAt.split('T')[0];
    return logDate >= startDate && logDate <= endDate && !l.snoozed;
  });
};

/**
 * Create a feeding log (enhanced with type and quantity)
 */
export const createFeedingLog = async (
  scheduleId: string | null,
  profileId: string,
  options?: {
    feedingType?: FeedingType;
    quantity?: number;
    quantityUnit?: QuantityUnit;
    durationMinutes?: number;
    notes?: string;
  }
): Promise<FeedingLog> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Get feeding type from schedule if not provided
  let feedingType = options?.feedingType || 'breast_milk';
  if (scheduleId && !options?.feedingType) {
    const schedule = await getFeedingScheduleById(scheduleId);
    if (schedule?.feedingType) {
      feedingType = schedule.feedingType;
    }
  }

  const log: FeedingLog = {
    id: generateId(),
    scheduleId: scheduleId || undefined,
    profileId,
    feedingType,
    quantity: options?.quantity,
    quantityUnit: options?.quantityUnit,
    durationMinutes: options?.durationMinutes,
    notes: options?.notes,
    completedAt: now,
    snoozed: false,
    createdAt: now,
  };

  await db.put('feedingLogs', log);
  return log;
};

/**
 * Update a feeding log
 */
export const updateFeedingLog = async (
  id: string,
  updates: Partial<Omit<FeedingLog, 'id' | 'profileId' | 'createdAt'>>
): Promise<FeedingLog | null> => {
  const db = await getDatabase();
  const existing = await db.get('feedingLogs', id);

  if (!existing) return null;

  const updated: FeedingLog = {
    ...existing,
    ...updates,
  };

  await db.put('feedingLogs', updated);
  return updated;
};

/**
 * Delete a feeding log
 */
export const deleteFeedingLog = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  await db.delete('feedingLogs', id);
  return true;
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
    feedingType: 'breast_milk',
    completedAt: now.toISOString(),
    snoozed: true,
    snoozeUntil: snoozeUntil.toISOString(),
    createdAt: now.toISOString(),
  };

  await db.put('feedingLogs', log);
  return log;
};

/**
 * Get feeding statistics
 */
export const getFeedingStatistics = async (profileId: string): Promise<FeedingStatistics> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const allLogs = await getAllFeedingLogs(profileId);
  const validLogs = allLogs.filter(l => !l.snoozed);
  
  // Today's logs
  const todaysLogs = validLogs.filter(l => l.createdAt >= todayStart);
  
  // Week's logs
  const weeksLogs = validLogs.filter(l => l.createdAt.split('T')[0] >= weekAgo);
  
  // Count by type
  const feedingsByType: { [key in FeedingType]?: number } = {};
  for (const log of validLogs) {
    const type = log.feedingType || 'breast_milk';
    feedingsByType[type] = (feedingsByType[type] || 0) + 1;
  }
  
  // Most common type
  let mostCommonType: FeedingType | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(feedingsByType)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type as FeedingType;
    }
  }
  
  // Total quantity today
  const totalQuantityToday: { [key in QuantityUnit]?: number } = {};
  for (const log of todaysLogs) {
    if (log.quantity && log.quantityUnit) {
      totalQuantityToday[log.quantityUnit] = (totalQuantityToday[log.quantityUnit] || 0) + log.quantity;
    }
  }
  
  // Average interval between feedings
  let averageInterval: number | null = null;
  if (todaysLogs.length > 1) {
    const sortedLogs = [...todaysLogs].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let totalIntervalMs = 0;
    for (let i = 1; i < sortedLogs.length; i++) {
      totalIntervalMs += new Date(sortedLogs[i].createdAt).getTime() - new Date(sortedLogs[i-1].createdAt).getTime();
    }
    averageInterval = (totalIntervalMs / (sortedLogs.length - 1)) / (60 * 60 * 1000); // Convert to hours
  }
  
  // Average feedings per day (last 7 days)
  const daysWithLogs = new Set(weeksLogs.map(l => l.createdAt.split('T')[0])).size;
  const averageFeedingsPerDay = daysWithLogs > 0 ? weeksLogs.length / daysWithLogs : 0;
  
  return {
    totalFeedingsToday: todaysLogs.length,
    totalFeedingsWeek: weeksLogs.length,
    averageFeedingsPerDay: Math.round(averageFeedingsPerDay * 10) / 10,
    mostCommonType,
    totalQuantityToday,
    averageInterval: averageInterval ? Math.round(averageInterval * 10) / 10 : null,
    feedingsByType,
  };
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

/**
 * Get feeding type display name
 */
export const getFeedingTypeName = (type: FeedingType): string => {
  const names: Record<FeedingType, string> = {
    breast_milk: 'Breast Milk',
    formula: 'Formula',
    solid_food: 'Solid Food',
    water: 'Water',
    other: 'Other',
  };
  return names[type] || type;
};

/**
 * Get feeding type icon/emoji
 */
export const getFeedingTypeEmoji = (type: FeedingType): string => {
  const emojis: Record<FeedingType, string> = {
    breast_milk: '🤱',
    formula: '🍼',
    solid_food: '🥣',
    water: '💧',
    other: '🍴',
  };
  return emojis[type] || '🍼';
};
