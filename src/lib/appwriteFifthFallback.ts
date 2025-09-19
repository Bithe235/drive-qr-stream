import { Client, Storage, ID, Permission, Role } from 'appwrite';

// Fifth Fallback Appwrite configuration
const fifthFallbackClient = new Client();

fifthFallbackClient
  .setEndpoint(import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_PROJECT_ID || '68ccd6070013df26676b');

const fifthFallbackStorage = new Storage(fifthFallbackClient);
const FIFTH_FALLBACK_BUCKET_ID = import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_STORAGE_BUCKET_ID || '68ccd693002c60d147e9';

// Function to upload a video file to fifth fallback Appwrite storage
export const uploadVideoToFifthFallback = async (file: File): Promise<string> => {
  try {
    console.log('Uploading to fifth fallback storage...');
    
    // Check file size before upload (Appwrite default limit is often 60MB)
    const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
    }
    
    const response = await fifthFallbackStorage.createFile(
      FIFTH_FALLBACK_BUCKET_ID,
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
    return `${import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${FIFTH_FALLBACK_BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_PROJECT_ID || '68ccd6070013df26676b'}`;
  } catch (error: any) {
    console.error('Error uploading video to fifth fallback Appwrite storage:', error);
    
    // Provide more specific error message for file size issues
    if (error.message && error.message.includes('size')) {
      throw new Error(`File upload failed: ${error.message}. Please try a smaller file or contact administrator to increase storage limits.`);
    }
    
    throw error;
  }
};

// Function to delete a video file from fifth fallback Appwrite storage
export const deleteVideoFromFifthFallback = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file ID from the URL
    // URL format: https://fra.cloud.appwrite.io/v1/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID
    const urlParts = fileUrl.split('/');
    const fileIdIndex = urlParts.indexOf('files') + 1;
    
    if (fileIdIndex > 0 && fileIdIndex < urlParts.length) {
      const fileId = urlParts[fileIdIndex];
      
      // Delete the file from fifth fallback storage
      await fifthFallbackStorage.deleteFile(FIFTH_FALLBACK_BUCKET_ID, fileId);
      console.log(`Successfully deleted file ${fileId} from fifth fallback Appwrite storage`);
    } else {
      console.warn('Could not extract file ID from URL for deletion:', fileUrl);
    }
  } catch (error) {
    console.error('Error deleting video from fifth fallback Appwrite storage:', error);
  }
};