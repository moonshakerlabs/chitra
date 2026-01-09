import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { MedicineSchedule, MedicineLog } from '@/core/types';

const MAX_SNOOZE_COUNT = 3;
const MAX_SNOOZE_MINUTES = 30;
const DEFAULT_REMINDER_INTERVAL_MINUTES = 20;

/**
 * Get all medicine schedules for a profile
 */
export const getAllMedicineSchedules = async (profileId: string): Promise<MedicineSchedule[]> => {
  const db = await getDatabase();
  const schedules = await db.getAll('medicineSchedules');
  return schedules
    .filter(s => s.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get active medicine schedules for a profile
 */
export const getActiveMedicineSchedules = async (profileId: string): Promise<MedicineSchedule[]> => {
  const all = await getAllMedicineSchedules(profileId);
  return all.filter(s => s.isActive && !s.isPaused);
};

/**
 * Get a medicine schedule by ID
 */
export const getMedicineScheduleById = async (id: string): Promise<MedicineSchedule | undefined> => {
  const db = await getDatabase();
  return db.get('medicineSchedules', id);
};

/**
 * Add a new medicine schedule
 */
export const addMedicineSchedule = async (
  profileId: string,
  medicineName: string,
  timesPerDay: number,
  intervalHours: number,
  totalDays?: number,
  totalReminders?: number
): Promise<MedicineSchedule> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const schedule: MedicineSchedule = {
    id: generateId(),
    profileId,
    medicineName,
    timesPerDay,
    intervalHours,
    totalDays,
    totalReminders,
    startDate: now,
    isActive: true,
    isPaused: false,
    remindersSent: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.put('medicineSchedules', schedule);
  return schedule;
};

/**
 * Update a medicine schedule
 */
export const updateMedicineSchedule = async (
  id: string,
  updates: Partial<Omit<MedicineSchedule, 'id' | 'profileId' | 'createdAt'>>
): Promise<MedicineSchedule | null> => {
  const db = await getDatabase();
  const existing = await db.get('medicineSchedules', id);

  if (!existing) return null;

  const updated: MedicineSchedule = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put('medicineSchedules', updated);
  return updated;
};

/**
 * Delete a medicine schedule (also deletes associated logs)
 */
export const deleteMedicineSchedule = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  try {
    // Note: We keep logs for history, only delete the schedule
    await db.delete('medicineSchedules', id);
    return true;
  } catch {
    return false;
  }
};

/**
 * Pause/Resume a medicine schedule
 */
export const toggleMedicineSchedulePause = async (id: string): Promise<MedicineSchedule | null> => {
  const db = await getDatabase();
  const existing = await db.get('medicineSchedules', id);

  if (!existing) return null;

  return updateMedicineSchedule(id, { isPaused: !existing.isPaused });
};

/**
 * Stop a medicine schedule (mark as inactive)
 */
export const stopMedicineSchedule = async (id: string): Promise<MedicineSchedule | null> => {
  return updateMedicineSchedule(id, { isActive: false });
};

// ============ Medicine Logs ============

/**
 * Get all medicine logs for a profile
 */
export const getAllMedicineLogs = async (profileId: string): Promise<MedicineLog[]> => {
  const db = await getDatabase();
  const logs = await db.getAll('medicineLogs');
  return logs
    .filter(l => l.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get medicine logs for a specific schedule
 */
export const getMedicineLogsBySchedule = async (scheduleId: string): Promise<MedicineLog[]> => {
  const db = await getDatabase();
  const logs = await db.getAll('medicineLogs');
  return logs
    .filter(l => l.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get today's medicine logs for a schedule
 */
export const getTodaysMedicineLogs = async (scheduleId: string): Promise<MedicineLog[]> => {
  const logs = await getMedicineLogsBySchedule(scheduleId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return logs.filter(l => {
    const logDate = new Date(l.createdAt);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });
};

/**
 * Get pending reminder (most recent log that needs action)
 */
export const getPendingReminder = async (scheduleId: string): Promise<MedicineLog | null> => {
  const logs = await getMedicineLogsBySchedule(scheduleId);
  const pending = logs.find(l => l.status === 'snoozed' && l.snoozeUntil);
  
  if (pending && pending.snoozeUntil) {
    const snoozeUntil = new Date(pending.snoozeUntil);
    if (snoozeUntil <= new Date()) {
      return pending; // Snooze time has passed, needs action
    }
  }
  
  return null;
};

/**
 * Create a medicine log entry (for when reminder is triggered)
 */
export const createMedicineLog = async (
  scheduleId: string,
  profileId: string
): Promise<MedicineLog> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const log: MedicineLog = {
    id: generateId(),
    scheduleId,
    profileId,
    status: 'snoozed', // Initially pending
    createdAt: now,
  };

  await db.put('medicineLogs', log);
  
  // Increment reminder count on schedule
  const schedule = await getMedicineScheduleById(scheduleId);
  if (schedule) {
    await updateMedicineSchedule(scheduleId, {
      remindersSent: schedule.remindersSent + 1,
    });
  }

  return log;
};

/**
 * Mark medicine as taken
 */
export const markMedicineTaken = async (logId: string): Promise<MedicineLog | null> => {
  const db = await getDatabase();
  const existing = await db.get('medicineLogs', logId);

  if (!existing) return null;

  const updated: MedicineLog = {
    ...existing,
    takenAt: new Date().toISOString(),
    status: 'taken',
  };

  await db.put('medicineLogs', updated);
  return updated;
};

/**
 * Snooze medicine reminder
 * @param logId - The log ID to snooze
 * @param minutes - Snooze duration (max 30 minutes)
 * @returns Updated log or null if max snoozes reached (then marks as missed)
 */
export const snoozeMedicineReminder = async (
  logId: string,
  minutes: number
): Promise<{ log: MedicineLog | null; markedAsMissed: boolean }> => {
  const db = await getDatabase();
  const existing = await db.get('medicineLogs', logId);

  if (!existing) return { log: null, markedAsMissed: false };

  // Count snoozes for this log
  const snoozeCount = existing.snoozedAt ? 
    (existing as any).snoozeCount || 1 : 0;
  
  const newSnoozeCount = snoozeCount + 1;

  // If more than 3 snoozes, mark as missed
  if (newSnoozeCount > MAX_SNOOZE_COUNT) {
    const missed: MedicineLog = {
      ...existing,
      status: 'missed',
    };
    await db.put('medicineLogs', missed);
    return { log: missed, markedAsMissed: true };
  }

  // Cap snooze time at 30 minutes
  const snoozeDuration = Math.min(minutes, MAX_SNOOZE_MINUTES);
  const snoozeUntil = new Date();
  snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeDuration);

  const updated: MedicineLog = {
    ...existing,
    snoozedAt: new Date().toISOString(),
    snoozeUntil: snoozeUntil.toISOString(),
    status: 'snoozed',
  };
  
  // Store snooze count (extend the type temporarily)
  (updated as any).snoozeCount = newSnoozeCount;

  await db.put('medicineLogs', updated);
  return { log: updated, markedAsMissed: false };
};

/**
 * Check if a schedule should auto-stop
 */
export const shouldScheduleStop = async (scheduleId: string): Promise<boolean> => {
  const schedule = await getMedicineScheduleById(scheduleId);
  if (!schedule || !schedule.isActive) return false;

  // Check total days
  if (schedule.totalDays) {
    const startDate = new Date(schedule.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysPassed >= schedule.totalDays) return true;
  }

  // Check total reminders
  if (schedule.totalReminders && schedule.remindersSent >= schedule.totalReminders) {
    return true;
  }

  return false;
};

/**
 * Get next reminder time for a schedule
 */
export const getNextReminderTime = async (scheduleId: string): Promise<Date | null> => {
  const schedule = await getMedicineScheduleById(scheduleId);
  if (!schedule || !schedule.isActive || schedule.isPaused) return null;

  // Check for pending snoozed reminder
  const pending = await getPendingReminder(scheduleId);
  if (pending && pending.snoozeUntil) {
    return new Date(pending.snoozeUntil);
  }

  // Calculate next reminder based on interval
  const logs = await getTodaysMedicineLogs(scheduleId);
  const lastLog = logs[0];

  if (!lastLog) {
    // No logs today, reminder should be now
    return new Date();
  }

  // If last was missed or taken, calculate next based on interval
  if (lastLog.status === 'taken' || lastLog.status === 'missed') {
    const nextTime = new Date(lastLog.createdAt);
    nextTime.setHours(nextTime.getHours() + schedule.intervalHours);
    return nextTime;
  }

  // If snoozed without snoozeUntil (shouldn't happen), remind in 20 min
  const reminderTime = new Date();
  reminderTime.setMinutes(reminderTime.getMinutes() + DEFAULT_REMINDER_INTERVAL_MINUTES);
  return reminderTime;
};

export { MAX_SNOOZE_COUNT, MAX_SNOOZE_MINUTES, DEFAULT_REMINDER_INTERVAL_MINUTES };
