import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { ScreenTimeSession, ScreenTimeTrackingState } from '@/core/types';
import { format, parseISO, startOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

const TRACKING_STATE_KEY = 'screenTimeTrackingState';

/**
 * Get tracking state from localStorage (not persisted across app restarts)
 */
export const getTrackingState = (): ScreenTimeTrackingState => {
  try {
    const stored = localStorage.getItem(TRACKING_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[ScreenTime] Failed to parse tracking state:', error);
  }
  return { isTracking: false };
};

/**
 * Save tracking state to localStorage
 */
const saveTrackingState = (state: ScreenTimeTrackingState): void => {
  try {
    localStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[ScreenTime] Failed to save tracking state:', error);
  }
};

/**
 * Clear tracking state (on app restart, this happens naturally since we don't auto-resume)
 */
export const clearTrackingState = (): void => {
  localStorage.removeItem(TRACKING_STATE_KEY);
};

/**
 * Start a new tracking session
 */
export const startTrackingSession = async (profileId: string): Promise<ScreenTimeSession> => {
  const db = await getDatabase();
  const now = new Date();
  const nowISO = now.toISOString();
  const dateStr = format(now, 'yyyy-MM-dd');
  
  const session: ScreenTimeSession = {
    id: generateId(),
    profileId,
    startTime: nowISO,
    durationSeconds: 0,
    date: dateStr,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
  
  await db.put('screenTimeSessions', session);
  
  // Update tracking state
  saveTrackingState({
    isTracking: true,
    activeSessionId: session.id,
    trackingStartTime: nowISO,
  });
  
  console.log('[ScreenTime] Started tracking session:', session.id);
  return session;
};

/**
 * Stop the current tracking session
 */
export const stopTrackingSession = async (): Promise<ScreenTimeSession | null> => {
  const state = getTrackingState();
  
  if (!state.isTracking || !state.activeSessionId || !state.trackingStartTime) {
    console.log('[ScreenTime] No active session to stop');
    clearTrackingState();
    return null;
  }
  
  const db = await getDatabase();
  const session = await db.get('screenTimeSessions', state.activeSessionId);
  
  if (!session) {
    console.warn('[ScreenTime] Session not found:', state.activeSessionId);
    clearTrackingState();
    return null;
  }
  
  const now = new Date();
  const startTime = parseISO(state.trackingStartTime);
  const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  const updatedSession: ScreenTimeSession = {
    ...session,
    endTime: now.toISOString(),
    durationSeconds,
    updatedAt: now.toISOString(),
  };
  
  await db.put('screenTimeSessions', updatedSession);
  clearTrackingState();
  
  console.log('[ScreenTime] Stopped tracking session:', updatedSession.id, 'Duration:', durationSeconds, 'seconds');
  return updatedSession;
};

/**
 * Get current elapsed seconds for active session
 */
export const getCurrentElapsedSeconds = (): number => {
  const state = getTrackingState();
  
  if (!state.isTracking || !state.trackingStartTime) {
    return 0;
  }
  
  const startTime = parseISO(state.trackingStartTime);
  return Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
};

/**
 * Get all sessions for a profile
 */
export const getAllSessions = async (profileId: string): Promise<ScreenTimeSession[]> => {
  const db = await getDatabase();
  const sessions = await db.getAll('screenTimeSessions');
  return sessions
    .filter(s => s.profileId === profileId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

/**
 * Get sessions for a specific date
 */
export const getSessionsByDate = async (profileId: string, date: Date): Promise<ScreenTimeSession[]> => {
  const db = await getDatabase();
  const sessions = await db.getAll('screenTimeSessions');
  const dateStr = format(date, 'yyyy-MM-dd');
  return sessions.filter(s => s.profileId === profileId && s.date === dateStr);
};

/**
 * Get total seconds for a specific date
 */
export const getDailyTotalSeconds = async (profileId: string, date: Date): Promise<number> => {
  const sessions = await getSessionsByDate(profileId, date);
  return sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
};

/**
 * Get total seconds for a week (Sunday to Saturday)
 */
export const getWeeklyTotalSeconds = async (profileId: string, date: Date): Promise<number> => {
  const db = await getDatabase();
  const sessions = await db.getAll('screenTimeSessions');
  
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  return sessions
    .filter(s => s.profileId === profileId && s.date >= weekStartStr && s.date <= weekEndStr)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
};

/**
 * Get total seconds for a year
 */
export const getYearlyTotalSeconds = async (profileId: string, year: number): Promise<number> => {
  const db = await getDatabase();
  const sessions = await db.getAll('screenTimeSessions');
  
  const yearStart = format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(new Date(year, 11, 31)), 'yyyy-MM-dd');
  
  return sessions
    .filter(s => s.profileId === profileId && s.date >= yearStart && s.date <= yearEnd)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
};

/**
 * Get total seconds since app install (all time)
 */
export const getAllTimeTotalSeconds = async (profileId: string): Promise<number> => {
  const sessions = await getAllSessions(profileId);
  return sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
};

/**
 * Get aggregated stats
 */
export const getScreenTimeAggregates = async (profileId: string, date: Date = new Date()) => {
  const [daily, weekly, yearly, allTime] = await Promise.all([
    getDailyTotalSeconds(profileId, date),
    getWeeklyTotalSeconds(profileId, date),
    getYearlyTotalSeconds(profileId, date.getFullYear()),
    getAllTimeTotalSeconds(profileId),
  ]);
  
  return {
    daily,
    weekly,
    yearly,
    allTime,
  };
};

/**
 * Format seconds based on duration rules:
 * - < 60 seconds: show seconds only
 * - >= 60 seconds and < 120 minutes (7200 seconds): show minutes and seconds
 * - >= 120 minutes: show hours, minutes, and seconds
 */
export const formatDynamicScreenTime = (totalSeconds: number): string => {
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`;
  }
  
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (totalMinutes < 120) {
    // Show minutes and seconds
    if (remainingSeconds === 0) {
      return `${totalMinutes} min`;
    }
    return `${totalMinutes} min ${remainingSeconds} sec`;
  }
  
  // Show hours, minutes, and seconds
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  let result = `${hours} hr`;
  if (mins > 0) {
    result += ` ${mins} min`;
  }
  if (remainingSeconds > 0) {
    result += ` ${remainingSeconds.toString().padStart(2, '0')} sec`;
  }
  return result;
};

/**
 * Delete a session
 */
export const deleteSession = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.get('screenTimeSessions', id);
  
  if (!existing) return false;
  
  await db.delete('screenTimeSessions', id);
  return true;
};

/**
 * Get sessions grouped by date for history display
 */
export const getSessionsGroupedByDate = async (
  profileId: string, 
  limit: number = 30
): Promise<{ date: string; sessions: ScreenTimeSession[]; totalSeconds: number }[]> => {
  const sessions = await getAllSessions(profileId);
  
  // Group by date
  const grouped: { [date: string]: ScreenTimeSession[] } = {};
  
  for (const session of sessions) {
    if (!grouped[session.date]) {
      grouped[session.date] = [];
    }
    grouped[session.date].push(session);
  }
  
  // Sort by date descending and limit
  return Object.entries(grouped)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, limit)
    .map(([date, sessions]) => ({
      date,
      sessions,
      totalSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    }));
};
