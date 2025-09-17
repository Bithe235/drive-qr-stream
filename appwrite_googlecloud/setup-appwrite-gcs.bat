@echo off
setlocal enabledelayedexpansion

echo Appwrite + Google Cloud Setup Script for Drive QR Stream
echo =======================================================

REM Check if Google Cloud SDK is installed
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Google Cloud SDK could not be found. Please install it first.
    echo Download from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Set Google Cloud configuration
echo Setting Google Cloud configuration...
set PROJECT_ID=%~1
set REGION=%~2
set SERVICE_NAME=%~3

if "%PROJECT_ID%"=="" (
    set /p PROJECT_ID="Enter Google Cloud Project ID: "
)

if "%REGION%"=="" (
    set REGION=us-central1
)

if "%SERVICE_NAME%"=="" (
    set SERVICE_NAME=appwrite-drive-qr
)

echo Using Project ID: %PROJECT_ID%
echo Using Region: %REGION%
echo Using Service Name: %SERVICE_NAME%

REM Set the Google Cloud project
echo Setting Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo Enabling required Google Cloud APIs...
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage-component.googleapis.com

REM Create Cloud SQL instance for Appwrite database
echo Creating Cloud SQL instance for Appwrite (this may take 5-10 minutes)...
gcloud sql instances create %SERVICE_NAME%-db ^
    --database-version=MYSQL_8_0 ^
    --tier=db-n1-standard-1 ^
    --region=%REGION% ^
    --root-password=AppwriteRootPassword123! ^
    --availability-type=zonal

if %errorlevel% neq 0 (
    echo Error creating Cloud SQL instance. Please check the error message above.
    pause
    exit /b 1
)

REM Create Cloud Memorystore (Redis) instance for Appwrite
echo Creating Cloud Memorystore (Redis) instance...
gcloud redis instances create %SERVICE_NAME%-redis ^
    --size=1 ^
    --region=%REGION% ^
    --zone=%REGION%-a ^
    --redis-version=redis_6_x

if %errorlevel% neq 0 (
    echo Error creating Cloud Memorystore instance. Please check the error message above.
    pause
    exit /b 1
)

REM Create Google Cloud Storage bucket for videos
echo Creating Google Cloud Storage bucket...
set BUCKET_NAME=%SERVICE_NAME%-videos-%RANDOM%
gsutil mb -l %REGION% gs://%BUCKET_NAME%/

REM Set CORS for the bucket
echo Setting CORS for the bucket...
(
echo [
echo   {
echo     "origin": ["http://localhost:5173", "https://drive-qr-stream.vercel.app", "http://localhost:8080"],
echo     "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
echo     "maxAgeSeconds": 3600
echo   }
echo ]
) > cors-config.json

gsutil cors set cors-config.json gs://%BUCKET_NAME%/
del cors-config.json

REM Create service account for Appwrite
echo Creating service account for Appwrite...
gcloud iam service-accounts create %SERVICE_NAME%-sa ^
    --display-name="Appwrite Service Account"

REM Grant necessary permissions to the service account
echo Granting permissions to service account...
gcloud projects add-iam-policy-binding %PROJECT_ID% ^
    --member="serviceAccount:%SERVICE_NAME%-sa@%PROJECT_ID%.iam.gserviceaccount.com" ^
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding %PROJECT_ID% ^
    --member="serviceAccount:%SERVICE_NAME%-sa@%PROJECT_ID%.iam.gserviceaccount.com" ^
    --role="roles/redis.editor"

gcloud projects add-iam-policy-binding %PROJECT_ID% ^
    --member="serviceAccount:%SERVICE_NAME%-sa@%PROJECT_ID%.iam.gserviceaccount.com" ^
    --role="roles/storage.objectAdmin"

REM Get connection details for Cloud SQL and Redis
echo Getting connection details...
for /f "tokens=*" %%i in ('gcloud sql instances describe %SERVICE_NAME%-db --format="value(connectionName)"') do set DB_CONNECTION=%%i
for /f "tokens=*" %%i in ('gcloud redis instances describe %SERVICE_NAME%-redis --region=%REGION% --format="value(host)"') do set REDIS_HOST=%%i

