import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { ScreenTimeEntry } from '@/core/types';
import { startOfWeek, endOfWeek, getISOWeek, getYear, format, parseISO } from 'date-fns';

/**
 * Get week number and year from a date
 */
export const getWeekInfo = (date: Date): { weekNumber: number; year: number; weekStart: string; weekEnd: string } => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 }); // Saturday
  
  return {
    weekNumber: getISOWeek(date),
    year: getYear(date),
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
  };
};

/**
 * Get current week info
 */
export const getCurrentWeekInfo = () => getWeekInfo(new Date());

/**
 * Get all screen time entries for a profile
 */
export const getAllScreenTimeEntries = async (profileId: string): Promise<ScreenTimeEntry[]> => {
  const db = await getDatabase();
  const entries = await db.getAll('screenTime');
  return entries
    .filter(e => e.profileId === profileId)
    .sort((a, b) => {
      // Sort by year desc, then week desc
      if (b.year !== a.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
};

/**
 * Get screen time entry for a specific week
 */
export const getScreenTimeForWeek = async (
  profileId: string, 
  weekNumber: number, 
  year: number
): Promise<ScreenTimeEntry | undefined> => {
  const db = await getDatabase();
  const entries = await db.getAll('screenTime');
  return entries.find(
    e => e.profileId === profileId && e.weekNumber === weekNumber && e.year === year
  );
};

/**
 * Add or update screen time entry for a week
 */
export const logScreenTime = async (
  profileId: string,
  minutes: number,
  weekNumber?: number,
  year?: number,
  notes?: string
): Promise<ScreenTimeEntry> => {
  const db = await getDatabase();
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Use provided week/year or current
  const targetWeek = weekNumber ?? getISOWeek(now);
  const targetYear = year ?? getYear(now);
  
  // Get week start/end dates
  const referenceDate = new Date(targetYear, 0, 1);
  referenceDate.setDate(referenceDate.getDate() + (targetWeek - 1) * 7);
  const { weekStart, weekEnd } = getWeekInfo(referenceDate);
  
  // Check if entry already exists for this week
  const existing = await getScreenTimeForWeek(profileId, targetWeek, targetYear);
  
  if (existing) {
    // Update existing entry
    const updated: ScreenTimeEntry = {
      ...existing,
      totalMinutes: minutes,
      notes,
      updatedAt: nowISO,
    };
    await db.put('screenTime', updated);
    return updated;
  }
  
  // Create new entry
  const newEntry: ScreenTimeEntry = {
    id: generateId(),
    profileId,
    weekNumber: targetWeek,
    year: targetYear,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    totalMinutes: minutes,
    notes,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
  
  await db.put('screenTime', newEntry);
  return newEntry;
};

/**
 * Delete a screen time entry
 */
export const deleteScreenTimeEntry = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.get('screenTime', id);
  
  if (!existing) return false;
  
  await db.delete('screenTime', id);
  return true;
};

/**
 * Get screen time statistics for a year
 */
export const getYearlyScreenTimeStats = async (
  profileId: string, 
  year: number
): Promise<{ entries: ScreenTimeEntry[]; totalMinutes: number; averagePerWeek: number }> => {
  const entries = await getAllScreenTimeEntries(profileId);
  const yearEntries = entries.filter(e => e.year === year);
  
  const totalMinutes = yearEntries.reduce((sum, e) => sum + e.totalMinutes, 0);
  const averagePerWeek = yearEntries.length > 0 ? Math.round(totalMinutes / yearEntries.length) : 0;
  
  return {
    entries: yearEntries,
    totalMinutes,
    averagePerWeek,
  };
};

/**
 * Get screen time for a specific month (aggregate weekly data)
 */
export const getMonthlyScreenTimeStats = async (
  profileId: string,
  year: number
): Promise<{ month: number; totalMinutes: number }[]> => {
  const entries = await getAllScreenTimeEntries(profileId);
  const yearEntries = entries.filter(e => e.year === year);
  
  // Group by month based on weekStartDate
  const monthlyData: { [month: number]: number } = {};
  
  for (let month = 0; month < 12; month++) {
    monthlyData[month] = 0;
  }
  
  yearEntries.forEach(entry => {
    const weekStart = parseISO(entry.weekStartDate);
    const month = weekStart.getMonth();
    monthlyData[month] += entry.totalMinutes;
  });
  
  return Object.entries(monthlyData).map(([month, totalMinutes]) => ({
    month: parseInt(month),
    totalMinutes,
  }));
};

/**
 * Format minutes to hours and minutes string
 */
export const formatScreenTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Get week range string (e.g., "Jan 5 - Jan 11")
 */
export const getWeekRangeString = (weekStart: string, weekEnd: string): string => {
  const start = parseISO(weekStart);
  const end = parseISO(weekEnd);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
};
