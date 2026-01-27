import { useState, useEffect, useCallback } from 'react';
import { 
  getAllCycles, 
  addCycle, 
  updateCycle, 
  deleteCycle,
  getLatestCycle,
  getCycleInsights,
  startCycleToday,
  endCycleToday
} from './cycleService';
import { useProfile } from '@/core/context/ProfileContext';
import { scheduleCycleReminder, cancelCycleReminder } from '@/core/notifications';
import type { CycleEntry, CycleInsights, MoodType, PainLevel } from '@/core/types';

export const useCycles = () => {
  const { activeProfile } = useProfile();
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCycles = useCallback(async () => {
    if (!activeProfile) {
      setCycles([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAllCycles(activeProfile.id);
      setCycles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load cycles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const add = async (cycle: Omit<CycleEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCycle = await addCycle(cycle);
    setCycles(prev => [newCycle, ...prev]);
    return newCycle;
  };

  const update = async (id: string, updates: Partial<CycleEntry>) => {
    const updated = await updateCycle(id, updates);
    if (updated) {
      setCycles(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  };

  const remove = async (id: string) => {
    const success = await deleteCycle(id);
    if (success) {
      setCycles(prev => prev.filter(c => c.id !== id));
    }
    return success;
  };

  return {
    cycles,
    loading,
    error,
    reload: loadCycles,
    addCycle: add,
    updateCycle: update,
    deleteCycle: remove,
  };
};

export const useLatestCycle = () => {
  const { activeProfile } = useProfile();
  const [cycle, setCycle] = useState<CycleEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) {
      setCycle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const latest = await getLatestCycle(activeProfile.id);
    setCycle(latest);
    setLoading(false);
  }, [activeProfile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const startToday = async (profileId: string, mood?: MoodType, painLevel?: PainLevel) => {
    const newCycle = await startCycleToday(profileId, mood, painLevel);
    setCycle(newCycle);
    return newCycle;
  };

  const endToday = async () => {
    const updated = await endCycleToday(activeProfile?.id);
    if (updated) setCycle(updated);
    return updated;
  };

  return {
    cycle,
    loading,
    reload: load,
    startToday,
    endToday,
    isOngoing: cycle !== null && !cycle.endDate,
  };
};

export const useCycleInsights = () => {
  const { activeProfile } = useProfile();
  const [insights, setInsights] = useState<CycleInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) {
      setInsights(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getCycleInsights(activeProfile.id);
    setInsights(data);
    setLoading(false);
    
    // Schedule cycle reminder if we have a valid prediction
    if (data.nextPredictedStart && activeProfile.mode !== 'pregnant' && activeProfile.mode !== 'no_menstrual') {
      try {
        await scheduleCycleReminder(
          activeProfile.id,
          data.nextPredictedStart,
          activeProfile.name
        );
        console.log('[Cycle] Reminder scheduled for', data.nextPredictedStart);
      } catch (error) {
        console.error('[Cycle] Failed to schedule reminder:', error);
      }
    } else {
      // Cancel any existing reminder if conditions not met
      await cancelCycleReminder(activeProfile.id);
    }
  }, [activeProfile?.id, activeProfile?.mode, activeProfile?.name]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    insights,
    loading,
    reload: load,
  };
};
