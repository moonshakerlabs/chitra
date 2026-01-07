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
import type { CycleEntry, CycleInsights, MoodType, PainLevel } from '@/core/types';

export const useCycles = () => {
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCycles();
      setCycles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load cycles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [cycle, setCycle] = useState<CycleEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const latest = await getLatestCycle();
    setCycle(latest);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startToday = async (profileId: string, mood?: MoodType, painLevel?: PainLevel) => {
    const newCycle = await startCycleToday(profileId, mood, painLevel);
    setCycle(newCycle);
    return newCycle;
  };

  const endToday = async () => {
    const updated = await endCycleToday();
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
  const [insights, setInsights] = useState<CycleInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getCycleInsights();
    setInsights(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    insights,
    loading,
    reload: load,
  };
};
