# Google Cloud Storage Integration

This document explains how to set up and use Google Cloud Storage (GCS) with the Drive QR Stream application.

## Architecture Overview

Since the `@google-cloud/storage` library is designed for Node.js environments and cannot be used directly in the browser, we've implemented a proxy server architecture:

1. **Frontend**: Communicates with a backend proxy server via REST API
2. **Proxy Server**: Handles all GCS operations using the official GCS SDK
3. **Google Cloud Storage**: Stores video files with public access

## Setup Instructions

### 1. Prerequisites
- Google Cloud account
- Google Cloud SDK installed and configured
- `gcloud` CLI tool available in your terminal
- Node.js installed

### 2. Automated Setup
Run the setup script to automatically create a GCS bucket and configure it:

**Windows:**
```cmd
setup-gcs.bat
```

**Linux/Mac:**
```bash
chmod +x setup-gcs.sh
./setup-gcs.sh
```

The script will:
- Create a new GCS bucket with a unique name
- Configure CORS settings for localhost and your domain
- Create a service account with appropriate permissions
- Generate a service account key file (`gcs-service-account-key.json`)

### 3. Manual Setup (Alternative)
If you prefer to set up manually:

1. Create a GCS bucket:
   ```bash
   gsutil mb -l us-central1 gs://your-bucket-name/
   ```

2. Configure CORS:
   Create a `cors-config.json` file:
   ```json
   [
     {
       "origin": ["http://localhost:5173", "https://drive-qr-stream.vercel.app"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   
   Apply the CORS configuration:
   ```bash
   gsutil cors set cors-config.json gs://your-bucket-name/
   ```

3. Create a service account and key:
   ```bash
   gcloud iam service-accounts create drive-qr-stream-gcs --display-name="Drive QR Stream GCS Service Account"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:drive-qr-stream-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com" --role="roles/storage.objectAdmin"
   gcloud iam service-accounts keys create gcs-service-account-key.json --iam-account="drive-qr-stream-gcs@YOUR_PROJECT_ID.iam.gserviceaccount.com"
   ```

### 4. Proxy Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the proxy server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

### 5. Configuration
Update the `.env` file in the root directory with your GCS settings:

```env
VITE_USE_GCS=true
VITE_GCS_PROJECT_ID=your-gcs-project-id
VITE_GCS_BUCKET_NAME=your-bucket-name
VITE_GCS_KEY_FILENAME=./gcs-service-account-key.json
VITE_GCS_PROXY_URL=http://localhost:3001
```

Update the `.env` file in the `server` directory:
```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_KEY_FILENAME=../gcs-service-account-key.json

# Server Configuration
PORT=3001
```

### 6. Environment Variables
- `VITE_USE_GCS`: Set to `true` to enable GCS integration
- `VITE_GCS_PROJECT_ID`: Your Google Cloud project ID
- `VITE_GCS_BUCKET_NAME`: Your GCS bucket name
- `VITE_GCS_KEY_FILENAME`: Path to your service account key file
- `VITE_GCS_PROXY_URL`: URL of the GCS proxy server

## Deployment to Google Cloud Run

### Prerequisites
- Google Cloud account with billing enabled
- Google Cloud SDK installed and configured
- Docker installed (for local testing)

### Automated Deployment
Run the deployment script to automatically deploy the proxy server to Google Cloud Run:

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Enable required Google Cloud services
- Build and deploy the container to Cloud Run
- Make the service publicly accessible
- Update the frontend `.env` file with the service URL

### Manual Deployment
If you prefer to deploy manually:

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Enable required services:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy gcs-proxy-server \
       --source . \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars GCS_PROJECT_ID=your-project-id,GCS_BUCKET_NAME=your-bucket-name
   ```

4. Update the frontend `.env` file with the service URL returned by the deployment command.

### Environment Variables for Cloud Run
When deploying to Cloud Run, the following environment variables are automatically set:
- `PORT`: Port for the server (automatically set by Cloud Run)
- `GCS_PROJECT_ID`: Your Google Cloud project ID
- `GCS_BUCKET_NAME`: Your GCS bucket name

The `GCS_KEY_FILENAME` is not needed when deploying to Cloud Run as the service account is automatically configured.

## How It Works

When `VITE_USE_GCS` is set to `true`:
- Video uploads are stored in Google Cloud Storage via the proxy server
- Video URLs point to GCS public URLs
- Appwrite is still used for database operations (storing QR code metadata)
- File deletion works for both GCS and Appwrite files

When `VITE_USE_GCS` is set to `false` or not set:
- All functionality works as before, using Appwrite for both storage and database

## CORS Configuration
The setup script automatically configures CORS for:
- `http://localhost:5173` (development)
- `https://drive-qr-stream.vercel.app` (production)

## Security Notes
- The service account key file should be kept secure and not committed to version control
- GCS files are made publicly readable by default for video playback
- Appwrite is still used for all database operations
- The proxy server should be deployed securely in production
- When deployed to Cloud Run, authentication is handled by Google Cloud IAM

## API Endpoints
The proxy server provides the following endpoints:
- `POST /upload` - Upload a file to GCS
- `DELETE /delete/:fileName` - Delete a file from GCS
- `GET /files` - List all files in the GCS bucket
- `GET /health` - Health check endpoint

## Troubleshooting
1. If videos don't play, check that CORS is properly configured
2. If uploads fail, verify the service account has the correct permissions
3. If you get authentication errors, check that the service account key file is in the correct location
4. Ensure the proxy server is running when using GCS features
5. Check browser console for network errors related to the proxy server
6. For Cloud Run deployment issues, check the Cloud Run logs in the Google Cloud Console