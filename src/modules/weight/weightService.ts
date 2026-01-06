import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { WeightEntry, WeightUnit, WeightTrend } from '@/core/types';
import { daysBetween } from '@/core/utils/dateUtils';

/**
 * Get all weight entries sorted by date (newest first)
 */
export const getAllWeights = async (): Promise<WeightEntry[]> => {
  const db = await getDatabase();
  const weights = await db.getAll('weights');
  return weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get a single weight entry by ID
 */
export const getWeightById = async (id: string): Promise<WeightEntry | undefined> => {
  const db = await getDatabase();
  return db.get('weights', id);
};

/**
 * Add a new weight entry
 */
export const addWeight = async (entry: Omit<WeightEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeightEntry> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  const newEntry: WeightEntry = {
    ...entry,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put('weights', newEntry);
  return newEntry;
};

/**
 * Update an existing weight entry
 */
export const updateWeight = async (id: string, updates: Partial<WeightEntry>): Promise<WeightEntry | null> => {
  const db = await getDatabase();
  const existing = await db.get('weights', id);
  
  if (!existing) return null;
  
  const updated: WeightEntry = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  
  await db.put('weights', updated);
  return updated;
};

/**
 * Delete a weight entry
 */
export const deleteWeight = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.get('weights', id);
  
  if (!existing) return false;
  
  await db.delete('weights', id);
  return true;
};

/**
 * Get the most recent weight entry
 */
export const getLatestWeight = async (): Promise<WeightEntry | null> => {
  const weights = await getAllWeights();
  return weights.length > 0 ? weights[0] : null;
};

/**
 * Get weight entries for a specific date range
 */
export const getWeightsInRange = async (startDate: string, endDate: string): Promise<WeightEntry[]> => {
  const weights = await getAllWeights();
  return weights.filter(w => w.date >= startDate && w.date <= endDate);
};

/**
 * Calculate weight trend over a period
 */
export const calculateWeightTrend = async (periodDays: number = 30): Promise<WeightTrend | null> => {
  const weights = await getAllWeights();
  
  if (weights.length < 2) return null;
  
  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  const recentWeights = weights.filter(w => w.date >= startDateStr && w.date <= today);
  
  if (recentWeights.length < 2) return null;
  
  const oldest = recentWeights[recentWeights.length - 1];
  const newest = recentWeights[0];
  
  const changeAmount = newest.weight - oldest.weight;
  const changePercentage = Math.round((changeAmount / oldest.weight) * 100 * 10) / 10;
  
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(changePercentage) < 1) {
    direction = 'stable';
  } else if (changeAmount > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  
  return {
    direction,
    changeAmount: Math.round(changeAmount * 10) / 10,
    changePercentage,
    periodDays: daysBetween(oldest.date, newest.date),
  };
};

/**
 * Get weight data formatted for chart display
 */
export const getChartData = async (days: number = 30): Promise<Array<{ date: string; weight: number }>> => {
  const weights = await getAllWeights();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  return weights
    .filter(w => w.date >= startDateStr)
    .reverse()
    .map(w => ({
      date: w.date,
      weight: w.weight,
    }));
};

/**
 * Convert weight between units
 */
export const convertWeight = (weight: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') return Math.round(weight * 2.20462 * 10) / 10;
  if (from === 'lb' && to === 'kg') return Math.round(weight / 2.20462 * 10) / 10;
  return weight;
};
