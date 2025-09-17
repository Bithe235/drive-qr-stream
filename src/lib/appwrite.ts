import { Client, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';
import { QRCodeData } from './qrGenerator';
import { uploadFileToGCS, deleteFileFromGCS } from './gcsService';

// Appwrite configuration from environment variables
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68ca9f760003f35cf8ca';
const COLLECTION_ID = 'qrcode'; // Collection name
const BUCKET_ID = '68caacec001fd1ff6b9d'; // Storage bucket ID for videos

// Flag to determine if we should use Google Cloud Storage
const USE_GCS = import.meta.env.VITE_USE_GCS === 'true';

console.log('VITE_USE_GCS:', import.meta.env.VITE_USE_GCS);
console.log('USE_GCS:', USE_GCS);

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

// Function to upload a video file to storage (GCS if enabled, otherwise Appwrite)
export const uploadVideo = async (file: File): Promise<string> => {
  if (USE_GCS) {
    // Upload to Google Cloud Storage
    try {
      const url = await uploadFileToGCS(file);
      console.log('File uploaded to Google Cloud Storage:', url);
      return url;
    } catch (error) {
      console.error('Error uploading to GCS, falling back to Appwrite:', error);
      // Fallback to Appwrite storage
      return await uploadVideoToAppwrite(file);
    }
  } else {
    // Upload to Appwrite storage
    return await uploadVideoToAppwrite(file);
  }
};

// Function to upload a video file to Appwrite storage
export const uploadVideoToAppwrite = async (file: File): Promise<string> => {
  try {
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
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
  } catch (error) {
    console.error('Error uploading video to Appwrite:', error);
    throw error;
  }
};

// Function to delete a video file from storage
export const deleteVideoStorage = async (fileUrl: string): Promise<void> => {
  if (USE_GCS) {
    // Delete from Google Cloud Storage
    if (fileUrl.includes('storage.googleapis.com')) {
      try {
        // Extract file name from GCS URL
        const fileName = fileUrl.split('/').pop() || '';
        if (fileName) {
          await deleteFileFromGCS(fileName);
        }
      } catch (error) {
        console.error('Error deleting from GCS:', error);
        // Try to delete from Appwrite as fallback
        if (fileUrl.includes('appwrite.io/storage')) {
          await deleteVideoFromAppwriteStorage(fileUrl);
        }
      }
    } else if (fileUrl.includes('appwrite.io/storage')) {
      // Fallback to Appwrite storage deletion
      await deleteVideoFromAppwriteStorage(fileUrl);
    }
  } else {
    // Delete from Appwrite storage
    if (fileUrl.includes('appwrite.io/storage')) {
      await deleteVideoFromAppwriteStorage(fileUrl);
    }
  }
};

// Function to delete a video file from Appwrite storage
export const deleteVideoFromAppwriteStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file ID from the URL
    // URL format: https://fra.cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/download
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
  } catch (error) {
    console.error('Error deleting video from Appwrite storage:', error);
    // Don't throw error as we still want to delete the database entry
  }
};

// Function to save a QR code to Appwrite
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

// Function to get all QR codes from Appwrite
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

// Function to delete a QR code from Appwrite
export const deleteQRCodeFromAppwrite = async (id: string, fileUrl?: string): Promise<void> => {
  try {
    // If it's a video file, delete it from storage first
    if (fileUrl) {
      await deleteVideoStorage(fileUrl);
    }
    
    // Delete the document from the database
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