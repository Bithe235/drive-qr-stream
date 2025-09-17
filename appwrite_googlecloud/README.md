# Appwrite + Google Cloud Storage Setup for Drive QR Stream

This directory contains scripts to automatically set up Appwrite with Google Cloud Storage integration for the Drive QR Stream project.

## Prerequisites

Before running the setup scripts, ensure you have the following installed:

1. Docker
2. Docker Compose
3. Node.js and npm
4. jq (for parsing JSON responses)
5. Google Cloud SDK (for GCS integration)

## Setup Instructions

### 1. Run the Setup Script

#### On Linux/Mac:
```bash
chmod +x setup-appwrite-gcs.sh
./setup-appwrite-gcs.sh
```

#### On Windows:
```cmd
setup-appwrite-gcs.bat
```

### 2. What the Script Does

The setup script will:

1. Deploy Appwrite using Docker Compose
2. Create an Appwrite project for Drive QR Stream
3. Set up the database and collection for storing QR code metadata
4. Create a storage bucket for video files
5. Generate environment configuration files

### 3. Configure Google Cloud Storage

After running the setup script, you'll need to configure Google Cloud Storage integration:

1. Create a Google Cloud Project (if you don't have one)
2. Enable the Cloud Storage API
3. Create a service account with Storage Admin permissions
4. Download the service account key as a JSON file
5. Update the `.env.local` file with your GCS configuration:
   ```
   VITE_GCS_PROJECT_ID=your-gcs-project-id
   VITE_GCS_BUCKET_NAME=your-gcs-bucket-name
   VITE_GCS_KEY_FILENAME=path/to/your/service-account-key.json
   ```

### 4. Start the Application

1. Navigate to the project root directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `setup-appwrite-gcs.sh` - Bash script for Linux/Mac setup
- `setup-appwrite-gcs.bat` - Batch script for Windows setup
- `docker-compose.yml` - Docker Compose configuration for Appwrite
- `telegraf.conf` - Telegraf configuration for monitoring

## Environment Variables

The setup script generates a `.env.local` file in the project root with the following variables:

- `VITE_APPWRITE_ENDPOINT` - Appwrite API endpoint
- `VITE_APPWRITE_PROJECT_ID` - Appwrite project ID
- `VITE_APPWRITE_DATABASE_ID` - Appwrite database ID
- `VITE_USE_GCS` - Flag to enable Google Cloud Storage integration
- `VITE_GCS_PROJECT_ID` - Google Cloud project ID
- `VITE_GCS_BUCKET_NAME` - Google Cloud Storage bucket name
- `VITE_GCS_KEY_FILENAME` - Path to GCS service account key file
- `VITE_GCS_PROXY_URL` - URL for the GCS proxy server

## Troubleshooting

### Appwrite Not Starting
If Appwrite fails to start, check the Docker logs:
```bash
docker-compose logs appwrite
```

### Database Connection Issues
Ensure the MariaDB container is running:
```bash
docker-compose ps
```

### Missing jq Command
If you get errors about missing jq, install it:
- Ubuntu/Debian: `sudo apt-get install jq`
- Mac: `brew install jq`
- Windows: Download from https://stedolan.github.io/jq/

## Manual Setup (Alternative)

If you prefer to set up Appwrite manually:

1. Follow the official Appwrite installation guide: https://appwrite.io/docs/installation
2. Create a project in the Appwrite console
3. Create a database named "QR Code Database"
4. Create a collection named "QR Codes" with the following attributes:
   - `title` (string, 255 chars, required)
   - `url` (string, 1000 chars, required)
   - `qrCodeDataUrl` (string, 5000 chars, required)
   - `createdAt` (datetime, required)
5. Create a storage bucket named "Videos" with appropriate permissions
6. Update the environment variables in `.env.local` with your project details

## Security Considerations

1. Change the default passwords in the docker-compose.yml file
2. Use strong, unique passwords for production deployments
3. Restrict access to the Appwrite dashboard
4. Secure your GCS service account key file
5. Enable HTTPS for production deployments

## Support

For issues with this setup, please check:
1. Appwrite documentation: https://appwrite.io/docs
2. Google Cloud Storage documentation: https://cloud.google.com/storage/docs
3. Project README in the root directory