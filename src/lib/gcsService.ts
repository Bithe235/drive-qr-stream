// Google Cloud Storage Service - Proxy Version
// This service communicates with a backend proxy server to handle GCS operations

const GCS_PROXY_BASE_URL = import.meta.env.VITE_GCS_PROXY_URL || 'http://localhost:3001';

console.log('VITE_GCS_PROXY_URL:', import.meta.env.VITE_GCS_PROXY_URL);
console.log('GCS_PROXY_BASE_URL:', GCS_PROXY_BASE_URL);

// Upload file to GCS via proxy
export const uploadFileToGCS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${GCS_PROXY_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading file to GCS:', error);
    throw new Error(`Failed to upload file to Google Cloud Storage: ${error.message}`);
  }
};

// Delete file from GCS via proxy
export const deleteFileFromGCS = async (fileName: string): Promise<void> => {
  try {
    const response = await fetch(`${GCS_PROXY_BASE_URL}/delete/${encodeURIComponent(fileName)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }
    
    console.log(`File ${fileName} deleted from GCS`);
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    throw new Error(`Failed to delete file from Google Cloud Storage: ${error.message}`);
  }
};

// Get file URL from GCS (no proxy needed for this)
export const getFileUrlFromGCS = (fileName: string): string => {
  const bucketName = import.meta.env.VITE_GCS_BUCKET_NAME || 'drive-qr-stream-test-bucket';
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
};

// List files in GCS bucket via proxy
export const listFilesInGCS = async (): Promise<Array<{name: string, url: string}>> => {
  try {
    const response = await fetch(`${GCS_PROXY_BASE_URL}/files`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to list files');
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing files in GCS:', error);
    throw new Error(`Failed to list files in Google Cloud Storage: ${error.message}`);
  }
};