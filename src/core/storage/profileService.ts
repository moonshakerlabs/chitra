import { getDatabase } from './database';
import { generateId } from '@/core/utils/helpers';
import type { Profile, ProfileType } from '@/core/types';
import { getPreferences, savePreferences } from './preferences';

const PROFILE_AVATARS = ['👤', '👧', '👩', '💜', '🌸', '🦋', '🌺', '✨', '💖', '🌙'];

/**
 * Get all profiles
 */
export const getAllProfiles = async (): Promise<Profile[]> => {
  const db = await getDatabase();
  const profiles = await db.getAll('profiles');
  return profiles.sort((a, b) => {
    // Main profiles first, then by creation date
    if (a.type === 'main' && b.type !== 'main') return -1;
    if (a.type !== 'main' && b.type === 'main') return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

/**
 * Get a profile by ID
 */
export const getProfileById = async (id: string): Promise<Profile | undefined> => {
  const db = await getDatabase();
  return db.get('profiles', id);
};

/**
 * Get the active profile
 */
export const getActiveProfile = async (): Promise<Profile | null> => {
  const prefs = await getPreferences();
  const profiles = await getAllProfiles();
  
  if (profiles.length === 0) return null;
  
  if (prefs.activeProfileId) {
    const active = profiles.find(p => p.id === prefs.activeProfileId);
    if (active) return active;
  }
  
  // Return first profile as default
  return profiles[0];
};

/**
 * Set the active profile
 */
export const setActiveProfile = async (profileId: string): Promise<void> => {
  await savePreferences({ activeProfileId: profileId });
};

/**
 * Validate profile limits
 */
export const validateProfileAdd = async (type: ProfileType): Promise<{ valid: boolean; error?: string }> => {
  const profiles = await getAllProfiles();
  const mainCount = profiles.filter(p => p.type === 'main').length;
  const dependentCount = profiles.filter(p => p.type === 'dependent').length;
  
  if (type === 'main' && mainCount >= 1) {
    return { valid: false, error: 'Only one main profile (18+) allowed' };
  }
  if (type === 'dependent' && dependentCount >= 4) {
    return { valid: false, error: 'Maximum 4 dependent profiles allowed' };
  }
  if (profiles.length >= 5) {
    return { valid: false, error: 'Maximum 5 profiles allowed' };
  }
  
  return { valid: true };
};

/**
 * Add a new profile
 */
export const addProfile = async (
  name: string, 
  type: ProfileType, 
  avatar?: string,
  dateOfBirth?: string,
  gender?: 'male' | 'female'
): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
  const validation = await validateProfileAdd(type);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Pick a random avatar if not provided
  const selectedAvatar = avatar || PROFILE_AVATARS[Math.floor(Math.random() * PROFILE_AVATARS.length)];
  
  const newProfile: Profile = {
    id: generateId(),
    name,
    type,
    avatar: selectedAvatar,
    gender,
    dateOfBirth,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put('profiles', newProfile);
  return { success: true, profile: newProfile };
};

/**
 * Update a profile
 */
export const updateProfile = async (
  id: string, 
  updates: Partial<Omit<Profile, 'id' | 'createdAt'>>
): Promise<Profile | null> => {
  const db = await getDatabase();
  const existing = await db.get('profiles', id);
  
  if (!existing) return null;
  
  // If changing type, validate
  if (updates.type && updates.type !== existing.type) {
    const validation = await validateProfileAdd(updates.type);
    if (!validation.valid) return null;
  }
  
  const updated: Profile = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await db.put('profiles', updated);
  return updated;
};

/**
 * Delete a profile
 */
export const deleteProfile = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const db = await getDatabase();
  const profiles = await getAllProfiles();
  
  // Must keep at least one profile
  if (profiles.length <= 1) {
    return { success: false, error: 'Cannot delete the last profile' };
  }
  
  const profile = profiles.find(p => p.id === id);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  // Delete all data associated with this profile
  const cycles = await db.getAll('cycles');
  for (const cycle of cycles) {
    if (cycle.profileId === id) {
      await db.delete('cycles', cycle.id);
    }
  }
  
  const weights = await db.getAll('weights');
  for (const weight of weights) {
    if (weight.profileId === id) {
      await db.delete('weights', weight.id);
    }
  }
  
  const checkIns = await db.getAll('checkIns');
  for (const checkIn of checkIns) {
    if (checkIn.profileId === id) {
      await db.delete('checkIns', checkIn.id);
    }
  }
  
  await db.delete('profiles', id);
  
  // Update active profile if needed
  const prefs = await getPreferences();
  if (prefs.activeProfileId === id) {
    const remaining = profiles.filter(p => p.id !== id);
    await savePreferences({ activeProfileId: remaining[0]?.id });
  }
  
  return { success: true };
};

/**
 * Get available avatars
 */
export const getAvailableAvatars = (): string[] => {
  return PROFILE_AVATARS;
};
