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
 * Request filesystem permissions
 */
export const requestFilePermissions = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    return true;
  }
  
  try {
    // Try to request permissions by attempting to read a directory
    await Filesystem.checkPermissions();
    const result = await Filesystem.requestPermissions();
    return result.publicStorage === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Create CHITRA folder in a specific directory
 */
export const createChitraFolderInDirectory = async (
  directory: Directory,
  customPath?: string
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      const virtualPath = customPath || '/CHITRA';
      await setStorageFolderPath(virtualPath);
      return { success: true, path: virtualPath };
    }

    // Request permissions first
    const hasPermission = await requestFilePermissions();
    if (!hasPermission) {
      return { 
        success: false, 
        error: 'Storage permission denied. Please grant permission in app settings.' 
      };
    }

    const folderPath = customPath || CHITRA_FOLDER_NAME;
    
    try {
      await Filesystem.mkdir({
        path: folderPath,
        directory: directory,
        recursive: true,
      });
    } catch (e) {
      // Folder might already exist, that's fine
    }

    // Create marker file
    await Filesystem.writeFile({
      path: `${folderPath}/${CHITRA_MARKER_FILE}`,
      data: JSON.stringify({ 
        createdAt: new Date().toISOString(),
        version: '1.0.0' 
      }),
      directory: directory,
      encoding: Encoding.UTF8,
    });

    // Create subfolders
    const subfolders = ['exports', 'vaccinations', 'medicines', 'backups'];
    for (const subfolder of subfolders) {
      try {
        await Filesystem.mkdir({
          path: `${folderPath}/${subfolder}`,
          directory: directory,
          recursive: true,
        });
      } catch (e) {
        // Subfolder might already exist
      }
    }

    const directoryName = directory === Directory.Documents ? 'Documents' : 
                          directory === Directory.External ? 'External' : 
                          directory === Directory.Data ? 'Data' : 'Storage';
    const fullPath = `${directoryName}/${folderPath}`;
    await setStorageFolderPath(fullPath);

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error creating CHITRA folder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
    
    // Check for permission denied errors
    if (errorMessage.toLowerCase().includes('permission')) {
      return { 
        success: false, 
        error: 'Storage permission denied. Please grant permission in device settings.' 
      };
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

/**
 * Create CHITRA folder in Documents directory (default)
 */
export const createChitraFolder = async (): Promise<{ success: boolean; path?: string; error?: string }> => {
  return createChitraFolderInDirectory(Directory.Documents);
};

/**
 * Create CHITRA folder in External storage
 */
export const createChitraFolderExternal = async (): Promise<{ success: boolean; path?: string; error?: string }> => {
  return createChitraFolderInDirectory(Directory.External);
};

/**
 * Get available storage locations
 */
export const getAvailableStorageLocations = (): Array<{
  id: string;
  name: string;
  directory: Directory;
  description: string;
}> => {
  return [
    {
      id: 'documents',
      name: 'Documents',
      directory: Directory.Documents,
      description: 'Private app documents folder'
    },
    {
      id: 'external',
      name: 'External Storage',
      directory: Directory.External,
      description: 'Accessible via file manager'
    }
  ];
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
