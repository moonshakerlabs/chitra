// Core Types for CHITRA Application

// ============ Profile Types ============
export type ProfileType = 'main' | 'dependent';

export type ProfileMode = 'normal' | 'pregnant' | 'postpartum' | 'childcare';

export type Gender = 'male' | 'female';

export interface Profile {
  id: string;
  name: string;
  type: ProfileType; // 'main' for 18+, 'dependent' for under 18
  avatar: string; // emoji identifier
  gender?: Gender; // required for dependents
  dateOfBirth?: string; // ISO date string - required for dependents
  mode?: ProfileMode; // normal, pregnant, or childcare
  pregnancyStartDate?: string; // when pregnancy mode was enabled
  expectedDueDate?: string; // expected delivery date
  createdAt: string;
  updatedAt: string;
}

// ============ Vaccination Types ============
export type AttachmentType = 'image' | 'pdf';

export interface VaccinationEntry {
  id: string;
  profileId: string;
  vaccineName: string;
  dateAdministered: string;
  notes?: string;
  attachmentPath?: string; // Path in CHITRA folder
  attachmentType?: AttachmentType; // image or pdf
  hospitalName?: string;
  doctorName?: string;
  nextDueDate?: string; // for next dose reminder
  reminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Feeding Types ============
export type FeedingType = 'breast_milk' | 'formula' | 'solid_food' | 'water' | 'other';

export type QuantityUnit = 'ml' | 'oz' | 'cups' | 'tbsp' | 'minutes';

export interface FeedingSchedule {
  id: string;
  profileId: string;
  feedingName: string;
  feedingType: FeedingType;
  reminderType: 'time' | 'interval';
  reminderTime?: string; // HH:mm format for fixed time
  intervalHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingLog {
  id: string;
  scheduleId?: string; // Optional - can log without schedule
  profileId: string;
  feedingType: FeedingType;
  quantity?: number;
  quantityUnit?: QuantityUnit;
  durationMinutes?: number; // For breastfeeding
  notes?: string;
  completedAt: string;
  snoozed: boolean;
  snoozeUntil?: string;
  createdAt: string;
}

export interface FeedingStatistics {
  totalFeedingsToday: number;
  totalFeedingsWeek: number;
  averageFeedingsPerDay: number;
  mostCommonType: FeedingType | null;
  totalQuantityToday: { [key in QuantityUnit]?: number };
  averageInterval: number | null; // in hours
  feedingsByType: { [key in FeedingType]?: number };
}

// ============ Medicine Types ============
export interface MedicineSchedule {
  id: string;
  profileId: string;
  medicineName: string;
  timesPerDay: number;
  intervalHours: number;
  totalDays?: number;
  totalReminders?: number;
  startDate: string;
  isActive: boolean;
  isPaused: boolean;
  remindersSent: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLog {
  id: string;
  scheduleId: string;
  profileId: string;
  takenAt?: string;
  snoozedAt?: string;
  snoozeUntil?: string;
  status: 'taken' | 'snoozed' | 'missed';
  createdAt: string;
}

// ============ Security Types ============
export interface SecuritySettings {
  pinEnabled: boolean;
  pinHash?: string; // Store hash, not plain PIN
  lastLockedAt?: string;
}

// ============ Cycle Tracking Types ============
export interface CycleEntry {
  id: string;
  profileId: string; // Associated profile
  startDate: string; // ISO date string
  endDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  mood?: MoodType;
  painLevel?: PainLevel;
  symptoms?: string[];
  createdAt: string;
  updatedAt: string;
}

export type MoodType = 'happy' | 'calm' | 'sad' | 'anxious' | 'tired' | 'neutral';

export type PainLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';

export interface CycleInsights {
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  lastCycleLength: number | null;
  nextPredictedStart: string | null;
  totalCyclesLogged: number;
}

// ============ Weight Tracking Types ============
export interface WeightEntry {
  id: string;
  profileId: string; // Associated profile
  date: string; // ISO date string
  weight: number;
  unit: WeightUnit;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightUnit = 'kg' | 'lb';

export interface WeightTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeAmount: number;
  changePercentage: number;
  periodDays: number;
}

// ============ Daily Check-in Types ============
export interface DailyCheckIn {
  id: string;
  profileId: string; // Associated profile
  date: string;
  mood?: MoodType;
  painLevel?: PainLevel;
  notes?: string;
  createdAt: string;
}

// ============ User Preferences Types ============
export interface UserPreferences {
  country: CountryCode;
  language: LanguageCode;
  theme: ThemeMode;
  colorTheme: ColorTheme;
  weightUnit: WeightUnit;
  onboardingCompleted: boolean;
  privacyAccepted: boolean;
  activeProfileId?: string; // Currently selected profile
  storageFolderPath?: string; // CHITRA folder path for exports/attachments
  storageFolderAcknowledged: boolean; // User acknowledged data warning
  // Notification preferences
  vaccinationRemindersEnabled?: boolean;
  medicineRemindersEnabled?: boolean;
  feedingRemindersEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CountryCode = 'USA' | 'UK' | 'IN' | 'EU' | 'AU' | 'NZ' | 'OTHER';

export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorTheme = 'pink' | 'green' | 'blue' | 'purple' | 'orange';

// ============ Care Points Types (Placeholder) ============
export interface CarePoints {
  totalPoints: number;
  dailyStreak: number;
  lastCheckInDate: string | null;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}

// ============ Payment Types ============
export type PaymentStatus = 'free' | 'trial' | 'paid' | 'subscription';

export type PaymentProvider = 'external' | 'google_play' | 'apple_store' | 'razorpay' | 'stripe';

export interface PaymentInfo {
  status: PaymentStatus;
  provider?: PaymentProvider;
  purchaseDate?: string;
  expiryDate?: string;
  region: 'IN' | 'INTL';
  price?: {
    amount: number;
    currency: string;
  };
}

// ============ Export/Import Types ============
export type ExportFormat = 'csv' | 'json';

export type ExportDataType = 'cycles' | 'weights' | 'both';

export interface ExportOptions {
  dataType: ExportDataType;
  format: ExportFormat;
  profileId?: string;
}

export interface ExportData {
  cycles: CycleEntry[];
  weights: WeightEntry[];
  checkIns: DailyCheckIn[];
  vaccinations: VaccinationEntry[];
  medicineSchedules: MedicineSchedule[];
  medicineLogs: MedicineLog[];
  feedingSchedules: FeedingSchedule[];
  feedingLogs: FeedingLog[];
  preferences: UserPreferences;
  exportedAt: string;
  appVersion: string;
}
