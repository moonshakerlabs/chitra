import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/core/context/ProfileContext';
import type { VaccinationEntry } from '@/core/types';
import {
  getAllVaccinations,
  addVaccination,
  updateVaccination,
  deleteVaccination,
} from './vaccinationService';

export const useVaccinations = () => {
  const { activeProfile } = useProfile();
  const [vaccinations, setVaccinations] = useState<VaccinationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVaccinations = useCallback(async () => {
    if (!activeProfile) {
      setVaccinations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getAllVaccinations(activeProfile.id);
    setVaccinations(data);
    setLoading(false);
  }, [activeProfile?.id]);

  useEffect(() => {
    loadVaccinations();
  }, [loadVaccinations]);

  const add = async (
    vaccineName: string,
    dateAdministered: string,
    notes?: string,
    attachmentPath?: string
  ) => {
    if (!activeProfile) return null;
    const entry = await addVaccination(
      activeProfile.id,
      vaccineName,
      dateAdministered,
      notes,
      attachmentPath
    );
    await loadVaccinations();
    return entry;
  };

  const update = async (
    id: string,
    updates: Partial<Omit<VaccinationEntry, 'id' | 'profileId' | 'createdAt'>>
  ) => {
    const updated = await updateVaccination(id, updates);
    if (updated) {
      await loadVaccinations();
    }
    return updated;
  };

  const remove = async (id: string) => {
    const success = await deleteVaccination(id);
    if (success) {
      await loadVaccinations();
    }
    return success;
  };

  return {
    vaccinations,
    loading,
    reload: loadVaccinations,
    add,
    update,
    remove,
  };
};
