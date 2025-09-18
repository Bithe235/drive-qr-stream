// Vercel API route to proxy Appwrite requests
import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    // Get the Appwrite endpoint from environment variables or use default
    const appwriteEndpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    
    // Construct the full URL
    const url = `${appwriteEndpoint}${req.query.path || ''}`;
    console.log('Proxying request to:', url);
    
    // Forward the request to Appwrite
    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        'Content-Type': 'application/json',
        // Remove headers that might cause issues
        'host': undefined,
        'connection': undefined,
        'content-length': undefined,
      },
      // @ts-ignore
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Forward the response back to the client
    res.status(response.status);
    
    // Forward headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send the response body
    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: (error as Error).message });
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};