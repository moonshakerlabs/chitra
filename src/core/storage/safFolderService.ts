import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { getPreferences, savePreferences } from './preferences';

const CHITRA_FOLDER_NAME = 'CHITRA';
const CHITRA_MARKER_FILE = '.chitra_folder';

export interface StorageLocation {
  id: string;
  name: string;
  directory: Directory;
  description: string;
  icon: string;
}

export interface FolderSelectionResult {
  success: boolean;
  path?: string;
  directory?: Directory;
  error?: string;
  permissionDenied?: boolean;
}

/**
 * Check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get available storage locations for SAF-style selection
 */
export const getAvailableStorageLocations = (): StorageLocation[] => {
  if (!isNativePlatform()) {
    return [
      {
        id: 'browser',
        name: 'Downloads',
        directory: Directory.Documents,
        description: 'Files will be downloaded to your browser',
        icon: '📥'
      }
    ];
  }

  return [
    {
      id: 'documents',
      name: 'Documents',
      directory: Directory.Documents,
      description: 'App private documents folder',
      icon: '📁'
    },
    {
      id: 'external',
      name: 'External Storage',
      directory: Directory.External,
      description: 'Accessible via file manager',
      icon: '💾'
    },
    {
      id: 'external_storage',
      name: 'SD Card / Shared Storage',
      directory: Directory.ExternalStorage,
      description: 'Publicly accessible storage',
      icon: '📂'
    }
  ];
};

/**
 * Request filesystem permissions with proper error handling
 */
