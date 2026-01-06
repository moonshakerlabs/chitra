import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  CycleEntry, 
  WeightEntry, 
  DailyCheckIn, 
  UserPreferences,
  CarePoints,
  PaymentInfo
} from '../types';

// Database schema
interface ChitraDB extends DBSchema {
  cycles: {
    key: string;
    value: CycleEntry;
    indexes: { 'by-date': string };
  };
  weights: {
    key: string;
    value: WeightEntry;
    indexes: { 'by-date': string };
  };
  checkIns: {
    key: string;
    value: DailyCheckIn;
    indexes: { 'by-date': string };
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  carePoints: {
    key: string;
    value: CarePoints;
  };
  payment: {
    key: string;
    value: PaymentInfo;
  };
}

const DB_NAME = 'chitra-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ChitraDB> | null = null;

/**
 * Initialize and get the database instance
 */
export const getDatabase = async (): Promise<IDBPDatabase<ChitraDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ChitraDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cycles store
      if (!db.objectStoreNames.contains('cycles')) {
        const cycleStore = db.createObjectStore('cycles', { keyPath: 'id' });
        cycleStore.createIndex('by-date', 'startDate');
      }

      // Weights store
      if (!db.objectStoreNames.contains('weights')) {
        const weightStore = db.createObjectStore('weights', { keyPath: 'id' });
        weightStore.createIndex('by-date', 'date');
      }

      // Check-ins store
      if (!db.objectStoreNames.contains('checkIns')) {
        const checkInStore = db.createObjectStore('checkIns', { keyPath: 'id' });
        checkInStore.createIndex('by-date', 'date');
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
    },
  });

  return dbInstance;
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
  };
};
