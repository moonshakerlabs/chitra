import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { getPreferences, savePreferences } from './preferences';

const CHITRA_FOLDER_NAME = 'CHITRA';
const CHITRA_MARKER_FILE = '.chitra_folder';

/**
 * Check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the configured storage folder path
 */
export const getStorageFolderPath = async (): Promise<string | null> => {
  const prefs = await getPreferences();
  return prefs.storageFolderPath || null;
};

/**
 * Check if storage folder is configured
 */
export const isStorageFolderConfigured = async (): Promise<boolean> => {
  const prefs = await getPreferences();
  return !!prefs.storageFolderPath && prefs.storageFolderAcknowledged;
};

/**
 * Save storage folder path to preferences
 */
export const setStorageFolderPath = async (path: string): Promise<void> => {
  await savePreferences({ 
    storageFolderPath: path,
    storageFolderAcknowledged: true 
  });
};

/**
 * Create CHITRA folder in Documents directory
 */
export const createChitraFolder = async (): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      // For web, just return a virtual path
      const virtualPath = '/CHITRA';
      await setStorageFolderPath(virtualPath);
      return { success: true, path: virtualPath };
    }

    // Create CHITRA folder in Documents
    const folderPath = CHITRA_FOLDER_NAME;
    
    try {
      await Filesystem.mkdir({
        path: folderPath,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (e) {
      // Folder might already exist, that's fine
    }

    // Create marker file to identify this as a CHITRA folder
    await Filesystem.writeFile({
      path: `${folderPath}/${CHITRA_MARKER_FILE}`,
      data: JSON.stringify({ 
        createdAt: new Date().toISOString(),
        version: '1.0.0' 
      }),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    // Create subfolders
    const subfolders = ['exports', 'vaccinations', 'medicines', 'backups'];
    for (const subfolder of subfolders) {
      try {
        await Filesystem.mkdir({
          path: `${folderPath}/${subfolder}`,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (e) {
        // Subfolder might already exist
      }
    }

    const fullPath = `Documents/${folderPath}`;
    await setStorageFolderPath(fullPath);

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error creating CHITRA folder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create folder' 
    };
  }
};

/**
 * Validate if a folder is a valid CHITRA folder
 */
export const validateChitraFolder = async (path: string): Promise<boolean> => {
  try {
    if (!isNativePlatform()) {
      return path === '/CHITRA';
    }

    // Check for marker file
    const markerPath = `${CHITRA_FOLDER_NAME}/${CHITRA_MARKER_FILE}`;
    await Filesystem.readFile({
      path: markerPath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a file exists in the CHITRA folder
 */
export const checkFileExists = async (relativePath: string): Promise<boolean> => {
  try {
    if (!isNativePlatform()) {
      return false; // Can't check in browser
    }

    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;
    await Filesystem.stat({
      path: fullPath,
      directory: Directory.Documents,
    });
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Get the full path for a file in the CHITRA folder
 */
export const getChitraFilePath = (relativePath: string): string => {
  return `${CHITRA_FOLDER_NAME}/${relativePath}`;
};

/**
 * Save a file to the CHITRA folder
 */
export const saveToChitraFolder = async (
  relativePath: string,
  content: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      // Browser fallback - trigger download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = relativePath.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    }

    const fullPath = getChitraFilePath(relativePath);
    
    const result = await Filesystem.writeFile({
      path: fullPath,
      data: content,
      directory: Directory.Documents,
      encoding: encoding === 'utf8' ? Encoding.UTF8 : undefined,
    });

    return { success: true, uri: result.uri };
  } catch (error) {
    console.error('Error saving to CHITRA folder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save file' 
    };
  }
};

/**
 * Read a file from the CHITRA folder
 */
export const readFromChitraFolder = async (
  relativePath: string
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      return { success: false, error: 'Not available in browser' };
    }

    const fullPath = getChitraFilePath(relativePath);
    
    const result = await Filesystem.readFile({
      path: fullPath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    return { success: true, data: result.data as string };
  } catch (error) {
    console.error('Error reading from CHITRA folder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'File not found' 
    };
  }
};

/**
 * Clear storage folder configuration (for reset/change folder)
 */
export const clearStorageFolderConfig = async (): Promise<void> => {
  await savePreferences({ 
    storageFolderPath: undefined,
    storageFolderAcknowledged: false 
  });
};
