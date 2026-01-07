import { useState, useEffect, useCallback } from 'react';
import { 
  getAllWeights, 
  addWeight, 
  updateWeight, 
  deleteWeight,
  getLatestWeight,
  calculateWeightTrend,
  getChartData
} from './weightService';
import { useProfile } from '@/core/context/ProfileContext';
import type { WeightEntry, WeightTrend } from '@/core/types';

export const useWeights = () => {
  const { activeProfile } = useProfile();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeights = useCallback(async () => {
    if (!activeProfile) {
      setWeights([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAllWeights(activeProfile.id);
      setWeights(data);
      setError(null);
    } catch (err) {
      setError('Failed to load weights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    loadWeights();
  }, [loadWeights]);

  const add = async (entry: Omit<WeightEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry = await addWeight(entry);
    setWeights(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const update = async (id: string, updates: Partial<WeightEntry>) => {
    const updated = await updateWeight(id, updates);
    if (updated) {
      setWeights(prev => prev.map(w => w.id === id ? updated : w));
    }
    return updated;
  };

  const remove = async (id: string) => {
    const success = await deleteWeight(id);
    if (success) {
      setWeights(prev => prev.filter(w => w.id !== id));
    }
    return success;
  };

  return {
    weights,
    loading,
    error,
    reload: loadWeights,
    addWeight: add,
    updateWeight: update,
    deleteWeight: remove,
  };
};

export const useLatestWeight = () => {
  const { activeProfile } = useProfile();
  const [weight, setWeight] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) {
      setWeight(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const latest = await getLatestWeight(activeProfile.id);
    setWeight(latest);
    setLoading(false);
  }, [activeProfile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    weight,
    loading,
    reload: load,
  };
};

export const useWeightTrend = (periodDays: number = 30) => {
  const { activeProfile } = useProfile();
  const [trend, setTrend] = useState<WeightTrend | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) {
      setTrend(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await calculateWeightTrend(periodDays, activeProfile.id);
    setTrend(data);
    setLoading(false);
  }, [periodDays, activeProfile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    trend,
    loading,
    reload: load,
  };
};

export const useWeightChart = (days: number = 30) => {
  const { activeProfile } = useProfile();
  const [data, setData] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const chartData = await getChartData(days, activeProfile.id);
    setData(chartData);
    setLoading(false);
  }, [days, activeProfile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    reload: load,
  };
};
