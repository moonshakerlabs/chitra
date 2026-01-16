import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/core/context/ProfileContext';
import type { FeedingSchedule, FeedingLog } from '@/core/types';
import {
  getAllFeedingSchedules,
  getActiveFeedingSchedules,
  addFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
  toggleFeedingSchedule,
  getAllFeedingLogs,
  getFeedingLogsBySchedule,
  getTodaysFeedingLogs,
  createFeedingLog,
  snoozeFeedingReminder,
} from './feedingService';
import { scheduleFeedingReminder } from '@/core/notifications/notificationService';

// Starting from options in minutes
const startingFromMinutes: Record<string, number> = {
  'immediately': 0,
  '5min': 5,
  '10min': 10,
  '15min': 15,
};

/**
 * Hook for managing feeding schedules
 */
export const useFeedingSchedules = () => {
  const { activeProfile } = useProfile();
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = useCallback(async () => {
    if (!activeProfile) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getAllFeedingSchedules(activeProfile.id);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load feeding schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const add = useCallback(async (
    feedingName: string,
    reminderType: 'time' | 'interval',
    reminderTime?: string,
    intervalHours?: number,
    feedingType: 'breast_milk' | 'formula' | 'solid_food' | 'water' | 'other' = 'breast_milk',
    startingFrom?: 'immediately' | '5min' | '10min' | '15min'
  ) => {
    if (!activeProfile) return null;

    try {
      const schedule = await addFeedingSchedule({
        profileId: activeProfile.id,
        feedingName,
        feedingType,
        reminderType,
        reminderTime,
        intervalHours,
        isActive: true,
      });
      
      // Schedule first notification
      let firstReminderTime = new Date();
      
      if (reminderType === 'time' && reminderTime) {
        // For specific time, schedule at that time
        const [hours, minutes] = reminderTime.split(':').map(Number);
        firstReminderTime.setHours(hours, minutes, 0, 0);
        // If time has passed today, schedule for tomorrow
        if (firstReminderTime <= new Date()) {
          firstReminderTime.setDate(firstReminderTime.getDate() + 1);
        }
      } else if (reminderType === 'interval' && intervalHours) {
        // For interval, add starting from delay + interval
        const delayMinutes = startingFrom ? startingFromMinutes[startingFrom] : 0;
        firstReminderTime.setMinutes(firstReminderTime.getMinutes() + delayMinutes);
      }
      
      await scheduleFeedingReminder(schedule.id, feedingName, activeProfile.id, firstReminderTime);
      
      await loadSchedules();
      return schedule;
    } catch (error) {
      console.error('Failed to add feeding schedule:', error);
      return null;
    }
  }, [activeProfile, loadSchedules]);

  const update = useCallback(async (
    id: string,
    updates: Partial<Omit<FeedingSchedule, 'id' | 'profileId' | 'createdAt'>>
  ) => {
    try {
      const schedule = await updateFeedingSchedule(id, updates);
      await loadSchedules();
      return schedule;
    } catch (error) {
      console.error('Failed to update feeding schedule:', error);
      return null;
    }
  }, [loadSchedules]);

  const remove = useCallback(async (id: string) => {
    try {
      const success = await deleteFeedingSchedule(id);
      await loadSchedules();
      return success;
    } catch (error) {
      console.error('Failed to delete feeding schedule:', error);
      return false;
    }
  }, [loadSchedules]);

  const toggle = useCallback(async (id: string) => {
    try {
      const schedule = await toggleFeedingSchedule(id);
      await loadSchedules();
      return schedule;
    } catch (error) {
      console.error('Failed to toggle feeding schedule:', error);
      return null;
    }
  }, [loadSchedules]);

  const activeSchedules = schedules.filter(s => s.isActive);

  return {
    schedules,
    activeSchedules,
    loading,
    add,
    update,
    remove,
    toggle,
    reload: loadSchedules,
  };
};

/**
 * Hook for managing feeding logs
 */
export const useFeedingLogs = (scheduleId?: string) => {
  const { activeProfile } = useProfile();
  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!activeProfile) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      const data = scheduleId
        ? await getFeedingLogsBySchedule(scheduleId)
        : await getAllFeedingLogs(activeProfile.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load feeding logs:', error);
    } finally {
      setLoading(false);
    }
  }, [activeProfile, scheduleId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const markCompleted = useCallback(async (scheduleId: string) => {
    if (!activeProfile) return null;

    try {
      const log = await createFeedingLog(scheduleId, activeProfile.id);
      await loadLogs();
      return log;
    } catch (error) {
      console.error('Failed to mark feeding completed:', error);
      return null;
    }
  }, [activeProfile, loadLogs]);

  const snooze = useCallback(async (scheduleId: string, minutes: number = 30) => {
    if (!activeProfile) return null;

    try {
      const log = await snoozeFeedingReminder(scheduleId, activeProfile.id, minutes);
      await loadLogs();
      return log;
    } catch (error) {
      console.error('Failed to snooze feeding:', error);
      return null;
    }
  }, [activeProfile, loadLogs]);

  const todaysLogs = logs.filter(l => 
    l.createdAt.startsWith(new Date().toISOString().split('T')[0])
  );

  return {
    logs,
    todaysLogs,
    loading,
    markCompleted,
    snooze,
    reload: loadLogs,
  };
};
