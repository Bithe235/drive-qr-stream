import { Client, Storage, Databases, ID, Permission, Role, Query } from 'appwrite';
import { QRCodeData } from './qrGenerator';
import { uploadVideoToFallback, deleteVideoFromFallback } from './appwriteFallback';
import { uploadVideoToSecondFallback, deleteVideoFromSecondFallback } from './appwriteSecondFallback';
import { uploadVideoToThirdFallback, deleteVideoFromThirdFallback } from './appwriteThirdFallback';
import { uploadVideoToFourthFallback, deleteVideoFromFourthFallback } from './appwriteFourthFallback';
import { uploadVideoToFifthFallback, deleteVideoFromFifthFallback } from './appwriteFifthFallback';
import { uploadVideoToSixthFallback, deleteVideoFromSixthFallback } from './appwriteSixthFallback';

// Define storage server options
export type StorageServer = 'primary' | 'fallback1' | 'fallback2' | 'fallback3' | 'fallback4' | 'fallback5' | 'fallback6';

// Appwrite configuration
const client = new Client();

// Configure client with environment variables
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb');

const databases = new Databases(client);
const storage = new Storage(client);

// Database and collection IDs (always use primary server for database)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68ca9f760003f35cf8ca';
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'qrcode';
const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '68caacec001fd1ff6b9d';

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

// Function to check if first fallback storage is full
const isFirstFallbackStorageFull = async (): Promise<boolean> => {
  // This is a simplified check - in a real implementation, you might want to 
  // actually test the fallback storage as well
  // For now, we'll just return false to indicate it's available
  return false;
};

// Function to check if second fallback storage is full
const isSecondFallbackStorageFull = async (): Promise<boolean> => {
  // This is a simplified check - in a real implementation, you might want to 
  // actually test the fallback storage as well
  // For now, we'll just return false to indicate it's available
  return false;
};

// Function to check if third fallback storage is full
const isThirdFallbackStorageFull = async (): Promise<boolean> => {
  // This is a simplified check - in a real implementation, you might want to 
  // actually test the fallback storage as well
  // For now, we'll just return false to indicate it's available
  return false;
};

// Function to check if fourth fallback storage is full
const isFourthFallbackStorageFull = async (): Promise<boolean> => {
  // This is a simplified check - in a real implementation, you might want to 
  // actually test the fallback storage as well
  // For now, we'll just return false to indicate it's available
  return false;
};

