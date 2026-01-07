import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { ExportOptions, CycleEntry, WeightEntry } from '@/core/types';
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

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const exportDataMobile = async (
  options: ExportOptions,
  profileId?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const db = await getDatabase();
    let cycles: CycleEntry[] = [];
    let weights: WeightEntry[] = [];

    if (options.dataType === 'cycles' || options.dataType === 'both') {
      const allCycles = await db.getAll('cycles');
      cycles = profileId 
        ? allCycles.filter(c => c.profileId === profileId)
        : allCycles;
    }

    if (options.dataType === 'weights' || options.dataType === 'both') {
      const allWeights = await db.getAll('weights');
      weights = profileId
        ? allWeights.filter(w => w.profileId === profileId)
        : allWeights;
    }

    const timestamp = formatDateForFile(new Date());
    let content: string;
    let filename: string;
    let mimeType: string;

    if (options.format === 'json') {
      const exportData = {
        cycles,
        weights,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      content = JSON.stringify(exportData, null, 2);
      filename = `chitra-backup-${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      // CSV format - combine into one file with sections
      let csvContent = '';
      
      if (options.dataType === 'cycles' || options.dataType === 'both') {
        csvContent += '# CYCLES\n';
        csvContent += convertCyclesToCSV(cycles);
        csvContent += '\n\n';
      }
      
      if (options.dataType === 'weights' || options.dataType === 'both') {
        csvContent += '# WEIGHTS\n';
        csvContent += convertWeightsToCSV(weights);
      }
      
      content = csvContent;
      filename = `chitra-export-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    if (Capacitor.isNativePlatform()) {
      // Save to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: 'utf8' as any,
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
