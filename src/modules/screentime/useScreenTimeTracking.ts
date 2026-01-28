import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@/core/context/ProfileContext';
import type { ScreenTimeSession } from '@/core/types';
import {
  getTrackingState,
  startTrackingSession,
  stopTrackingSession,
  getCurrentElapsedSeconds,
  getScreenTimeAggregates,
  getAllSessions,
  getSessionsGroupedByDate,
} from './screenTimeSessionService';

export const useScreenTimeTracking = () => {
  const { activeProfile } = useProfile();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aggregates, setAggregates] = useState<{
    daily: number;
    weekly: number;
    yearly: number;
    allTime: number;
  } | null>(null);
  const [sessions, setSessions] = useState<ScreenTimeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const state = getTrackingState();
    setIsTracking(state.isTracking);
    if (state.isTracking) {
      setElapsedSeconds(getCurrentElapsedSeconds());
    }
  }, []);

  // Timer for live elapsed time updates
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(getCurrentElapsedSeconds());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking]);

  // Load aggregates and sessions
  const loadData = useCallback(async () => {
    if (!activeProfile) {
      setAggregates(null);
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [aggs, allSessions] = await Promise.all([
        getScreenTimeAggregates(activeProfile.id),
        getAllSessions(activeProfile.id),
      ]);
      setAggregates(aggs);
      setSessions(allSessions);
    } catch (error) {
      console.error('[ScreenTime] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!activeProfile || isTracking) return null;

    try {
      const session = await startTrackingSession(activeProfile.id);
      setIsTracking(true);
      setElapsedSeconds(0);
      console.log('[ScreenTime] Tracking started');
      return session;
    } catch (error) {
      console.error('[ScreenTime] Failed to start tracking:', error);
      return null;
    }
  }, [activeProfile, isTracking]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (!isTracking) return null;

    try {
      const session = await stopTrackingSession();
      setIsTracking(false);
      setElapsedSeconds(0);
      await loadData(); // Refresh aggregates
      console.log('[ScreenTime] Tracking stopped');
      return session;
    } catch (error) {
      console.error('[ScreenTime] Failed to stop tracking:', error);
      return null;
    }
  }, [isTracking, loadData]);

  // Get grouped history
  const getGroupedHistory = useCallback(async (limit?: number) => {
    if (!activeProfile) return [];
    return getSessionsGroupedByDate(activeProfile.id, limit);
  }, [activeProfile]);

  return {
    isTracking,
    elapsedSeconds,
    aggregates,
    sessions,
    isLoading,
    startTracking,
    stopTracking,
    reload: loadData,
    getGroupedHistory,
  };
};
