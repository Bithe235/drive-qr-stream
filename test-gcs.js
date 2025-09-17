// Simple test script to verify GCS integration
async function testGCS() {
  try {
    // Test the GCS proxy server health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('GCS Proxy Health:', healthData);
    
    // Test the GCS proxy server root endpoint
    const rootResponse = await fetch('http://localhost:3001/');
    const rootData = await rootResponse.json();
    console.log('GCS Proxy Root:', rootData);
    
    console.log('GCS integration test completed successfully');
  } catch (error) {
    console.error('GCS integration test failed:', error);
  }
}

testGCS();