import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/core/context/ProfileContext';
import type { ScreenTimeEntry } from '@/core/types';
import {
  getAllScreenTimeEntries,
  getScreenTimeForWeek,
  logScreenTime,
  deleteScreenTimeEntry,
  getCurrentWeekInfo,
  getYearlyScreenTimeStats,
  getMonthlyScreenTimeStats,
} from './screenTimeService';
import { getYear } from 'date-fns';

export const useScreenTime = () => {
  const { activeProfile } = useProfile();
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([]);
  const [currentWeekEntry, setCurrentWeekEntry] = useState<ScreenTimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!activeProfile) {
      setEntries([]);
      setCurrentWeekEntry(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allEntries = await getAllScreenTimeEntries(activeProfile.id);
      setEntries(allEntries);

      // Load current week entry
      const { weekNumber, year } = getCurrentWeekInfo();
      const weekEntry = await getScreenTimeForWeek(activeProfile.id, weekNumber, year);
      setCurrentWeekEntry(weekEntry || null);
    } catch (error) {
      console.error('Failed to load screen time entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (
    minutes: number,
    weekNumber?: number,
    year?: number,
    notes?: string
  ) => {
    if (!activeProfile) return null;

    try {
      const entry = await logScreenTime(activeProfile.id, minutes, weekNumber, year, notes);
      await loadEntries();
      return entry;
    } catch (error) {
      console.error('Failed to log screen time:', error);
      return null;
    }
  }, [activeProfile, loadEntries]);

  const removeEntry = useCallback(async (id: string) => {
    try {
      await deleteScreenTimeEntry(id);
      await loadEntries();
      return true;
    } catch (error) {
      console.error('Failed to delete screen time entry:', error);
      return false;
    }
  }, [loadEntries]);

  const getYearStats = useCallback(async (year?: number) => {
    if (!activeProfile) return null;
    const targetYear = year ?? getYear(new Date());
    return await getYearlyScreenTimeStats(activeProfile.id, targetYear);
  }, [activeProfile]);

  const getMonthlyStats = useCallback(async (year?: number) => {
    if (!activeProfile) return null;
    const targetYear = year ?? getYear(new Date());
    return await getMonthlyScreenTimeStats(activeProfile.id, targetYear);
  }, [activeProfile]);

  return {
    entries,
    currentWeekEntry,
    isLoading,
    reload: loadEntries,
    addEntry,
    removeEntry,
    getYearStats,
    getMonthlyStats,
  };
};
