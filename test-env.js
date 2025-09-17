// Simple test script to verify environment variables
console.log('Testing environment variables...');

// Simulate Vite environment variables
const env = {
  VITE_USE_GCS: process.env.VITE_USE_GCS || 'true',
  VITE_GCS_PROXY_URL: process.env.VITE_GCS_PROXY_URL || 'http://localhost:3001'
};

console.log('VITE_USE_GCS:', env.VITE_USE_GCS);
console.log('VITE_GCS_PROXY_URL:', env.VITE_GCS_PROXY_URL);

console.log('USE_GCS evaluation:', env.VITE_USE_GCS === 'true');