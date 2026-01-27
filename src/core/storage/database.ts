import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  CycleEntry, 
  WeightEntry, 
  DailyCheckIn, 
  UserPreferences,
  CarePoints,
  PaymentInfo,
  Profile,
  SecuritySettings,
  VaccinationEntry,
  FeedingSchedule,
  FeedingLog,
  MedicineSchedule,
  MedicineLog,
  ScreenTimeEntry
} from '../types';

// Database schema
interface ChitraDB extends DBSchema {
  cycles: {
    key: string;
    value: CycleEntry;
    indexes: { 'by-date': string; 'by-profile': string };
  };
  weights: {
    key: string;
    value: WeightEntry;
    indexes: { 'by-date': string; 'by-profile': string };
  };
  checkIns: {
    key: string;
    value: DailyCheckIn;
    indexes: { 'by-date': string; 'by-profile': string };
  };
  preferences: {
    key: string;
    value: UserPreferences & { id: string };
  };
  carePoints: {
    key: string;
    value: CarePoints;
  };
  payment: {
    key: string;
    value: PaymentInfo;
  };
  profiles: {
    key: string;
    value: Profile;
    indexes: { 'by-type': string };
  };
  security: {
    key: string;
    value: SecuritySettings & { id: string };
  };
  vaccinations: {
    key: string;
    value: VaccinationEntry;
    indexes: { 'by-profile': string; 'by-date': string };
  };
  feedingSchedules: {
    key: string;
    value: FeedingSchedule;
    indexes: { 'by-profile': string };
  };
  feedingLogs: {
    key: string;
    value: FeedingLog;
    indexes: { 'by-profile': string; 'by-schedule': string };
  };
  medicineSchedules: {
    key: string;
    value: MedicineSchedule;
    indexes: { 'by-profile': string };
  };
  medicineLogs: {
    key: string;
    value: MedicineLog;
    indexes: { 'by-profile': string; 'by-schedule': string };
  };
  screenTime: {
    key: string;
    value: ScreenTimeEntry;
    indexes: { 'by-profile': string; 'by-year': number };
  };
}

const DB_NAME = 'chitra-db';
const DB_VERSION = 5;

let dbInstance: IDBPDatabase<ChitraDB> | null = null;

/**
 * Initialize and get the database instance
 */
export const getDatabase = async (): Promise<IDBPDatabase<ChitraDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ChitraDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Cycles store
      if (!db.objectStoreNames.contains('cycles')) {
        const cycleStore = db.createObjectStore('cycles', { keyPath: 'id' });
        cycleStore.createIndex('by-date', 'startDate');
        cycleStore.createIndex('by-profile', 'profileId');
      } else if (oldVersion < 2) {
        const cycleStore = transaction.objectStore('cycles');
        if (!cycleStore.indexNames.contains('by-profile')) {
          cycleStore.createIndex('by-profile', 'profileId');
        }
      }

      // Weights store
      if (!db.objectStoreNames.contains('weights')) {
        const weightStore = db.createObjectStore('weights', { keyPath: 'id' });
        weightStore.createIndex('by-date', 'date');
        weightStore.createIndex('by-profile', 'profileId');
      } else if (oldVersion < 2) {
        const weightStore = transaction.objectStore('weights');
        if (!weightStore.indexNames.contains('by-profile')) {
          weightStore.createIndex('by-profile', 'profileId');
        }
      }

      // Check-ins store
      if (!db.objectStoreNames.contains('checkIns')) {
        const checkInStore = db.createObjectStore('checkIns', { keyPath: 'id' });
        checkInStore.createIndex('by-date', 'date');
        checkInStore.createIndex('by-profile', 'profileId');
      } else if (oldVersion < 2) {
        const checkInStore = transaction.objectStore('checkIns');
        if (!checkInStore.indexNames.contains('by-profile')) {
          checkInStore.createIndex('by-profile', 'profileId');
        }
      }

      // Preferences store
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'id' });
      }

      // Care Points store
      if (!db.objectStoreNames.contains('carePoints')) {
        db.createObjectStore('carePoints', { keyPath: 'id' });
      }

      // Payment store
      if (!db.objectStoreNames.contains('payment')) {
        db.createObjectStore('payment', { keyPath: 'id' });
      }

      // Profiles store (new in v2)
      if (!db.objectStoreNames.contains('profiles')) {
        const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
        profileStore.createIndex('by-type', 'type');
      }

      // Security store (new in v2)
      if (!db.objectStoreNames.contains('security')) {
        db.createObjectStore('security', { keyPath: 'id' });
      }

      // Vaccinations store (new in v3)
      if (!db.objectStoreNames.contains('vaccinations')) {
        const vaccStore = db.createObjectStore('vaccinations', { keyPath: 'id' });
        vaccStore.createIndex('by-profile', 'profileId');
        vaccStore.createIndex('by-date', 'dateAdministered');
      }

      // Feeding Schedules store (new in v3)
      if (!db.objectStoreNames.contains('feedingSchedules')) {
        const feedingSchedStore = db.createObjectStore('feedingSchedules', { keyPath: 'id' });
        feedingSchedStore.createIndex('by-profile', 'profileId');
      }

      // Feeding Logs store (new in v3)
      if (!db.objectStoreNames.contains('feedingLogs')) {
        const feedingLogStore = db.createObjectStore('feedingLogs', { keyPath: 'id' });
        feedingLogStore.createIndex('by-profile', 'profileId');
        feedingLogStore.createIndex('by-schedule', 'scheduleId');
      }

      // Medicine Schedules store (new in v3)
      if (!db.objectStoreNames.contains('medicineSchedules')) {
        const medSchedStore = db.createObjectStore('medicineSchedules', { keyPath: 'id' });
        medSchedStore.createIndex('by-profile', 'profileId');
      }

      // Medicine Logs store (new in v3)
      if (!db.objectStoreNames.contains('medicineLogs')) {
        const medLogStore = db.createObjectStore('medicineLogs', { keyPath: 'id' });
        medLogStore.createIndex('by-profile', 'profileId');
        medLogStore.createIndex('by-schedule', 'scheduleId');
      }

      // Screen Time store (new in v5)
      if (!db.objectStoreNames.contains('screenTime')) {
        const screenTimeStore = db.createObjectStore('screenTime', { keyPath: 'id' });
        screenTimeStore.createIndex('by-profile', 'profileId');
        screenTimeStore.createIndex('by-year', 'year');
      }
    },
  });

  // Run migration for existing data
  await migrateExistingData();

  return dbInstance;
};