export const requestStoragePermissions = async (): Promise<{
  granted: boolean;
  error?: string;
}> => {
  if (!isNativePlatform()) {
    return { granted: true };
  }

  try {
    const currentStatus = await Filesystem.checkPermissions();
    
    if (currentStatus.publicStorage === 'granted') {
      return { granted: true };
    }

    const result = await Filesystem.requestPermissions();
    
    if (result.publicStorage === 'granted') {
      return { granted: true };
    } else if (result.publicStorage === 'denied') {
      return { 
        granted: false, 
        error: 'Storage permission denied. Please enable it in device Settings > Apps > CHITRA > Permissions.' 
      };
    } else {
      return { 
        granted: false, 
        error: 'Storage permission not granted. Please try again.' 
      };
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return { 
      granted: false, 
      error: error instanceof Error ? error.message : 'Failed to request permissions' 
    };
  }
};

/**
 * Create CHITRA folder in selected location
 */
export const createChitraFolderInLocation = async (
  location: StorageLocation,
  customSubfolder?: string
): Promise<FolderSelectionResult> => {
  try {
    if (!isNativePlatform()) {
      const virtualPath = '/CHITRA';
      await savePreferences({ 
        storageFolderPath: virtualPath,
        storageFolderAcknowledged: true 
      });
      return { success: true, path: virtualPath, directory: Directory.Documents };
    }

    // Request permissions first
    const permResult = await requestStoragePermissions();
    if (!permResult.granted) {
      return { 
        success: false, 
        error: permResult.error,
        permissionDenied: true
      };
    }

    const folderPath = customSubfolder 
      ? `${CHITRA_FOLDER_NAME}/${customSubfolder}` 
      : CHITRA_FOLDER_NAME;

    // Create main folder
    try {
      await Filesystem.mkdir({
        path: folderPath,
        directory: location.directory,
        recursive: true,
      });
    } catch (e) {
      // Folder might already exist
      console.log('Folder may already exist:', e);
    }

    // Create marker file
    try {
      await Filesystem.writeFile({
        path: `${folderPath}/${CHITRA_MARKER_FILE}`,
        data: JSON.stringify({ 
          createdAt: new Date().toISOString(),
          version: '1.0.0',
          location: location.id
        }),
        directory: location.directory,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      console.log('Marker file may already exist:', e);
    }

    // Create subfolders
    const subfolders = ['exports', 'vaccinations', 'medicines', 'backups', 'imports'];
    for (const subfolder of subfolders) {
      try {
        await Filesystem.mkdir({
          path: `${folderPath}/${subfolder}`,
          directory: location.directory,
          recursive: true,
        });
      } catch (e) {
        // Subfolder might already exist
      }
    }

    const fullPath = `${location.name}/${folderPath}`;
    
    await savePreferences({ 
      storageFolderPath: fullPath,
      storageFolderAcknowledged: true 
    });

    return { 
      success: true, 
      path: fullPath,
      directory: location.directory
    };
  } catch (error) {
    console.error('Error creating CHITRA folder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
    
    // Check for permission denied errors
    const isPermissionError = errorMessage.toLowerCase().includes('permission') ||
                              errorMessage.toLowerCase().includes('denied') ||
                              errorMessage.toLowerCase().includes('access');
    
    return { 
      success: false, 
      error: isPermissionError 
        ? 'Storage permission denied. Please enable it in device Settings.'
        : errorMessage,
      permissionDenied: isPermissionError
    };
  }
};

/**
 * Get the currently configured storage folder
 */
export const getConfiguredStorageFolder = async (): Promise<{
  configured: boolean;
  path?: string;
}> => {
  const prefs = await getPreferences();
  if (prefs.storageFolderPath && prefs.storageFolderAcknowledged) {
    return { configured: true, path: prefs.storageFolderPath };
  }
  return { configured: false };
};

/**
 * Validate if the configured folder is still accessible
 */
export const validateConfiguredFolder = async (): Promise<{
  valid: boolean;
  error?: string;
}> => {
  if (!isNativePlatform()) {
    return { valid: true };
  }

  try {
    const prefs = await getPreferences();
    if (!prefs.storageFolderPath) {
      return { valid: false, error: 'No folder configured' };
    }

    // Determine which directory to check
    const isExternal = prefs.storageFolderPath.includes('External');
    const directory = isExternal ? Directory.External : Directory.Documents;

    // Try to read the marker file
    await Filesystem.readFile({
      path: `${CHITRA_FOLDER_NAME}/${CHITRA_MARKER_FILE}`,
      directory: directory,
      encoding: Encoding.UTF8,
    });

    return { valid: true };
  } catch (error) {
    console.error('Error validating folder:', error);
    return { 
      valid: false, 
      error: 'Folder is not accessible. Please reselect the CHITRA folder location.' 
    };
  }
};

/**
 * Update folder location without losing data
 */
export const updateFolderLocation = async (
  newLocation: StorageLocation
): Promise<FolderSelectionResult> => {
  // Simply create the folder in the new location
  // Data is stored in IndexedDB, not in the folder
  // The folder is only for exports/imports
  return createChitraFolderInLocation(newLocation);
};

/**
 * Clear folder configuration (for changing location)
 */
export const clearFolderConfiguration = async (): Promise<void> => {
  await savePreferences({ 
    storageFolderPath: undefined,
    storageFolderAcknowledged: false 
  });
};

/**
 * Save file to CHITRA folder
 */
export const saveFileToChitra = async (
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

    const prefs = await getPreferences();
    const isExternal = prefs.storageFolderPath?.includes('External');
    const directory = isExternal ? Directory.External : Directory.Documents;
    
    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;
    
    const result = await Filesystem.writeFile({
      path: fullPath,
      data: content,
      directory: directory,
      encoding: encoding === 'utf8' ? Encoding.UTF8 : undefined,
      recursive: true,
    });

    return { success: true, uri: result.uri };
  } catch (error) {
    console.error('Error saving file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save file' 
    };
  }
};

/**
 * Read file from CHITRA folder
 */
export const readFileFromChitra = async (
  relativePath: string
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      return { success: false, error: 'Not available in browser' };
    }

    const prefs = await getPreferences();
    const isExternal = prefs.storageFolderPath?.includes('External');
    const directory = isExternal ? Directory.External : Directory.Documents;
    
    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;
    
    const result = await Filesystem.readFile({
      path: fullPath,
      directory: directory,
      encoding: Encoding.UTF8,
    });

    return { success: true, data: result.data as string };
  } catch (error) {
    console.error('Error reading file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'File not found' 
    };
  }
};

/**
 * List files in CHITRA folder
 */
export const listFilesInChitra = async (
  subfolder: string = ''
): Promise<{ success: boolean; files?: string[]; error?: string }> => {
  try {
    if (!isNativePlatform()) {
      return { success: false, error: 'Not available in browser' };
    }

    const prefs = await getPreferences();
    const isExternal = prefs.storageFolderPath?.includes('External');
    const directory = isExternal ? Directory.External : Directory.Documents;
    
    const path = subfolder 
      ? `${CHITRA_FOLDER_NAME}/${subfolder}` 
      : CHITRA_FOLDER_NAME;
    
    const result = await Filesystem.readdir({
      path: path,
      directory: directory,
    });

    return { 
      success: true, 
      files: result.files.map(f => f.name)
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list files' 
    };
  }
};
