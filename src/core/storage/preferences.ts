import { getDatabase } from './database';
import type { UserPreferences, ThemeMode, ColorTheme, CountryCode, LanguageCode, WeightUnit } from '../types';

const PREFERENCES_KEY = 'user';

const defaultPreferences: UserPreferences = {
  country: 'OTHER',
  language: 'en',
  theme: 'system',
  colorTheme: 'pink',
  weightUnit: 'kg',
  onboardingCompleted: false,
  privacyAccepted: false,
  storageFolderAcknowledged: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Get user preferences
 */
export const getPreferences = async (): Promise<UserPreferences> => {
  const db = await getDatabase();
  const preferences = await db.get('preferences', PREFERENCES_KEY);
  return preferences || defaultPreferences;
};

/**
 * Save user preferences
 */
export const savePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
  const db = await getDatabase();
  const current = await getPreferences();
  
  const updated: UserPreferences = {
    ...current,
    ...preferences,
    updatedAt: new Date().toISOString(),
  };
  
  await db.put('preferences', { ...updated, id: PREFERENCES_KEY } as UserPreferences & { id: string });
  return updated;
};

/**
 * Check if onboarding is completed
 */
export const isOnboardingCompleted = async (): Promise<boolean> => {
  const prefs = await getPreferences();
  return prefs.onboardingCompleted;
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (): Promise<void> => {
  await savePreferences({ onboardingCompleted: true });
};

/**
 * Update theme mode
 */
export const updateTheme = async (theme: ThemeMode): Promise<void> => {
  await savePreferences({ theme });
};

/**
 * Update color theme
 */
export const updateColorTheme = async (colorTheme: ColorTheme): Promise<void> => {
  await savePreferences({ colorTheme });
};

/**
 * Update country
 */
export const updateCountry = async (country: CountryCode): Promise<void> => {
  await savePreferences({ country });
};

/**
 * Update language
 */
export const updateLanguage = async (language: LanguageCode): Promise<void> => {
  await savePreferences({ language });
};

/**
 * Update weight unit
 */
export const updateWeightUnit = async (weightUnit: WeightUnit): Promise<void> => {
  await savePreferences({ weightUnit });
};

/**
 * Accept privacy policy
 */
export const acceptPrivacy = async (): Promise<void> => {
  await savePreferences({ privacyAccepted: true });
};

/**
 * Reset all preferences to default
 */
export const resetPreferences = async (): Promise<void> => {
  await savePreferences({
    ...defaultPreferences,
    createdAt: new Date().toISOString(),
  });
};
