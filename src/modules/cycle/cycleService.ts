import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { CycleEntry, MoodType, PainLevel, CycleInsights } from '@/core/types';
import { daysBetween } from '@/core/utils/dateUtils';

/**
 * Get all cycle entries sorted by start date (newest first)
 */
export const getAllCycles = async (): Promise<CycleEntry[]> => {
  const db = await getDatabase();
  const cycles = await db.getAll('cycles');
  return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
};

/**
 * Get a single cycle entry by ID
 */
export const getCycleById = async (id: string): Promise<CycleEntry | undefined> => {
  const db = await getDatabase();
  return db.get('cycles', id);
};

/**
 * Add a new cycle entry
 */
export const addCycle = async (cycle: Omit<CycleEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CycleEntry> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  const newCycle: CycleEntry = {
    ...cycle,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put('cycles', newCycle);
  return newCycle;
};

/**
 * Update an existing cycle entry
 */
export const updateCycle = async (id: string, updates: Partial<CycleEntry>): Promise<CycleEntry | null> => {
  const db = await getDatabase();
  const existing = await db.get('cycles', id);
  
  if (!existing) return null;
  
  const updated: CycleEntry = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  
  await db.put('cycles', updated);
  return updated;
};

/**
 * Delete a cycle entry
 */
export const deleteCycle = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.get('cycles', id);
  
  if (!existing) return false;
  
  await db.delete('cycles', id);
  return true;
};

/**
 * Get the most recent cycle
 */
export const getLatestCycle = async (): Promise<CycleEntry | null> => {
  const cycles = await getAllCycles();
  return cycles.length > 0 ? cycles[0] : null;
};

/**
 * Calculate cycle insights from historical data
 */
export const getCycleInsights = async (): Promise<CycleInsights> => {
  const cycles = await getAllCycles();
  
  if (cycles.length === 0) {
    return {
      averageCycleLength: null,
      averagePeriodDuration: null,
      lastCycleLength: null,
      nextPredictedStart: null,
      totalCyclesLogged: 0,
    };
  }
  
  // Calculate period durations (for cycles with both start and end dates)
  const completedCycles = cycles.filter(c => c.startDate && c.endDate);
  const periodDurations = completedCycles.map(c => 
    daysBetween(c.startDate, c.endDate!) + 1
  );
  
  // Calculate cycle lengths (time between consecutive cycle starts)
  const cycleLengths: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const length = daysBetween(cycles[i + 1].startDate, cycles[i].startDate);
    if (length > 0 && length < 60) { // Reasonable cycle length
      cycleLengths.push(length);
    }
  }
  
  const avgCycleLength = cycleLengths.length > 0 
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;
  
  const avgPeriodDuration = periodDurations.length > 0
    ? Math.round(periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length)
    : null;
  
  // Predict next cycle start
  let nextPredicted: string | null = null;
  if (avgCycleLength && cycles.length > 0) {
    const lastStart = new Date(cycles[0].startDate);
    lastStart.setDate(lastStart.getDate() + avgCycleLength);
    nextPredicted = lastStart.toISOString().split('T')[0];
  }
  
  return {
    averageCycleLength: avgCycleLength,
    averagePeriodDuration: avgPeriodDuration,
    lastCycleLength: cycleLengths.length > 0 ? cycleLengths[0] : null,
    nextPredictedStart: nextPredicted,
    totalCyclesLogged: cycles.length,
  };
};

/**
 * Quick log: Start a new cycle today
 */
export const startCycleToday = async (profileId: string, mood?: MoodType, painLevel?: PainLevel): Promise<CycleEntry> => {
  const today = new Date().toISOString().split('T')[0];
  return addCycle({
    profileId,
    startDate: today,
    mood,
    painLevel,
  });
};

/**
 * Quick log: End the current cycle today
 */
export const endCycleToday = async (): Promise<CycleEntry | null> => {
  const latest = await getLatestCycle();
  if (!latest || latest.endDate) return null;
  
  const today = new Date().toISOString().split('T')[0];
  return updateCycle(latest.id, { endDate: today });
};
