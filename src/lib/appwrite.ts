import { Client, Storage, Databases, ID, Permission, Role, Query, AppwriteException } from 'appwrite';
import { QRCodeData } from './qrGenerator';

// Primary Appwrite configuration - using environment variables
const PRIMARY_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'http://34.23.98.230/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '68cb051f0013a0d8aa89',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '68cb06140031a586fe2b',
  collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID || '68cb061c00209aeffa1d',
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || '68cb057c002ca64682a2'
};

// Fallback Appwrite configuration - using environment variables
const FALLBACK_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_FALLBACK_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_FALLBACK_PROJECT_ID || '68ca9e8e000ddba95beb',
  databaseId: import.meta.env.VITE_APPWRITE_FALLBACK_DATABASE_ID || '68ca9f760003f35cf8ca',
  collectionId: import.meta.env.VITE_APPWRITE_FALLBACK_COLLECTION_ID || 'qrcode',
  bucketId: import.meta.env.VITE_APPWRITE_FALLBACK_BUCKET_ID || '68caacec001fd1ff6b9d'
};

// Create clients for both configurations
const primaryClient = new Client();
primaryClient
  .setEndpoint(PRIMARY_CONFIG.endpoint)
  .setProject(PRIMARY_CONFIG.projectId);

const fallbackClient = new Client();
fallbackClient
  .setEndpoint(FALLBACK_CONFIG.endpoint)
  .setProject(FALLBACK_CONFIG.projectId);

// Create service instances for both clients
const primaryStorage = new Storage(primaryClient);
const primaryDatabases = new Databases(primaryClient);

const fallbackStorage = new Storage(fallbackClient);
const fallbackDatabases = new Databases(fallbackClient);

// Current active configuration
let currentConfig = PRIMARY_CONFIG;
let currentStorage = primaryStorage;
let currentDatabases = primaryDatabases;

// Function to switch to fallback configuration
const switchToFallback = () => {
  console.log('Switching to fallback Appwrite server');
  currentConfig = FALLBACK_CONFIG;
  currentStorage = fallbackStorage;
  currentDatabases = fallbackDatabases;
};

// Function to test if a server is working
const testServer = async (storage: Storage): Promise<boolean> => {
  try {
    // Simple health check - try to list files with a limit of "1"
    // This will confirm if the server is reachable and authentication works
    await storage.listFiles(PRIMARY_CONFIG.bucketId, [], "1");
    return true;
  } catch (error: any) {
    // If it's a 404 for the bucket or empty list, the server is working
    if (error.code === 404 || error.message?.includes('limit')) {
      return true;
    }
    // If it's a network error or other connection issue, the server is not working
    console.log('Server test failed:', error.message);
    return false;
  }
};

// Function to try an operation with fallback
const tryWithFallback = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    // Try with current configuration
    return await operation();
  } catch (error: any) {
    console.log('Operation failed with current server, error:', error.message);
    
    // If it's a network error, try switching to fallback
    if (error instanceof AppwriteException && 
        (error.type === 'network_error' || error.code === 0 || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError'))) {
      console.log('Network error detected, switching to fallback server');
      switchToFallback();
      
      // Retry the operation with fallback configuration
      try {
        return await operation();
      } catch (fallbackError) {
        console.error('Operation failed even with fallback server:', fallbackError);
        throw fallbackError;
      }
    }
    
    // If it's not a network error, re-throw the original error
    throw error;
  }
};

// Collection and database IDs (using current configuration)
const getDatabaseId = () => currentConfig.databaseId;
const getCollectionId = () => currentConfig.collectionId;
const getBucketId = () => currentConfig.bucketId;

// Function to compress video using browser capabilities (simplified)
export const compressVideo = async (file: File, onProgress?: (progress: number) => void): Promise<File> => {
  return new Promise((resolve, reject) => {
    // For demonstration purposes, we'll simulate compression with a delay
    // In a real implementation, you would use a library like ffmpeg.js or browser-based compression
    
    // Simulate compression progress
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5; // Random progress between 5-20%
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Return a file with "compressed" in the name to indicate it was processed
          const compressedFile = new File([file], `compressed_${file.name}`, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }
        onProgress(progress);
      }, 200);
    } else {
      // If no progress callback, resolve immediately with a "compressed" file
      const compressedFile = new File([file], `compressed_${file.name}`, {
        type: file.type,
        lastModified: Date.now()
      });
      resolve(compressedFile);
    }
  });
};

