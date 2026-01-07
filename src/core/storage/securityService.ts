import { getDatabase } from './database';
import type { SecuritySettings } from '@/core/types';

const SECURITY_KEY = 'user';

/**
 * Simple hash function for PIN (not cryptographically secure, but sufficient for local storage)
 */
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'pin_' + Math.abs(hash).toString(16);
};

/**
 * Get security settings
 */
export const getSecuritySettings = async (): Promise<SecuritySettings> => {
  const db = await getDatabase();
  const settings = await db.get('security', SECURITY_KEY);
  return settings || { pinEnabled: false };
};

/**
 * Check if PIN protection is enabled
 */
export const isPinEnabled = async (): Promise<boolean> => {
  const settings = await getSecuritySettings();
  return settings.pinEnabled && !!settings.pinHash;
};

/**
 * Set PIN
 */
export const setPin = async (pin: string): Promise<void> => {
  if (pin.length !== 6 || !/^\d+$/.test(pin)) {
    throw new Error('PIN must be exactly 6 digits');
  }
  
  const db = await getDatabase();
  const settings = await getSecuritySettings();
  
  const updated: SecuritySettings & { id: string } = {
    ...settings,
    id: SECURITY_KEY,
    pinEnabled: true,
    pinHash: hashPin(pin),
  };
  
  await db.put('security', updated);
};

/**
 * Verify PIN
 */
export const verifyPin = async (pin: string): Promise<boolean> => {
  const settings = await getSecuritySettings();
  if (!settings.pinEnabled || !settings.pinHash) return true;
  
  return settings.pinHash === hashPin(pin);
};

/**
 * Disable PIN protection
 */
export const disablePin = async (): Promise<void> => {
  const db = await getDatabase();
  
  const updated: SecuritySettings & { id: string } = {
    id: SECURITY_KEY,
    pinEnabled: false,
    pinHash: undefined,
    lastLockedAt: undefined,
  };
  
  await db.put('security', updated);
};

/**
 * Update last locked time
 */
export const updateLastLocked = async (): Promise<void> => {
  const db = await getDatabase();
  const settings = await getSecuritySettings();
  
  const updated: SecuritySettings & { id: string } = {
    ...settings,
    id: SECURITY_KEY,
    lastLockedAt: new Date().toISOString(),
  };
  
  await db.put('security', updated);
};

/**
 * Change PIN (requires current PIN verification)
 */
export const changePin = async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
  const isValid = await verifyPin(currentPin);
  if (!isValid) {
    return { success: false, error: 'Current PIN is incorrect' };
  }
  
  try {
    await setPin(newPin);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to set new PIN' };
  }
};