/**
 * Migrate existing data to include profileId
 */
const migrateExistingData = async (): Promise<void> => {
  if (!dbInstance) return;

  const profiles = await dbInstance.getAll('profiles');
  
  // Only create default profile if NO profiles exist at all
  // This prevents overwriting existing profiles during upgrade
  if (profiles.length === 0) {
    // Check if there's any cycle/weight data without a profile
    const cycles = await dbInstance.getAll('cycles');
    const weights = await dbInstance.getAll('weights');
    const checkIns = await dbInstance.getAll('checkIns');
    
    const hasOrphanedData = cycles.some(c => !c.profileId) || 
                            weights.some(w => !w.profileId) || 
                            checkIns.some(ch => !ch.profileId);
    
    // Only create default profile if there's orphaned data to migrate
    if (hasOrphanedData) {
      const now = new Date().toISOString();
      const defaultProfile: Profile = {
        id: 'default-profile',
        name: 'Me',
        type: 'main',
        avatar: '👤',
        createdAt: now,
        updatedAt: now,
      };
      
      await dbInstance.put('profiles', defaultProfile);

      // Update existing cycles that have no profileId
      for (const cycle of cycles) {
        if (!cycle.profileId) {
          await dbInstance.put('cycles', { ...cycle, profileId: defaultProfile.id });
        }
      }

      // Update existing weights that have no profileId
      for (const weight of weights) {
        if (!weight.profileId) {
          await dbInstance.put('weights', { ...weight, profileId: defaultProfile.id });
        }
      }

      // Update existing checkIns that have no profileId
      for (const checkIn of checkIns) {
        if (!checkIn.profileId) {
          await dbInstance.put('checkIns', { ...checkIn, profileId: defaultProfile.id });
        }
      }

      // Update preferences with active profile only if not set
      const prefs = await dbInstance.get('preferences', 'user');
      if (prefs && !prefs.activeProfileId) {
        await dbInstance.put('preferences', { ...prefs, activeProfileId: defaultProfile.id });
      }
    }
  } else {
    // Profiles exist - don't touch them!
    // Only migrate orphaned data to the first main profile if any exists
    const mainProfile = profiles.find(p => p.type === 'main') || profiles[0];
    
    const cycles = await dbInstance.getAll('cycles');
    for (const cycle of cycles) {
      if (!cycle.profileId) {
        await dbInstance.put('cycles', { ...cycle, profileId: mainProfile.id });
      }
    }

    const weights = await dbInstance.getAll('weights');
    for (const weight of weights) {
      if (!weight.profileId) {
        await dbInstance.put('weights', { ...weight, profileId: mainProfile.id });
      }
    }

    const checkIns = await dbInstance.getAll('checkIns');
    for (const checkIn of checkIns) {
      if (!checkIn.profileId) {
        await dbInstance.put('checkIns', { ...checkIn, profileId: mainProfile.id });
      }
    }
  }
};

/**
 * Close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

/**
 * Clear all data from the database (except preferences)
 */
export const clearAllData = async (): Promise<void> => {
  const db = await getDatabase();
  
  await db.clear('cycles');
  await db.clear('weights');
  await db.clear('checkIns');
  await db.clear('carePoints');
  await db.clear('payment');
  await db.clear('profiles');
  await db.clear('security');
  await db.clear('vaccinations');
  await db.clear('feedingSchedules');
  await db.clear('feedingLogs');
  await db.clear('medicineSchedules');
  await db.clear('medicineLogs');
  await db.clear('screenTime');
  // Note: preferences are NOT cleared to preserve theme/color settings
};

/**
 * Clear all data including preferences (for full reset)
 */
export const clearAllDataIncludingPreferences = async (): Promise<void> => {
  const db = await getDatabase();
  
  await db.clear('cycles');
  await db.clear('weights');
  await db.clear('checkIns');
  await db.clear('preferences');
  await db.clear('carePoints');
  await db.clear('payment');
  await db.clear('profiles');
  await db.clear('security');
  await db.clear('vaccinations');
  await db.clear('feedingSchedules');
  await db.clear('feedingLogs');
  await db.clear('medicineSchedules');
  await db.clear('medicineLogs');
  await db.clear('screenTime');
};

/**
 * Export all data from the database
 */
export const exportAllData = async () => {
  const db = await getDatabase();
  
  return {
    cycles: await db.getAll('cycles'),
    weights: await db.getAll('weights'),
    checkIns: await db.getAll('checkIns'),
    vaccinations: await db.getAll('vaccinations'),
    medicineSchedules: await db.getAll('medicineSchedules'),
    medicineLogs: await db.getAll('medicineLogs'),
    feedingSchedules: await db.getAll('feedingSchedules'),
    feedingLogs: await db.getAll('feedingLogs'),
    screenTime: await db.getAll('screenTime'),
    preferences: await db.get('preferences', 'user'),
    carePoints: await db.get('carePoints', 'user'),
    payment: await db.get('payment', 'user'),
    profiles: await db.getAll('profiles'),
  };
};
