import { Client, Storage, Databases, ID, Permission, Role, Query } from 'appwrite';
import { QRCodeData } from './qrGenerator';
import { uploadVideoToFallback, deleteVideoFromFallback } from './appwriteFallback';

// Appwrite configuration
const client = new Client();

// Configure client with environment variables
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ccc43b0039d53b4ccd');

const databases = new Databases(client);
const storage = new Storage(client);

// Database and collection IDs (always use primary server for database)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68ca9f760003f35cf8ca';
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'qrcode';
const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '68ccc46c001ef5e9ef03';

// Function to check if primary storage is full
const isPrimaryStorageFull = async (): Promise<boolean> => {
  try {
    // Attempt to get bucket info to check usage
    // If this fails with a storage limit error, we know we're full
    await storage.listFiles(BUCKET_ID, []);
    return false;
  } catch (error: any) {
    // Check if error indicates storage is full
    if (error.message && (error.message.includes('limit') || error.message.includes('quota') || error.message.includes('storage'))) {
      console.log('Primary storage appears to be full, will use fallback storage');
      return true;
    }
    // For other errors, we assume storage is not full
    console.log('Error checking storage status, assuming not full:', error.message);
    return false;
  }
};

// Function to initialize the database (if needed)
export const initDatabase = async () => {
  try {
    // This would be used to create the database and collection if they don't exist
    // For now, we assume they're already created in your Appwrite project
    console.log('Appwrite database initialized');
  } catch (error) {
    console.error('Error initializing Appwrite database:', error);
  }
};

// Function to upload a video file to Appwrite storage with fallback
export const uploadVideo = async (file: File): Promise<string> => {
  try {
    // Check if primary storage is full
    const primaryFull = await isPrimaryStorageFull();
    
    if (primaryFull) {
      // Use fallback storage
      console.log('Using fallback storage for upload');
      return await uploadVideoToFallback(file);
    }
    
    // Try primary storage first
    console.log('Using primary storage for upload');
    
    // Check file size before upload (Appwrite default limit is often 30MB)
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 30MB. Please compress the video or contact administrator to increase limit.`);
    }
    
    const response = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file,
      // Add permissions to make the file publicly readable
      [
        Permission.read(Role.any())
      ]
    );
    
    // Return the file URL - using the view URL for direct playback
    // This is more appropriate for embedding in video elements
    // Also add project parameter for proper authentication
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ccc43b0039d53b4ccd'}`;
  } catch (error: any) {
    console.error('Error uploading video to primary Appwrite storage:', error);
    
    // If it's a storage limit error, try fallback storage
    if (error.message && (error.message.includes('limit') || error.message.includes('quota') || error.message.includes('storage'))) {
      console.log('Primary storage limit reached, attempting fallback storage');
      try {
        return await uploadVideoToFallback(file);
      } catch (fallbackError) {
        console.error('Error uploading to fallback storage:', fallbackError);
        throw fallbackError;
      }
    }
    
    // Provide more specific error message for file size issues
    if (error.message && error.message.includes('size')) {
      throw new Error(`File upload failed: ${error.message}. Please try a smaller file or contact administrator to increase storage limits.`);
    }
    
    throw error;
  }
};

