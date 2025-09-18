// Utility functions for video handling

// Extract a consistent identifier from Appwrite video URLs
// This ensures that the same video file gets the same cache key even if the URL changes
export const extractVideoIdentifier = (videoUrl: string): string | null => {
  // For Appwrite URLs, extract the file ID from the URL path
  // Format: http://104.196.96.133/v1/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID
  const appwriteMatch = videoUrl.match(/\/files\/([^\/]+)\/view/);
  if (appwriteMatch) {
    return appwriteMatch[1]; // Return the file ID
  }
  
  // For other URLs, use a hash of the URL
  return null;
};

// Generate a consistent cache key for a video
export const generateVideoCacheKey = (videoId: string, videoUrl: string): string => {
  // Try to extract a consistent identifier from the URL
  const urlIdentifier = extractVideoIdentifier(videoUrl);
  
  // If we can extract a consistent identifier, use it
  if (urlIdentifier) {
    return urlIdentifier;
  }
  
  // Otherwise, fall back to using the videoId
  return videoId;
};