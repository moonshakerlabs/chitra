import { getDatabase } from '@/core/storage/database';
import { generateId } from '@/core/utils/helpers';
import type { VaccinationEntry } from '@/core/types';

/**
 * Get all vaccinations for a profile
 */
export const getAllVaccinations = async (profileId: string): Promise<VaccinationEntry[]> => {
  const db = await getDatabase();
  const vaccinations = await db.getAll('vaccinations');
  return vaccinations
    .filter(v => v.profileId === profileId)
    .sort((a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime());
};

/**
 * Get a vaccination by ID
 */
export const getVaccinationById = async (id: string): Promise<VaccinationEntry | undefined> => {
  const db = await getDatabase();
  return db.get('vaccinations', id);
};

/**
 * Add a new vaccination entry
 */
export const addVaccination = async (
  profileId: string,
  vaccineName: string,
  dateAdministered: string,
  notes?: string,
  attachmentPath?: string
): Promise<VaccinationEntry> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const entry: VaccinationEntry = {
    id: generateId(),
    profileId,
    vaccineName,
    dateAdministered,
    notes,
    attachmentPath,
    createdAt: now,
    updatedAt: now,
  };

  await db.put('vaccinations', entry);
  return entry;
};

/**
 * Update a vaccination entry
 */
export const updateVaccination = async (
  id: string,
  updates: Partial<Omit<VaccinationEntry, 'id' | 'profileId' | 'createdAt'>>
): Promise<VaccinationEntry | null> => {
  const db = await getDatabase();
  const existing = await db.get('vaccinations', id);

  if (!existing) return null;

  const updated: VaccinationEntry = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put('vaccinations', updated);
  return updated;
};

/**
 * Delete a vaccination entry
 */
export const deleteVaccination = async (id: string): Promise<boolean> => {
  const db = await getDatabase();
  try {
    await db.delete('vaccinations', id);
    return true;
  } catch {
    return false;
  }
};

/**
 * Remove attachment from vaccination (keeps the record)
 */
export const removeVaccinationAttachment = async (id: string): Promise<VaccinationEntry | null> => {
  return updateVaccination(id, { attachmentPath: undefined });
};
