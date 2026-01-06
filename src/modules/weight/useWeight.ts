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
import type { WeightEntry, WeightTrend, WeightUnit } from '@/core/types';

export const useWeights = () => {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllWeights();
      setWeights(data);
      setError(null);
    } catch (err) {
      setError('Failed to load weights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [weight, setWeight] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const latest = await getLatestWeight();
    setWeight(latest);
    setLoading(false);
  }, []);

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
  const [trend, setTrend] = useState<WeightTrend | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await calculateWeightTrend(periodDays);
    setTrend(data);
    setLoading(false);
  }, [periodDays]);

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
  const [data, setData] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const chartData = await getChartData(days);
    setData(chartData);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    reload: load,
  };
};
