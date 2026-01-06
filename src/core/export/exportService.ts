import { exportAllData } from '../storage/database';
import type { CycleEntry, WeightEntry, DailyCheckIn, PainLevel } from '../types';

export interface ExportData {
  cycles: CycleEntry[];
  weights: WeightEntry[];
  checkIns: DailyCheckIn[];
  exportedAt: string;
  version: string;
}

/**
 * Export all data to JSON format
 */
export const exportToJSON = async (): Promise<void> => {
  const data = await exportAllData();
  
  const exportData: ExportData = {
    cycles: data.cycles || [],
    weights: data.weights || [],
    checkIns: data.checkIns || [],
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `chitra-backup-${formatDateForFile(new Date())}.json`);
};

/**
 * Export all data to CSV format (separate files in a zip or individual downloads)
 */
export const exportToCSV = async (): Promise<void> => {
  const data = await exportAllData();
  
  // Export cycles
  if (data.cycles && data.cycles.length > 0) {
    const cycleCSV = convertCyclesToCSV(data.cycles);
    const blob = new Blob([cycleCSV], { type: 'text/csv' });
    downloadBlob(blob, `chitra-cycles-${formatDateForFile(new Date())}.csv`);
  }

  // Export weights
  if (data.weights && data.weights.length > 0) {
    const weightCSV = convertWeightsToCSV(data.weights);
    const blob = new Blob([weightCSV], { type: 'text/csv' });
    downloadBlob(blob, `chitra-weights-${formatDateForFile(new Date())}.csv`);
  }

  // Export check-ins
  if (data.checkIns && data.checkIns.length > 0) {
    const checkInCSV = convertCheckInsToCSV(data.checkIns);
    const blob = new Blob([checkInCSV], { type: 'text/csv' });
    downloadBlob(blob, `chitra-checkins-${formatDateForFile(new Date())}.csv`);
  }
};

/**
 * Import data from JSON file
 */
export const importFromJSON = async (file: File): Promise<{ success: boolean; message: string; counts?: { cycles: number; weights: number; checkIns: number } }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;
        
        // Validate structure
        if (!data.cycles && !data.weights && !data.checkIns) {
          resolve({ success: false, message: 'Invalid file format. No data found.' });
          return;
        }

        const { getDatabase } = await import('../storage/database');
        const db = await getDatabase();

        let cycleCount = 0;
        let weightCount = 0;
        let checkInCount = 0;

        // Import cycles
        if (data.cycles && Array.isArray(data.cycles)) {
          for (const cycle of data.cycles) {
            await db.put('cycles', cycle);
            cycleCount++;
          }
        }

        // Import weights
        if (data.weights && Array.isArray(data.weights)) {
          for (const weight of data.weights) {
            await db.put('weights', weight);
            weightCount++;
          }
        }

        // Import check-ins
        if (data.checkIns && Array.isArray(data.checkIns)) {
          for (const checkIn of data.checkIns) {
            await db.put('checkIns', checkIn);
            checkInCount++;
          }
        }

        resolve({ 
          success: true, 
          message: 'Data imported successfully!',
          counts: { cycles: cycleCount, weights: weightCount, checkIns: checkInCount }
        });
      } catch (error) {
        resolve({ success: false, message: 'Failed to parse file. Please check the file format.' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read file.' });
    };

    reader.readAsText(file);
  });
};

/**
 * Import data from CSV file
 */
export const importFromCSV = async (file: File, dataType: 'cycles' | 'weights' | 'checkIns'): Promise<{ success: boolean; message: string; count?: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const rows = parseCSV(content);
        
        if (rows.length < 2) {
          resolve({ success: false, message: 'CSV file is empty or has no data rows.' });
          return;
        }

        const { getDatabase } = await import('../storage/database');
        const db = await getDatabase();
        const headers = rows[0];
        let count = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });

          if (dataType === 'cycles') {
            const cycle: CycleEntry = {
              id: obj.id || crypto.randomUUID(),
              startDate: obj.startDate,
              endDate: obj.endDate || undefined,
              notes: obj.notes || undefined,
              createdAt: obj.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await db.put('cycles', cycle);
          } else if (dataType === 'weights') {
            const weight: WeightEntry = {
              id: obj.id || crypto.randomUUID(),
              date: obj.date,
              weight: parseFloat(obj.weight) || 0,
              unit: (obj.unit as 'kg' | 'lb') || 'kg',
              notes: obj.notes || undefined,
              createdAt: obj.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await db.put('weights', weight);
          } else if (dataType === 'checkIns') {
          const checkIn: DailyCheckIn = {
              id: obj.id || crypto.randomUUID(),
              date: obj.date,
              mood: obj.mood as DailyCheckIn['mood'],
              painLevel: obj.painLevel as PainLevel || undefined,
              notes: obj.notes || undefined,
              createdAt: obj.createdAt || new Date().toISOString(),
            };
            await db.put('checkIns', checkIn);
          }
          count++;
        }

        resolve({ success: true, message: `Imported ${count} ${dataType} records.`, count });
      } catch (error) {
        resolve({ success: false, message: 'Failed to parse CSV file.' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read file.' });
    };

    reader.readAsText(file);
  });
};

// Helper functions
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const formatDateForFile = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const convertCyclesToCSV = (cycles: CycleEntry[]): string => {
  const headers = ['id', 'startDate', 'endDate', 'notes', 'createdAt', 'updatedAt'];
  const rows = cycles.map(c => [
    c.id,
    c.startDate,
    c.endDate || '',
    c.notes || '',
    c.createdAt,
    c.updatedAt,
  ].map(escapeCSV));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertWeightsToCSV = (weights: WeightEntry[]): string => {
  const headers = ['id', 'date', 'weight', 'unit', 'notes', 'createdAt', 'updatedAt'];
  const rows = weights.map(w => [
    w.id,
    w.date,
    w.weight.toString(),
    w.unit,
    w.notes || '',
    w.createdAt,
    w.updatedAt,
  ].map(escapeCSV));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const convertCheckInsToCSV = (checkIns: DailyCheckIn[]): string => {
  const headers = ['id', 'date', 'mood', 'painLevel', 'notes', 'createdAt'];
  const rows = checkIns.map(c => [
    c.id,
    c.date,
    c.mood || '',
    c.painLevel || '',
    c.notes || '',
    c.createdAt,
  ].map(escapeCSV));
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const parseCSV = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};
