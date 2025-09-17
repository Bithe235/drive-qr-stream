// Google Cloud Storage Configuration
export interface GCSConfig {
  projectId: string;
  bucketName: string;
  keyFilename: string;
  corsOrigins: string[];
}

// Default configuration - will be overridden by environment variables
export const defaultGCSConfig: GCSConfig = {
  projectId: process.env.VITE_GCS_PROJECT_ID || 'your-gcs-project-id',
  bucketName: process.env.VITE_GCS_BUCKET_NAME || 'drive-qr-stream-videos',
  keyFilename: process.env.VITE_GCS_KEY_FILENAME || './gcs-service-account-key.json',
  corsOrigins: [
    'http://localhost:5173',
    'https://drive-qr-stream.vercel.app'
  ]
};

// Function to get GCS configuration from environment variables or defaults
export const getGCSConfig = (): GCSConfig => {
  return {
    projectId: process.env.VITE_GCS_PROJECT_ID || defaultGCSConfig.projectId,
    bucketName: process.env.VITE_GCS_BUCKET_NAME || defaultGCSConfig.bucketName,
    keyFilename: process.env.VITE_GCS_KEY_FILENAME || defaultGCSConfig.keyFilename,
    corsOrigins: defaultGCSConfig.corsOrigins
  };
};