#!/bin/bash

# Google Cloud Storage Setup Script for Drive QR Stream
# This script will:
# 1. Create a GCS bucket
# 2. Set appropriate permissions
# 3. Configure CORS settings

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null
then
    echo "gcloud could not be found. Please install Google Cloud SDK first."
    exit 1
fi

# Variables - customize these for your setup
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "No default project set. Please run 'gcloud config set project PROJECT_ID'"
    exit 1
fi

BUCKET_NAME="drive-qr-stream-videos-$(date +%s)"  # Unique bucket name
REGION="us-central1"

echo "Setting up Google Cloud Storage for Drive QR Stream..."
echo "Project ID: $PROJECT_ID"
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"

# Create the bucket
echo "Creating bucket: $BUCKET_NAME"
gsutil mb -l $REGION gs://$BUCKET_NAME/

# Set bucket permissions - make it private by default
echo "Setting bucket permissions..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME/  # Remove public access
# Only authenticated users can access (will be configured via signed URLs)

# Create CORS configuration file
echo "Creating CORS configuration..."
cat > cors-config.json << EOF
[
  {
    "origin": ["http://localhost:5173", "https://drive-qr-stream.vercel.app"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
echo "Applying CORS configuration..."
gsutil cors set cors-config.json gs://$BUCKET_NAME/

# Clean up CORS config file
rm cors-config.json

# Create service account for the application
SERVICE_ACCOUNT_NAME="drive-qr-stream-gcs"
echo "Creating service account: $SERVICE_ACCOUNT_NAME"
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="Drive QR Stream GCS Service Account"

# Grant necessary permissions to the service account
echo "Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.legacyBucketWriter"

# Generate service account key
echo "Generating service account key..."
gcloud iam service-accounts keys create gcs-service-account-key.json \
    --iam-account="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "Setup complete!"
echo "Bucket created: gs://$BUCKET_NAME/"
echo "Service account key saved to: gcs-service-account-key.json"
echo "CORS configured for localhost:5173 and drive-qr-stream.vercel.app"

# Display bucket info
echo ""
echo "Bucket details:"
gsutil ls -L -b gs://$BUCKET_NAME/