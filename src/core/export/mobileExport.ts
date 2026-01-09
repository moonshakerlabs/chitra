import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { 
  ExportOptions, 
  CycleEntry, 
  WeightEntry, 
  VaccinationEntry,
  MedicineSchedule,
  MedicineLog,
  FeedingSchedule,
  FeedingLog,
  Profile
} from '@/core/types';
import { getDatabase } from '@/core/storage/database';

const formatDateForFile = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const convertCyclesToCSV = (cycles: CycleEntry[]): string => {
  const headers = ['id', 'profileId', 'startDate', 'endDate', 'notes', 'mood', 'painLevel', 'createdAt', 'updatedAt'];
  const rows = cycles.map(c => [
    c.id,
    c.profileId || '',
    c.startDate,
    c.endDate || '',
    c.notes || '',
    c.mood || '',
    c.painLevel || '',
    c.createdAt,
    c.updatedAt,
  ].map(v => escapeCSV(String(v))));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertWeightsToCSV = (weights: WeightEntry[]): string => {
  const headers = ['id', 'profileId', 'date', 'weight', 'unit', 'notes', 'createdAt', 'updatedAt'];
  const rows = weights.map(w => [
    w.id,
    w.profileId || '',
    w.date,
    w.weight.toString(),
    w.unit,
    w.notes || '',
    w.createdAt,
    w.updatedAt,
  ].map(v => escapeCSV(String(v))));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertVaccinationsToCSV = (vaccinations: VaccinationEntry[]): string => {
  const headers = ['id', 'profileId', 'vaccineName', 'dateAdministered', 'hospitalName', 'doctorName', 'nextDueDate', 'notes', 'createdAt', 'updatedAt'];
  const rows = vaccinations.map(v => [
    v.id,
    v.profileId,
    v.vaccineName,
    v.dateAdministered,
    v.hospitalName || '',
    v.doctorName || '',
    v.nextDueDate || '',
    v.notes || '',
    v.createdAt,
    v.updatedAt,
  ].map(v => escapeCSV(String(v))));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertMedicineSchedulesToCSV = (schedules: MedicineSchedule[]): string => {
  const headers = ['id', 'profileId', 'medicineName', 'timesPerDay', 'intervalHours', 'totalDays', 'startDate', 'isActive', 'isPaused', 'remindersSent', 'createdAt', 'updatedAt'];
  const rows = schedules.map(s => [
    s.id,
    s.profileId,
    s.medicineName,
    s.timesPerDay.toString(),
    s.intervalHours.toString(),
    s.totalDays?.toString() || '',
    s.startDate,
    s.isActive.toString(),
    s.isPaused.toString(),
    s.remindersSent.toString(),
    s.createdAt,
    s.updatedAt,
  ].map(v => escapeCSV(String(v))));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertMedicineLogsToCSV = (logs: MedicineLog[]): string => {
  const headers = ['id', 'scheduleId', 'profileId', 'takenAt', 'snoozedAt', 'snoozeUntil', 'status', 'createdAt'];
  const rows = logs.map(l => [
    l.id,
    l.scheduleId,
    l.profileId,
    l.takenAt || '',
    l.snoozedAt || '',
    l.snoozeUntil || '',
    l.status,
    l.createdAt,
  ].map(v => escapeCSV(String(v))));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export type ExportDataTypeExtended = 'cycles' | 'weights' | 'vaccinations' | 'medicine' | 'all';

export interface ExtendedExportOptions {
  dataType: ExportDataTypeExtended;
  format: 'json' | 'csv';
  profileId?: string;
}

export const exportDataMobile = async (
  options: ExportOptions | ExtendedExportOptions,
  profileId?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const db = await getDatabase();
    
    // Get all data based on options
    let cycles: CycleEntry[] = [];
    let weights: WeightEntry[] = [];
    let vaccinations: VaccinationEntry[] = [];
    let medicineSchedules: MedicineSchedule[] = [];
    let medicineLogs: MedicineLog[] = [];
    let feedingSchedules: FeedingSchedule[] = [];
    let feedingLogs: FeedingLog[] = [];
    let profiles: Profile[] = [];

    const dataType = options.dataType;
    const filterByProfile = (items: any[], field: string = 'profileId') => {
      return profileId ? items.filter(item => item[field] === profileId) : items;
    };

    // Get cycles
    if (dataType === 'cycles' || dataType === 'both' || dataType === 'all') {
      const allCycles = await db.getAll('cycles');
      cycles = filterByProfile(allCycles);
    }

    // Get weights
    if (dataType === 'weights' || dataType === 'both' || dataType === 'all') {
      const allWeights = await db.getAll('weights');
      weights = filterByProfile(allWeights);
    }

    // Get vaccinations
    if (dataType === 'vaccinations' || dataType === 'all') {
      const allVaccinations = await db.getAll('vaccinations');
      vaccinations = filterByProfile(allVaccinations);
    }

    // Get medicine data
    if (dataType === 'medicine' || dataType === 'all') {
      const allMedicineSchedules = await db.getAll('medicineSchedules');
      const allMedicineLogs = await db.getAll('medicineLogs');
      medicineSchedules = filterByProfile(allMedicineSchedules);
      medicineLogs = filterByProfile(allMedicineLogs);
    }

    // Get feeding data for 'all' export
    if (dataType === 'all') {
      const allFeedingSchedules = await db.getAll('feedingSchedules');
      const allFeedingLogs = await db.getAll('feedingLogs');
      feedingSchedules = filterByProfile(allFeedingSchedules);
      feedingLogs = filterByProfile(allFeedingLogs);
      profiles = await db.getAll('profiles');
      if (profileId) {
        profiles = profiles.filter(p => p.id === profileId);
      }
    }

    const timestamp = formatDateForFile(new Date());
    let content: string;
    let filename: string;
    let mimeType: string;

    if (options.format === 'json') {
      const exportData = {
        cycles,
        weights,
        vaccinations,
        medicineSchedules,
        medicineLogs,
        feedingSchedules,
        feedingLogs,
        profiles: dataType === 'all' ? profiles : undefined,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        exportType: profileId ? 'single_profile' : 'all_profiles',
        profileId: profileId || null,
      };
      content = JSON.stringify(exportData, null, 2);
      filename = profileId 
        ? `chitra-backup-profile-${timestamp}.json`
        : `chitra-backup-all-${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      // CSV format - combine into one file with sections
      let csvContent = '';
      
      if (cycles.length > 0) {
        csvContent += '# CYCLES\n';
        csvContent += convertCyclesToCSV(cycles);
        csvContent += '\n\n';
      }
      
      if (weights.length > 0) {
        csvContent += '# WEIGHTS\n';
        csvContent += convertWeightsToCSV(weights);
        csvContent += '\n\n';
      }
      
      if (vaccinations.length > 0) {
        csvContent += '# VACCINATIONS\n';
        csvContent += convertVaccinationsToCSV(vaccinations);
        csvContent += '\n\n';
      }
      
      if (medicineSchedules.length > 0) {
        csvContent += '# MEDICINE SCHEDULES\n';
        csvContent += convertMedicineSchedulesToCSV(medicineSchedules);
        csvContent += '\n\n';
      }
      
      if (medicineLogs.length > 0) {
        csvContent += '# MEDICINE LOGS\n';
        csvContent += convertMedicineLogsToCSV(medicineLogs);
        csvContent += '\n\n';
      }
      
      content = csvContent.trim();
      filename = profileId 
        ? `chitra-export-profile-${timestamp}.csv`
        : `chitra-export-all-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    if (Capacitor.isNativePlatform()) {
      // Save to CHITRA/exports folder
      const result = await Filesystem.writeFile({
        path: `CHITRA/exports/${filename}`,
        data: content,
        directory: Directory.Documents,
        encoding: 'utf8' as any,
        recursive: true,
      });

      // Try to share the file
      try {
        await Share.share({
          title: 'CHITRA Export',
          text: `Your CHITRA data has been exported`,
          url: result.uri,
          dialogTitle: 'Share your backup',
        });
      } catch (shareError) {
        // Share was cancelled or failed, file is still saved
        console.log('Share cancelled or unavailable');
      }

      return { 
        success: true, 
        filePath: result.uri 
      };
    } else {
      // Browser fallback
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
};
