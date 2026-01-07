import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  CycleEntry, 
  WeightEntry, 
  DailyCheckIn, 
  UserPreferences,
  CarePoints,
  PaymentInfo,
  Profile,
  SecuritySettings
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
}

const DB_NAME = 'chitra-db';
const DB_VERSION = 2;

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
  
  // If no profiles exist, create default and migrate data
  if (profiles.length === 0) {
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

    // Update existing cycles
    const cycles = await dbInstance.getAll('cycles');
    for (const cycle of cycles) {
      if (!cycle.profileId) {
        await dbInstance.put('cycles', { ...cycle, profileId: defaultProfile.id });
      }
    }

    // Update existing weights
    const weights = await dbInstance.getAll('weights');
    for (const weight of weights) {
      if (!weight.profileId) {
        await dbInstance.put('weights', { ...weight, profileId: defaultProfile.id });
      }
    }

    // Update existing checkIns
    const checkIns = await dbInstance.getAll('checkIns');
    for (const checkIn of checkIns) {
      if (!checkIn.profileId) {
        await dbInstance.put('checkIns', { ...checkIn, profileId: defaultProfile.id });
      }
    }

    // Update preferences with active profile
    const prefs = await dbInstance.get('preferences', 'user');
    if (prefs && !prefs.activeProfileId) {
      await dbInstance.put('preferences', { ...prefs, activeProfileId: defaultProfile.id });
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
 * Clear all data from the database
 */
export const clearAllData = async (): Promise<void> => {
  const db = await getDatabase();
  
  await db.clear('cycles');
  await db.clear('weights');
  await db.clear('checkIns');
  await db.clear('preferences');
  await db.clear('carePoints');
  await db.clear('payment');
  await db.clear('profiles');
  await db.clear('security');
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
    preferences: await db.get('preferences', 'user'),
    carePoints: await db.get('carePoints', 'user'),
    payment: await db.get('payment', 'user'),
    profiles: await db.getAll('profiles'),
  };
};