echo Database Connection Name: %DB_CONNECTION%
echo Redis Host: %REDIS_HOST%

REM Create a simple Appwrite deployment using pre-built image with environment variables
echo Deploying Appwrite to Cloud Run...

REM Deploy to Cloud Run with all required environment variables
gcloud run deploy %SERVICE_NAME% ^
    --image=appwrite/appwrite:1.4.0 ^
    --platform=managed ^
    --region=%REGION% ^
    --allow-unauthenticated ^
    --service-account=%SERVICE_NAME%-sa@%PROJECT_ID%.iam.gserviceaccount.com ^
    --add-cloudsql-instances=%DB_CONNECTION% ^
    --set-env-vars^=_APP_ENV=production,_APP_LOCALE=en,_APP_CONSOLE_WHITELIST_ROOT=enabled,_APP_CONSOLE_WHITELIST_EMAILS=,_APP_CONSOLE_WHITELIST_IPS=,_APP_SYSTEM_EMAIL_NAME=Appwrite,_APP_SYSTEM_EMAIL_ADDRESS=team@appwrite.io,_APP_SYSTEM_SECURITY_EMAIL_ADDRESS=security@appwrite.io,_APP_OPTIONS_ABUSE=enabled,_APP_OPTIONS_FORCE_HTTPS=disabled,_APP_OPENSSL_KEY_V1=your-secret-key-change-in-production,_APP_DOMAIN=%SERVICE_NAME%.run.app,_APP_DOMAIN_TARGET=%SERVICE_NAME%.run.app,_APP_REDIS_HOST=%REDIS_HOST%,_APP_REDIS_PORT=6379,_APP_DB_HOST=/cloudsql/%DB_CONNECTION%,_APP_DB_PORT=3306,_APP_DB_SCHEMA=appwrite,_APP_DB_USER=root,_APP_DB_PASS=AppwriteRootPassword123!,_APP_STORAGE_LIMIT=30000000,_APP_STORAGE_DEVICE=GoogleCloud,_APP_STORAGE_GCS_BUCKET=%BUCKET_NAME%,_APP_STORAGE_GCS_PROJECT=%PROJECT_ID%

if %errorlevel% neq 0 (
    echo Error deploying to Cloud Run. Please check the error message above.
    pause
    exit /b 1
)

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

REM Create environment file for the frontend
echo Creating .env.local file with Appwrite configuration...
(
echo VITE_APPWRITE_ENDPOINT=%SERVICE_URL%/v1
echo VITE_APPWRITE_PROJECT_ID=drive-qr-stream
echo VITE_APPWRITE_DATABASE_ID=qrcode-db
echo VITE_USE_GCS=true
echo VITE_GCS_PROJECT_ID=%PROJECT_ID%
echo VITE_GCS_BUCKET_NAME=%BUCKET_NAME%
echo VITE_GCS_KEY_FILENAME=./gcs-service-account-key.json
echo VITE_GCS_PROXY_URL=http://localhost:3001
) > ..\.env.local

echo.
echo Appwrite deployment to Google Cloud complete!
echo ===========================================
echo.
echo Service URL: %SERVICE_URL%
echo Console URL: %SERVICE_URL%/console
echo API URL: %SERVICE_URL%/v1
echo.
echo To access the Appwrite console:
echo 1. Open your browser and go to: %SERVICE_URL%/console
echo 2. Create a new account (first account becomes admin)
echo 3. Create a project named "drive-qr-stream"
echo 4. Get your Project ID from the project settings
echo 5. Update your .env.local file with the actual Project ID
echo.
echo For Google Cloud Storage integration:
echo 1. Download a service account key JSON file
echo 2. Place it in your project root as "gcs-service-account-key.json"
echo 3. Update VITE_GCS_PROXY_URL if you deploy the GCS proxy to Cloud Run
echo.
echo You can now start the frontend application with 'npm run dev'

pause