// Function to check if fifth fallback storage is full
const isFifthFallbackStorageFull = async (): Promise<boolean> => {
  // This is a simplified check - in a real implementation, you might want to 
  // actually test the fallback storage as well
  // For now, we'll just return false to indicate it's available
  return false;
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

// Function to upload a video file to Appwrite storage with multi-level fallback
export const uploadVideo = async (file: File, storageServer?: StorageServer): Promise<string> => {
  try {
    // If a specific storage server is selected for testing, use that server directly
    if (storageServer) {
      switch (storageServer) {
        case 'fallback1':
          console.log('Using first fallback storage for upload (testing mode)');
          return await uploadVideoToFallback(file);
        case 'fallback2':
          console.log('Using second fallback storage for upload (testing mode)');
          return await uploadVideoToSecondFallback(file);
        case 'fallback3':
          console.log('Using third fallback storage for upload (testing mode)');
          return await uploadVideoToThirdFallback(file);
        case 'fallback4':
          console.log('Using fourth fallback storage for upload (testing mode)');
          return await uploadVideoToFourthFallback(file);
        case 'fallback5':
          console.log('Using fifth fallback storage for upload (testing mode)');
          return await uploadVideoToFifthFallback(file);
        case 'fallback6':
          console.log('Using sixth fallback storage for upload (testing mode)');
          return await uploadVideoToSixthFallback(file);
        case 'primary':
        default:
          console.log('Using primary storage for upload (testing mode)');
          // Check file size before upload (Appwrite default limit is often 60MB)
          const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
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
          return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb'}`;
      }
    }
    
    // Normal fallback behavior when no specific server is selected
    // Check if primary storage is full
    const primaryFull = await isPrimaryStorageFull();
    
    if (primaryFull) {
      // Check if first fallback storage is also full
      const firstFallbackFull = await isFirstFallbackStorageFull();
      
      if (firstFallbackFull) {
        // Check if second fallback storage is also full
        const secondFallbackFull = await isSecondFallbackStorageFull();
        
        if (secondFallbackFull) {
          // Check if third fallback storage is also full
          const thirdFallbackFull = await isThirdFallbackStorageFull();
          
          if (thirdFallbackFull) {
            // Check if fourth fallback storage is also full
            const fourthFallbackFull = await isFourthFallbackStorageFull();
            
            if (fourthFallbackFull) {
              // Check if fifth fallback storage is also full
              const fifthFallbackFull = await isFifthFallbackStorageFull();
              
              if (fifthFallbackFull) {
                // Use sixth fallback storage
                console.log('Using sixth fallback storage for upload');
                return await uploadVideoToSixthFallback(file);
              }
              
              // Use fifth fallback storage
              console.log('Using fifth fallback storage for upload');
              return await uploadVideoToFifthFallback(file);
            }
            
            // Use fourth fallback storage
            console.log('Using fourth fallback storage for upload');
            return await uploadVideoToFourthFallback(file);
          }
          
          // Use third fallback storage
          console.log('Using third fallback storage for upload');
          return await uploadVideoToThirdFallback(file);
        }
        
        // Use second fallback storage
        console.log('Using second fallback storage for upload');
        return await uploadVideoToSecondFallback(file);
      }
      
      // Use first fallback storage
      console.log('Using first fallback storage for upload');
      return await uploadVideoToFallback(file);
    }
    
    // Try primary storage first
    console.log('Using primary storage for upload');
    
    // Check file size before upload (Appwrite default limit is often 60MB)
    const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
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
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb'}`;
  } catch (error: any) {
    console.error('Error uploading video to Appwrite storage:', error);
    
    // If it's a storage limit error, try fallback storage
    if (error.message && (error.message.includes('limit') || error.message.includes('quota') || error.message.includes('storage'))) {
      console.log('Storage limit reached, attempting fallback storage');
      try {
        // Try first fallback
        return await uploadVideoToFallback(file);
      } catch (fallbackError: any) {
        console.error('Error uploading to first fallback storage:', fallbackError);
        
        // If first fallback also fails with storage limit error, try second fallback
        if (fallbackError.message && (fallbackError.message.includes('limit') || fallbackError.message.includes('quota') || fallbackError.message.includes('storage'))) {
          console.log('First fallback storage limit reached, attempting second fallback storage');
          try {
            // Try second fallback
            return await uploadVideoToSecondFallback(file);
          } catch (secondFallbackError: any) {
            console.error('Error uploading to second fallback storage:', secondFallbackError);
            
            // If second fallback also fails with storage limit error, try third fallback
            if (secondFallbackError.message && (secondFallbackError.message.includes('limit') || secondFallbackError.message.includes('quota') || secondFallbackError.message.includes('storage'))) {
              console.log('Second fallback storage limit reached, attempting third fallback storage');
              try {
                // Try third fallback
                return await uploadVideoToThirdFallback(file);
              } catch (thirdFallbackError: any) {
                console.error('Error uploading to third fallback storage:', thirdFallbackError);
                
                // If third fallback also fails with storage limit error, try fourth fallback
                if (thirdFallbackError.message && (thirdFallbackError.message.includes('limit') || thirdFallbackError.message.includes('quota') || thirdFallbackError.message.includes('storage'))) {
                  console.log('Third fallback storage limit reached, attempting fourth fallback storage');
                  try {
                    // Try fourth fallback
                    return await uploadVideoToFourthFallback(file);
                  } catch (fourthFallbackError: any) {
                    console.error('Error uploading to fourth fallback storage:', fourthFallbackError);
                    
                    // If fourth fallback also fails with storage limit error, try fifth fallback
                    if (fourthFallbackError.message && (fourthFallbackError.message.includes('limit') || fourthFallbackError.message.includes('quota') || fourthFallbackError.message.includes('storage'))) {
                      console.log('Fourth fallback storage limit reached, attempting fifth fallback storage');
                      try {
                        // Try fifth fallback
                        return await uploadVideoToFifthFallback(file);
                      } catch (fifthFallbackError: any) {
                        console.error('Error uploading to fifth fallback storage:', fifthFallbackError);
                        
                        // If fifth fallback also fails with storage limit error, try sixth fallback
                        if (fifthFallbackError.message && (fifthFallbackError.message.includes('limit') || fifthFallbackError.message.includes('quota') || fifthFallbackError.message.includes('storage'))) {
                          console.log('Fifth fallback storage limit reached, attempting sixth fallback storage');
                          try {
                            // Try sixth fallback
                            return await uploadVideoToSixthFallback(file);
                          } catch (sixthFallbackError) {
                            console.error('Error uploading to sixth fallback storage:', sixthFallbackError);
                            throw sixthFallbackError;
                          }
                        }
                        
                        throw fifthFallbackError;
                      }
                    }
                    
                    throw fourthFallbackError;
                  }
                }
                
                throw thirdFallbackError;
              }
            }
            
            throw secondFallbackError;
          }
        }
        
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

// Function to upload a video file to Appwrite storage with progress tracking and multi-level fallback
export const uploadVideoWithProgress = async (file: File, onProgress: (progress: number) => void, storageServer?: StorageServer): Promise<string> => {
  try {
    // If a specific storage server is selected for testing, use that server directly
    if (storageServer) {
      switch (storageServer) {
        case 'fallback1':
          console.log('Using first fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback1Result = await uploadVideoToFallback(file);
          onProgress(100); // Complete progress
          return fallback1Result;
        case 'fallback2':
          console.log('Using second fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback2Result = await uploadVideoToSecondFallback(file);
          onProgress(100); // Complete progress
          return fallback2Result;
        case 'fallback3':
          console.log('Using third fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback3Result = await uploadVideoToThirdFallback(file);
          onProgress(100); // Complete progress
          return fallback3Result;
        case 'fallback4':
          console.log('Using fourth fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback4Result = await uploadVideoToFourthFallback(file);
          onProgress(100); // Complete progress
          return fallback4Result;
        case 'fallback5':
          console.log('Using fifth fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback5Result = await uploadVideoToFifthFallback(file);
          onProgress(100); // Complete progress
          return fallback5Result;
        case 'fallback6':
          console.log('Using sixth fallback storage for upload with progress (testing mode)');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const fallback6Result = await uploadVideoToSixthFallback(file);
          onProgress(100); // Complete progress
          return fallback6Result;
        case 'primary':
        default:
          console.log('Using primary storage for upload with progress (testing mode)');
          // Check file size before upload (Appwrite default limit is often 60MB)
          const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
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
          return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb'}`;
      }
    }
    
    // Normal fallback behavior when no specific server is selected
    // Check if primary storage is full
    const primaryFull = await isPrimaryStorageFull();
    
    if (primaryFull) {
      // Check if first fallback storage is also full
      const firstFallbackFull = await isFirstFallbackStorageFull();
      
      if (firstFallbackFull) {
        // Check if second fallback storage is also full
        const secondFallbackFull = await isSecondFallbackStorageFull();
        
        if (secondFallbackFull) {
          // Check if third fallback storage is also full
          const thirdFallbackFull = await isThirdFallbackStorageFull();
          
          if (thirdFallbackFull) {
            // Check if fourth fallback storage is also full
            const fourthFallbackFull = await isFourthFallbackStorageFull();
            
            if (fourthFallbackFull) {
              // Check if fifth fallback storage is also full
              const fifthFallbackFull = await isFifthFallbackStorageFull();
              
              if (fifthFallbackFull) {
                // Use sixth fallback storage
                console.log('Using sixth fallback storage for upload with progress');
                // Note: fallback storage doesn't currently support progress tracking in this implementation
                onProgress(10); // Start progress
                setTimeout(() => onProgress(50), 100); // Simulate progress
                setTimeout(() => onProgress(90), 200); // Simulate progress
                const result = await uploadVideoToSixthFallback(file);
                onProgress(100); // Complete progress
                return result;
              }
              
              // Use fifth fallback storage
              console.log('Using fifth fallback storage for upload with progress');
              // Note: fallback storage doesn't currently support progress tracking in this implementation
              onProgress(10); // Start progress
              setTimeout(() => onProgress(50), 100); // Simulate progress
              setTimeout(() => onProgress(90), 200); // Simulate progress
              const result = await uploadVideoToFifthFallback(file);
              onProgress(100); // Complete progress
              return result;
            }
            
            // Use fourth fallback storage
            console.log('Using fourth fallback storage for upload with progress');
            // Note: fallback storage doesn't currently support progress tracking in this implementation
            onProgress(10); // Start progress
            setTimeout(() => onProgress(50), 100); // Simulate progress
            setTimeout(() => onProgress(90), 200); // Simulate progress
            const result = await uploadVideoToFourthFallback(file);
            onProgress(100); // Complete progress
            return result;
          }
          
          // Use third fallback storage
          console.log('Using third fallback storage for upload with progress');
          // Note: fallback storage doesn't currently support progress tracking in this implementation
          onProgress(10); // Start progress
          setTimeout(() => onProgress(50), 100); // Simulate progress
          setTimeout(() => onProgress(90), 200); // Simulate progress
          const result = await uploadVideoToThirdFallback(file);
          onProgress(100); // Complete progress
          return result;
        }
        
        // Use second fallback storage
        console.log('Using second fallback storage for upload with progress');
        // Note: fallback storage doesn't currently support progress tracking in this implementation
        onProgress(10); // Start progress
        setTimeout(() => onProgress(50), 100); // Simulate progress
        setTimeout(() => onProgress(90), 200); // Simulate progress
        const result = await uploadVideoToSecondFallback(file);
        onProgress(100); // Complete progress
        return result;
      }
      
      // Use first fallback storage
      console.log('Using first fallback storage for upload with progress');
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
    
    // Check file size before upload (Appwrite default limit is often 60MB)
    const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit. File is ${(file.size / (1024 * 1024)).toFixed(2)}MB, maximum allowed is 60MB. Please compress the video or contact administrator to increase limit.`);
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
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb'}`;
  } catch (error: any) {
    console.error('Error uploading video to primary Appwrite storage:', error);
    
    // If it's a storage limit error, try fallback storage
    if (error.message && (error.message.includes('limit') || error.message.includes('quota') || error.message.includes('storage'))) {
      console.log('Primary storage limit reached, attempting first fallback storage with progress');
      try {
        onProgress(10); // Start progress
        setTimeout(() => onProgress(50), 100); // Simulate progress
        setTimeout(() => onProgress(90), 200); // Simulate progress
        const result = await uploadVideoToFallback(file);
        onProgress(100); // Complete progress
        return result;
      } catch (fallbackError: any) {
        console.error('Error uploading to first fallback storage:', fallbackError);
        
        // If first fallback also fails with storage limit error, try second fallback
        if (fallbackError.message && (fallbackError.message.includes('limit') || fallbackError.message.includes('quota') || fallbackError.message.includes('storage'))) {
          console.log('First fallback storage limit reached, attempting second fallback storage with progress');
          try {
            onProgress(10); // Start progress
            setTimeout(() => onProgress(50), 100); // Simulate progress
            setTimeout(() => onProgress(90), 200); // Simulate progress
            const result = await uploadVideoToSecondFallback(file);
            onProgress(100); // Complete progress
            return result;
          } catch (secondFallbackError: any) {
            console.error('Error uploading to second fallback storage:', secondFallbackError);
            
            // If second fallback also fails with storage limit error, try third fallback
            if (secondFallbackError.message && (secondFallbackError.message.includes('limit') || secondFallbackError.message.includes('quota') || secondFallbackError.message.includes('storage'))) {
              console.log('Second fallback storage limit reached, attempting third fallback storage with progress');
              try {
                onProgress(10); // Start progress
                setTimeout(() => onProgress(50), 100); // Simulate progress
                setTimeout(() => onProgress(90), 200); // Simulate progress
                const result = await uploadVideoToThirdFallback(file);
                onProgress(100); // Complete progress
                return result;
              } catch (thirdFallbackError: any) {
                console.error('Error uploading to third fallback storage:', thirdFallbackError);
                
                // If third fallback also fails with storage limit error, try fourth fallback
                if (thirdFallbackError.message && (thirdFallbackError.message.includes('limit') || thirdFallbackError.message.includes('quota') || thirdFallbackError.message.includes('storage'))) {
                  console.log('Third fallback storage limit reached, attempting fourth fallback storage with progress');
                  try {
                    onProgress(10); // Start progress
                    setTimeout(() => onProgress(50), 100); // Simulate progress
                    setTimeout(() => onProgress(90), 200); // Simulate progress
                    const result = await uploadVideoToFourthFallback(file);
                    onProgress(100); // Complete progress
                    return result;
                  } catch (fourthFallbackError: any) {
                    console.error('Error uploading to fourth fallback storage:', fourthFallbackError);
                    
                    // If fourth fallback also fails with storage limit error, try fifth fallback
                    if (fourthFallbackError.message && (fourthFallbackError.message.includes('limit') || fourthFallbackError.message.includes('quota') || fourthFallbackError.message.includes('storage'))) {
                      console.log('Fourth fallback storage limit reached, attempting fifth fallback storage with progress');
                      try {
                        onProgress(10); // Start progress
                        setTimeout(() => onProgress(50), 100); // Simulate progress
                        setTimeout(() => onProgress(90), 200); // Simulate progress
                        const result = await uploadVideoToFifthFallback(file);
                        onProgress(100); // Complete progress
                        return result;
                      } catch (fifthFallbackError: any) {
                        console.error('Error uploading to fifth fallback storage:', fifthFallbackError);
                        
                        // If fifth fallback also fails with storage limit error, try sixth fallback
                        if (fifthFallbackError.message && (fifthFallbackError.message.includes('limit') || fifthFallbackError.message.includes('quota') || fifthFallbackError.message.includes('storage'))) {
                          console.log('Fifth fallback storage limit reached, attempting sixth fallback storage with progress');
                          try {
                            onProgress(10); // Start progress
                            setTimeout(() => onProgress(50), 100); // Simulate progress
                            setTimeout(() => onProgress(90), 200); // Simulate progress
                            const result = await uploadVideoToSixthFallback(file);
                            onProgress(100); // Complete progress
                            return result;
                          } catch (sixthFallbackError) {
                            console.error('Error uploading to sixth fallback storage:', sixthFallbackError);
                            throw sixthFallbackError;
                          }
                        }
                        
                        throw fifthFallbackError;
                      }
                    }
                    
                    throw fourthFallbackError;
                  }
                }
                
                throw thirdFallbackError;
              }
            }
            
            throw secondFallbackError;
          }
        }
        
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

// Function to delete a video file from Appwrite storage (handles all storage levels)
export const deleteVideoStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Determine which storage server the file is on by checking the project ID in the URL
    const sixthFallbackProjectId = import.meta.env.VITE_APPWRITE_SIXTH_FALLBACK_PROJECT_ID || '68ccd6fe002652608c65';
    const fifthFallbackProjectId = import.meta.env.VITE_APPWRITE_FIFTH_FALLBACK_PROJECT_ID || '68ccd6070013df26676b';
    const fourthFallbackProjectId = import.meta.env.VITE_APPWRITE_FOURTH_FALLBACK_PROJECT_ID || '68cb8e1d002e4fc95d7d';
    const thirdFallbackProjectId = import.meta.env.VITE_APPWRITE_THIRD_FALLBACK_PROJECT_ID || '68ccc9900006d14e2952';
    const secondFallbackProjectId = import.meta.env.VITE_APPWRITE_SECOND_FALLBACK_PROJECT_ID || '68ccc7cb003ae8c6d892';
    const firstFallbackProjectId = import.meta.env.VITE_APPWRITE_FALLBACK_PROJECT_ID || '68ccc43b0039d53b4ccd';
    const primaryProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb';
    
    if (fileUrl.includes(sixthFallbackProjectId)) {
      // Delete from sixth fallback storage
      console.log('Deleting from sixth fallback storage');
      await deleteVideoFromSixthFallback(fileUrl);
    } else if (fileUrl.includes(fifthFallbackProjectId)) {
      // Delete from fifth fallback storage
      console.log('Deleting from fifth fallback storage');
      await deleteVideoFromFifthFallback(fileUrl);
    } else if (fileUrl.includes(fourthFallbackProjectId)) {
      // Delete from fourth fallback storage
      console.log('Deleting from fourth fallback storage');
      await deleteVideoFromFourthFallback(fileUrl);
    } else if (fileUrl.includes(thirdFallbackProjectId)) {
      // Delete from third fallback storage
      console.log('Deleting from third fallback storage');
      await deleteVideoFromThirdFallback(fileUrl);
    } else if (fileUrl.includes(secondFallbackProjectId)) {
      // Delete from second fallback storage
      console.log('Deleting from second fallback storage');
      await deleteVideoFromSecondFallback(fileUrl);
    } else if (fileUrl.includes(firstFallbackProjectId)) {
      // Delete from first fallback storage
      console.log('Deleting from first fallback storage');
      await deleteVideoFromFallback(fileUrl);
    } else if (fileUrl.includes(primaryProjectId)) {
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
    } else {
      console.warn('Unknown storage server for file URL:', fileUrl);
    }
  } catch (error) {
    console.error('Error deleting video from Appwrite storage:', error);
    // Don't throw error as we still want to delete the database entry
  }
};

// Function to save QR code data to Appwrite database
export const saveQRCodeToAppwrite = async (qrData: QRCodeData): Promise<QRCodeData> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        title: qrData.title,
        url: qrData.url,
        qrCodeDataUrl: qrData.qrCodeDataUrl,
        createdAt: qrData.createdAt
      }
    );

    // Return the saved QR code data with the Appwrite document ID
    return {
      ...qrData,
      id: response.$id
    };
  } catch (error) {
    console.error('Error saving QR code to Appwrite:', error);
    throw error;
  }
};

// Function to get all QR codes from Appwrite database
export const getQRCodesFromAppwrite = async (): Promise<QRCodeData[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('createdAt')
      ]
    );

    // Map the Appwrite documents to QRCodeData objects
    return response.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      url: doc.url,
      qrCodeDataUrl: doc.qrCodeDataUrl,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error fetching QR codes from Appwrite:', error);
    throw error;
  }
};

// Function to delete a QR code from Appwrite database
export const deleteQRCodeFromAppwrite = async (id: string, fileUrl?: string): Promise<void> => {
  try {
    // First delete the video file from storage if a file URL is provided
    if (fileUrl) {
      await deleteVideoStorage(fileUrl);
    }

    // Then delete the QR code document from the database
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      id
    );

    console.log(`Successfully deleted QR code with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting QR code from Appwrite:', error);
    throw error;
  }
};
