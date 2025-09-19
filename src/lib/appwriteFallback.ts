import { Client, Storage, ID, Permission, Role } from 'appwrite';

// Fallback Appwrite configuration
const fallbackClient = new Client();

fallbackClient
  .setEndpoint(import.meta.env.VITE_APPWRITE_FALLBACK_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_FALLBACK_PROJECT_ID || '68ccc43b0039d53b4ccd');

const fallbackStorage = new Storage(fallbackClient);
const FALLBACK_BUCKET_ID = import.meta.env.VITE_APPWRITE_FALLBACK_STORAGE_BUCKET_ID || '68ccc46c001ef5e9ef03';

// Function to upload a video file to fallback Appwrite storage
export const uploadVideoToFallback = async (file: File): Promise<string> => {
  try {
    console.log('Uploading to fallback storage...');
    
    // Check file size before upload (Appwrite default limit is often 60MB)
    const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
    }
    
    const response = await fallbackStorage.createFile(
      FALLBACK_BUCKET_ID,
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
    return `${import.meta.env.VITE_APPWRITE_FALLBACK_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${FALLBACK_BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_FALLBACK_PROJECT_ID || '68ccc43b0039d53b4ccd'}`;
  } catch (error: any) {
    console.error('Error uploading video to fallback Appwrite storage:', error);
    
    // Provide more specific error message for file size issues
    if (error.message && error.message.includes('size')) {
      throw new Error(`File upload failed: ${error.message}. Please try a smaller file or contact administrator to increase storage limits.`);
    }
    
    throw error;
  }
};

// Function to delete a video file from fallback Appwrite storage
export const deleteVideoFromFallback = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file ID from the URL
    // URL format: https://fra.cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID
    const urlParts = fileUrl.split('/');
    const fileIdIndex = urlParts.indexOf('files') + 1;
    
    if (fileIdIndex > 0 && fileIdIndex < urlParts.length) {
      const fileId = urlParts[fileIdIndex];
      
      // Delete the file from fallback storage
      await fallbackStorage.deleteFile(FALLBACK_BUCKET_ID, fileId);
      console.log(`Successfully deleted file ${fileId} from fallback Appwrite storage`);
    } else {
      console.warn('Could not extract file ID from URL for deletion:', fileUrl);
    }
  } catch (error) {
    console.error('Error deleting video from fallback Appwrite storage:', error);
  }
};