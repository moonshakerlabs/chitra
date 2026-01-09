export { getDatabase, closeDatabase, clearAllData, clearAllDataIncludingPreferences, exportAllData } from './database';
export { 
  getPreferences, 
  savePreferences, 
  isOnboardingCompleted, 
  completeOnboarding,
  updateTheme,
  updateColorTheme,
  updateCountry,
  updateLanguage,
  updateWeightUnit,
  acceptPrivacy,
  resetPreferences
} from './preferences';
export {
  getAllProfiles,
  getProfileById,
  getActiveProfile,
  setActiveProfile,
  validateProfileAdd,
  addProfile,
  updateProfile,
  deleteProfile,
  getAvailableAvatars
} from './profileService';
export {
  getSecuritySettings,
  isPinEnabled,
  setPin,
  verifyPin,
  disablePin,
  updateLastLocked,
  changePin
} from './securityService';
