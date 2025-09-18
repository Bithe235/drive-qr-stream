// Simple test script to verify environment variables
console.log('Testing environment variables...');

// Simulate Vite environment variables
const env = {
  VITE_USE_GCS: process.env.VITE_USE_GCS || 'false',
  VITE_GCS_PROXY_URL: process.env.VITE_GCS_PROXY_URL || 'http://localhost:3001',
  VITE_APPWRITE_ENDPOINT: process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  VITE_APPWRITE_PROJECT_ID: process.env.VITE_APPWRITE_PROJECT_ID || '68ca9e8e000ddba95beb',
  VITE_APPWRITE_DATABASE_ID: process.env.VITE_APPWRITE_DATABASE_ID || '68ca9f760003f35cf8ca',
  VITE_APPWRITE_COLLECTION_ID: process.env.VITE_APPWRITE_COLLECTION_ID || 'qrcode',
  VITE_APPWRITE_STORAGE_BUCKET_ID: process.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '68caacec001fd1ff6b9d'
};

console.log('VITE_USE_GCS:', env.VITE_USE_GCS);
console.log('VITE_GCS_PROXY_URL:', env.VITE_GCS_PROXY_URL);
console.log('VITE_APPWRITE_ENDPOINT:', env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', env.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_APPWRITE_DATABASE_ID:', env.VITE_APPWRITE_DATABASE_ID);
console.log('VITE_APPWRITE_COLLECTION_ID:', env.VITE_APPWRITE_COLLECTION_ID);
console.log('VITE_APPWRITE_STORAGE_BUCKET_ID:', env.VITE_APPWRITE_STORAGE_BUCKET_ID);

console.log('USE_GCS evaluation:', env.VITE_USE_GCS === 'true');