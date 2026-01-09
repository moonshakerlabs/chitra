import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const CHITRA_FOLDER_NAME = 'CHITRA';

export interface CaptureResult {
  success: boolean;
  path?: string;
  webPath?: string;
  format?: string;
  error?: string;
}

/**
 * Check if camera is available
 */
export const isCameraAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Capture a photo using the device camera
 */
export const capturePhoto = async (
  subfolder: string,
  fileName: string
): Promise<CaptureResult> => {
  try {
    if (!isCameraAvailable()) {
      return { success: false, error: 'Camera not available on web' };
    }

    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      saveToGallery: false,
    });

    if (!photo.base64String) {
      return { success: false, error: 'No image data captured' };
    }

    // Determine file extension
    const format = photo.format || 'jpeg';
    const fullFileName = `${fileName}.${format}`;
    const relativePath = `${subfolder}/${fullFileName}`;

    // Save to CHITRA folder
    const result = await saveImageToChitra(relativePath, photo.base64String);
    
    if (result.success) {
      return {
        success: true,
        path: result.path,
        webPath: photo.webPath,
        format,
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error capturing photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture photo',
    };
  }
};

/**
 * Pick an image from the gallery
 */
export const pickImage = async (
  subfolder: string,
  fileName: string
): Promise<CaptureResult> => {
  try {
    if (!isCameraAvailable()) {
      return { success: false, error: 'Gallery not available on web' };
    }

    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    if (!photo.base64String) {
      return { success: false, error: 'No image selected' };
    }

    const format = photo.format || 'jpeg';
    const fullFileName = `${fileName}.${format}`;
    const relativePath = `${subfolder}/${fullFileName}`;

    const result = await saveImageToChitra(relativePath, photo.base64String);
    
    if (result.success) {
      return {
        success: true,
        path: result.path,
        webPath: photo.webPath,
        format,
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error picking image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pick image',
    };
  }
};

/**
 * Pick a file (for PDF support on native)
 */
export const pickFile = async (
  subfolder: string,
  fileName: string,
  acceptTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']
): Promise<CaptureResult> => {
  try {
    // For web, use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes.join(',');
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        // Read file as base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const ext = file.name.split('.').pop() || 'file';
          const fullFileName = `${fileName}.${ext}`;
          const relativePath = `${subfolder}/${fullFileName}`;

          if (Capacitor.isNativePlatform()) {
            const result = await saveFileToChitra(relativePath, base64, ext === 'pdf');
            resolve(result.success 
              ? { success: true, path: result.path, format: ext }
              : { success: false, error: result.error }
            );
          } else {
            // For web, just return a virtual path
            resolve({
              success: true,
              path: relativePath,
              format: ext,
            });
          }
        };
        
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to read file' });
        };
        
        reader.readAsDataURL(file);
      };
      
      input.click();
    });
  } catch (error) {
    console.error('Error picking file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pick file',
    };
  }
};

/**
 * Save image to CHITRA folder
 */
const saveImageToChitra = async (
  relativePath: string,
  base64Data: string
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;

    await Filesystem.writeFile({
      path: fullPath,
      data: base64Data,
      directory: Directory.Documents,
    });

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error saving image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save image',
    };
  }
};

/**
 * Save file to CHITRA folder
 */
const saveFileToChitra = async (
  relativePath: string,
  base64Data: string,
  isPdf: boolean = false
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;

    await Filesystem.writeFile({
      path: fullPath,
      data: base64Data,
      directory: Directory.Documents,
    });

    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file',
    };
  }
};

/**
 * Delete a file from CHITRA folder
 */
export const deleteFileFromChitra = async (relativePath: string): Promise<boolean> => {
  try {
    if (!Capacitor.isNativePlatform()) return true;

    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;
    await Filesystem.deleteFile({
      path: fullPath,
      directory: Directory.Documents,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Read file from CHITRA folder as base64
 */
export const readFileFromChitra = async (
  relativePath: string
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Not available on web' };
    }

    const fullPath = `${CHITRA_FOLDER_NAME}/${relativePath}`;
    const result = await Filesystem.readFile({
      path: fullPath,
      directory: Directory.Documents,
    });

    return { success: true, data: result.data as string };
  } catch (error) {
    console.error('Error reading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File not found',
    };
  }
};