// Function to upload a video file to Appwrite storage with progress tracking
export const uploadVideo = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  return tryWithFallback(async () => {
    try {
      // Check file size before upload (Appwrite default limit is often 30MB)
      const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 30MB. Please compress the video or contact administrator to increase limit.`);
      }
      
      // Create file with progress tracking
      const response = await currentStorage.createFile(
        getBucketId(),
        ID.unique(),
        file,
        // Add permissions to make the file publicly readable
        [
          Permission.read(Role.any())
        ],
        onProgress ? (progress: any) => {
          // Progress is an object with chunksTotal and chunksUploaded
          if (progress.chunksTotal > 0) {
            const percentage = Math.round((progress.chunksUploaded / progress.chunksTotal) * 100);
            onProgress(percentage);
          }
        } : undefined
      );
      
      // Return the file URL - using the view URL for direct playback
      // This is more appropriate for embedding in video elements
      // Also add project parameter for proper authentication
      return `${currentConfig.endpoint}/storage/buckets/${getBucketId()}/files/${response.$id}/view?project=${currentConfig.projectId}`;
    } catch (error: any) {
      console.error('Error uploading video to Appwrite:', error);
      
      // Provide more specific error message for file size issues
      if (error.message && error.message.includes('size')) {
        throw new Error(`File upload failed: ${error.message}. Please try a smaller file or contact administrator to increase storage limits.`);
      }
      
      throw error;
    }
  });
};

// Function to delete a video file from Appwrite storage
export const deleteVideoStorage = async (fileUrl: string): Promise<void> => {
  return tryWithFallback(async () => {
    try {
      // Extract file ID from the URL
      // URL format: https://fra.cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/download
      const urlParts = fileUrl.split('/');
      const fileIdIndex = urlParts.indexOf('files') + 1;
      
      if (fileIdIndex > 0 && fileIdIndex < urlParts.length) {
        const fileId = urlParts[fileIdIndex];
        
        // Delete the file from storage
        await currentStorage.deleteFile(getBucketId(), fileId);
        console.log(`Successfully deleted file ${fileId} from Appwrite storage`);
      } else {
        console.warn('Could not extract file ID from URL for deletion:', fileUrl);
      }
    } catch (error) {
      console.error('Error deleting video from Appwrite storage:', error);
      // Don't throw error as we still want to delete the database entry
    }
  });
};

// Function to save a QR code to Appwrite
export const saveQRCodeToAppwrite = async (qrData: QRCodeData): Promise<QRCodeData> => {
  return tryWithFallback(async () => {
    try {
      // Create a minimal data object with only the most essential fields
      // We'll try different combinations if some attributes aren't available in the collection
      const dataToSave: any = {
        title: qrData.title,
        url: qrData.url,
        qrCodeDataUrl: qrData.qrCodeDataUrl,
        createdAt: qrData.createdAt
      };
      
      const response = await currentDatabases.createDocument(
        getDatabaseId(),
        getCollectionId(),
        ID.unique(),
        dataToSave,
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      
      // Return the data with Appwrite's document ID
      return {
        id: response.$id,
        title: response.title,
        url: response.url,
        qrCodeDataUrl: response.qrCodeDataUrl,
        createdAt: response.createdAt
      } as QRCodeData;
    } catch (error: any) {
      console.error('Error saving QR code to Appwrite:', error);
      // If we get a specific attribute error, try with fewer attributes
      if (error.message && error.message.includes('Unknown attribute')) {
        try {
          // Try with just the most basic attributes
          const minimalData: any = {
            title: qrData.title,
            url: qrData.url
          };
          
          const response = await currentDatabases.createDocument(
            getDatabaseId(),
            getCollectionId(),
            ID.unique(),
            minimalData,
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any())
            ]
          );
          
          // Return the data with Appwrite's document ID
          return {
            id: response.$id,
            title: response.title,
            url: response.url,
            qrCodeDataUrl: qrData.qrCodeDataUrl || '',
            createdAt: qrData.createdAt || new Date().toISOString()
          } as QRCodeData;
        } catch (minimalError) {
          console.error('Error with minimal data:', minimalError);
          throw error; // Throw the original error if minimal approach also fails
        }
      }
      throw error;
    }
  });
};

// Function to get all QR codes from Appwrite
export const getQRCodesFromAppwrite = async (): Promise<QRCodeData[]> => {
  return tryWithFallback(async () => {
    try {
      const response = await currentDatabases.listDocuments(
        getDatabaseId(),
        getCollectionId(),
        [Query.orderDesc('$createdAt')]
      );
      
      // Map Appwrite documents to QRCodeData format
      return response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title || 'Untitled',
        url: doc.url || '',
        qrCodeDataUrl: doc.qrCodeDataUrl || '',
        createdAt: doc.createdAt || new Date().toISOString()
      })) as QRCodeData[];
    } catch (error) {
      console.error('Error fetching QR codes from Appwrite:', error);
      return [];
    }
  });
};

// Function to delete a QR code from Appwrite
export const deleteQRCodeFromAppwrite = async (id: string, fileUrl?: string): Promise<void> => {
  return tryWithFallback(async () => {
    try {
      // If it's a video file, delete it from storage first
      if (fileUrl) {
        await deleteVideoStorage(fileUrl);
      }
      
      // Delete the document from the database
      await currentDatabases.deleteDocument(
        getDatabaseId(),
        getCollectionId(),
        id
      );
      
      console.log(`Successfully deleted QR code ${id} from Appwrite database`);
    } catch (error) {
      console.error('Error deleting QR code from Appwrite:', error);
      throw error;
    }
  });
};

// Initialize and test server connectivity
const initializeAppwrite = async () => {
  console.log('Testing primary Appwrite server connectivity...');
  const isPrimaryWorking = await testServer(primaryStorage);
  
  if (!isPrimaryWorking) {
    console.log('Primary server not responding, switching to fallback server');
    switchToFallback();
  } else {
    console.log('Primary server is working correctly');
  }
};

// Run initialization
initializeAppwrite().catch(error => {
  console.error('Error during Appwrite initialization:', error);
});
