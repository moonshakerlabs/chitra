import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/core/context/ProfileContext';
import type { MedicineSchedule, MedicineLog } from '@/core/types';
import {
  getAllMedicineSchedules,
  getActiveMedicineSchedules,
  getAllMedicineLogs,
  getMedicineLogsBySchedule,
  addMedicineSchedule,
  updateMedicineSchedule,
  deleteMedicineSchedule,
  toggleMedicineSchedulePause,
  stopMedicineSchedule,
  createMedicineLog,
  markMedicineTaken,
  snoozeMedicineReminder,
} from './medicineService';
import { scheduleMedicineReminder } from '@/core/notifications/notificationService';

// Starting from options in minutes
const startingFromMinutes: Record<string, number> = {
  'immediately': 0,
  '5min': 5,
  '10min': 10,
  '15min': 15,
};

export const useMedicineSchedules = () => {
  const { activeProfile } = useProfile();
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = useCallback(async () => {
    if (!activeProfile) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getAllMedicineSchedules(activeProfile.id);
    setSchedules(data);
    setLoading(false);
  }, [activeProfile?.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const add = async (
    medicineName: string,
    timesPerDay: number,
    intervalHours: number,
    totalDays?: number,
    totalReminders?: number,
    startingFrom?: 'immediately' | '5min' | '10min' | '15min'
  ) => {
    if (!activeProfile) return null;
    
    console.log('[Medicine] Adding schedule:', { medicineName, timesPerDay, intervalHours, startingFrom });
    
    const schedule = await addMedicineSchedule(
      activeProfile.id,
      medicineName,
      timesPerDay,
      intervalHours,
      totalDays,
      totalReminders
    );
    
    // Schedule first notification
    const delayMinutes = startingFrom ? startingFromMinutes[startingFrom] : intervalHours * 60;
    const firstReminderTime = new Date();
    firstReminderTime.setMinutes(firstReminderTime.getMinutes() + delayMinutes);
    
    console.log('[Medicine] Scheduling first reminder:', {
      scheduleId: schedule.id,
      medicineName,
      delayMinutes,
      firstReminderTime: firstReminderTime.toLocaleString()
    });
    
    await scheduleMedicineReminder(schedule.id, medicineName, firstReminderTime);
    
    await loadSchedules();
    return schedule;
  };

  const update = async (
    id: string,
    updates: Partial<Omit<MedicineSchedule, 'id' | 'profileId' | 'createdAt'>>
  ) => {
    const updated = await updateMedicineSchedule(id, updates);
    if (updated) {
      await loadSchedules();
    }
    return updated;
  };

  const remove = async (id: string) => {
    const success = await deleteMedicineSchedule(id);
    if (success) {
      await loadSchedules();
    }
    return success;
  };

  const togglePause = async (id: string) => {
    const updated = await toggleMedicineSchedulePause(id);
    if (updated) {
      await loadSchedules();
    }
    return updated;
  };

  const stop = async (id: string) => {
    const updated = await stopMedicineSchedule(id);
    if (updated) {
      await loadSchedules();
    }
    return updated;
  };

  return {
    schedules,
    activeSchedules: schedules.filter(s => s.isActive),
    loading,
    reload: loadSchedules,
    add,
    update,
    remove,
    togglePause,
    stop,
  };
};

export const useMedicineLogs = (scheduleId?: string) => {
  const { activeProfile } = useProfile();
  const [logs, setLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!activeProfile) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = scheduleId 
      ? await getMedicineLogsBySchedule(scheduleId)
      : await getAllMedicineLogs(activeProfile.id);
    setLogs(data);
    setLoading(false);
  }, [activeProfile?.id, scheduleId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const createLog = async (scheduleId: string) => {
    if (!activeProfile) return null;
    const log = await createMedicineLog(scheduleId, activeProfile.id);
    await loadLogs();
    return log;
  };

  const markTaken = async (logId: string) => {
    const updated = await markMedicineTaken(logId);
    if (updated) {
      await loadLogs();
    }
    return updated;
  };

  const snooze = async (logId: string, minutes: number) => {
    const result = await snoozeMedicineReminder(logId, minutes);
    await loadLogs();
    return result;
  };

  // Calculate stats
  const takenCount = logs.filter(l => l.status === 'taken').length;
  const missedCount = logs.filter(l => l.status === 'missed').length;
  const pendingCount = logs.filter(l => l.status === 'snoozed').length;

  return {
    logs,
    loading,
    reload: loadLogs,
    createLog,
    markTaken,
    snooze,
    stats: {
      taken: takenCount,
      missed: missedCount,
      pending: pendingCount,
      total: logs.length,
    },
  };
};