// Function to upload a video file to Appwrite storage with progress tracking and fallback
export const uploadVideoWithProgress = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
  try {
    // Check if primary storage is full
    const primaryFull = await isPrimaryStorageFull();
    
    if (primaryFull) {
      // Use fallback storage
      console.log('Using fallback storage for upload with progress');
      // Note: fallback storage doesn't currently support progress tracking in this implementation
      onProgress(10); // Start progress
      setTimeout(() => onProgress(50), 100); // Simulate progress
      setTimeout(() => onProgress(90), 200); // Simulate progress
      const result = await uploadVideoToFallback(file);
      onProgress(100); // Complete progress
      return result;
    }
    
    // Try primary storage first
    console.log('Using primary storage for upload with progress');
    
    // Check file size before upload (Appwrite default limit is often 30MB)
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 30MB. Please compress the video or contact administrator to increase limit.`);
    }
    
    // Create a custom upload function with progress tracking
    // Note: Appwrite SDK doesn't directly support progress tracking, so we'll simulate it
    console.log('Starting upload with progress tracking');
    onProgress(10); // Start progress
    
    // Simulate progress during upload
    let progress = 10;
    const progressInterval = setInterval(() => {
      // This is a simplified simulation - in a real implementation, we would track actual upload progress
      progress = Math.min(progress + 5, 90);
      onProgress(progress);
    }, 300);
    
    const response = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file,
      // Add permissions to make the file publicly readable
      [
        Permission.read(Role.any())
      ]
    );
    
    clearInterval(progressInterval);
    onProgress(100); // Complete progress
    
    // Return the file URL - using the view URL for direct playback
    // This is more appropriate for embedding in video elements
    // Also add project parameter for proper authentication
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ccc43b0039d53b4ccd'}`;
  } catch (error: any) {
    console.error('Error uploading video to primary Appwrite storage:', error);
    
    // If it's a storage limit error, try fallback storage
    if (error.message && (error.message.includes('limit') || error.message.includes('quota') || error.message.includes('storage'))) {
      console.log('Primary storage limit reached, attempting fallback storage with progress');
      try {
        onProgress(10); // Start progress
        setTimeout(() => onProgress(50), 100); // Simulate progress
        setTimeout(() => onProgress(90), 200); // Simulate progress
        const result = await uploadVideoToFallback(file);
        onProgress(100); // Complete progress
        return result;
      } catch (fallbackError) {
        console.error('Error uploading to fallback storage:', fallbackError);
        throw fallbackError;
      }
    }
    
    // Provide more specific error message for file size issues
    if (error.message && error.message.includes('size')) {
      throw new Error(`File upload failed: ${error.message}. Please try a smaller file or contact administrator to increase storage limits.`);
    }
    
    throw error;
  }
};

// Function to delete a video file from Appwrite storage (handles both primary and fallback)
export const deleteVideoStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Determine if this is a fallback storage URL or primary storage URL
    const isFallbackUrl = fileUrl.includes(import.meta.env.VITE_APPWRITE_FALLBACK_PROJECT_ID || '68ca9e8e000ddba95beb');
    
    if (isFallbackUrl) {
      // Delete from fallback storage
      console.log('Deleting from fallback storage');
      await deleteVideoFromFallback(fileUrl);
    } else {
      // Delete from primary storage
      console.log('Deleting from primary storage');
      
      // Extract file ID from the URL
      // URL format: https://fra.cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID
      const urlParts = fileUrl.split('/');
      const fileIdIndex = urlParts.indexOf('files') + 1;
      
      if (fileIdIndex > 0 && fileIdIndex < urlParts.length) {
        const fileId = urlParts[fileIdIndex];
        
        // Delete the file from storage
        await storage.deleteFile(BUCKET_ID, fileId);
        console.log(`Successfully deleted file ${fileId} from Appwrite storage`);
      } else {
        console.warn('Could not extract file ID from URL for deletion:', fileUrl);
      }
    }
  } catch (error) {
    console.error('Error deleting video from Appwrite storage:', error);
    // Don't throw error as we still want to delete the database entry
  }
};

// Function to save a QR code to Appwrite (always use primary server for database)
export const saveQRCodeToAppwrite = async (qrData: QRCodeData): Promise<QRCodeData> => {
  try {
    // Create a minimal data object with only the most essential fields
    // We'll try different combinations if some attributes aren't available in the collection
    const dataToSave: any = {
      title: qrData.title,
      url: qrData.url,
      qrCodeDataUrl: qrData.qrCodeDataUrl,
      createdAt: qrData.createdAt
    };
    
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
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
        
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
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
};

// Function to get all QR codes from Appwrite (always use primary server for database)
export const getQRCodesFromAppwrite = async (): Promise<QRCodeData[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
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
};

// Function to delete a QR code from Appwrite (always use primary server for database)
export const deleteQRCodeFromAppwrite = async (id: string, fileUrl?: string): Promise<void> => {
  try {
    // If it's a video file, delete it from storage first
    if (fileUrl) {
      await deleteVideoStorage(fileUrl);
    }
    
    // Delete the document from the database (always use primary)
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      id
    );
    
    console.log(`Successfully deleted QR code ${id} from Appwrite database`);
  } catch (error) {
    console.error('Error deleting QR code from Appwrite:', error);
    throw error;
  }
};