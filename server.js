// Express.js proxy server for Appwrite requests
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
///
// Proxy middleware for Appwrite requests
const appwriteProxy = createProxyMiddleware({
  target: 'https://fra.cloud.appwrite.io',
  changeOrigin: true,
  pathRewrite: {
    '^/api/appwrite-proxy': '/v1', // Remove the proxy prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log the proxied request
    console.log(`Proxying ${req.method} ${req.url} to Appwrite`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log the response
    console.log(`Received response from Appwrite: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Use the proxy middleware for Appwrite API requests
app.use('/api/appwrite-proxy', appwriteProxy);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});

export default app;