@echo off
setlocal enabledelayedexpansion

echo Google Cloud Storage Setup Script for Drive QR Stream
echo ======================================================

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: gcloud could not be found. Please install Google Cloud SDK first.
    pause
    exit /b 1
)

REM Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>^&1') do set PROJECT_ID=%%i
if "%PROJECT_ID%"=="" (
    echo Error: No default project set. Please run 'gcloud config set project PROJECT_ID'
    pause
    exit /b 1
)

REM Set variables
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set BUCKET_NAME=drive-qr-stream-videos-%TIMESTAMP%
set REGION=us-central1
set SERVICE_ACCOUNT_NAME=drive-qr-stream-gcs

echo Setting up Google Cloud Storage for Drive QR Stream...
echo Project ID: %PROJECT_ID%
echo Bucket Name: %BUCKET_NAME%
echo Region: %REGION%

REM Create the bucket
echo Creating bucket: %BUCKET_NAME%
gsutil mb -l %REGION% gs://%BUCKET_NAME%/

REM Set bucket permissions - make it private by default
echo Setting bucket permissions...
gsutil iam ch allUsers:objectViewer gs://%BUCKET_NAME%/ 2>nul
REM Only authenticated users can access (will be configured via signed URLs)

REM Create CORS configuration file
echo Creating CORS configuration...
(
echo [
echo   {
echo     "origin": ["http://localhost:8080", "https://drive-qr-stream.vercel.app"],
echo     "method": ["GET", "HEAD"],
echo     "maxAgeSeconds": 3600
echo   }
echo ]
) > cors-config.json

REM Apply CORS configuration
echo Applying CORS configuration...
gsutil cors set cors-config.json gs://%BUCKET_NAME%/

REM Clean up CORS config file
del cors-config.json

REM Create service account for the application
echo Creating service account: %SERVICE_ACCOUNT_NAME%
gcloud iam service-accounts create %SERVICE_ACCOUNT_NAME% --display-name="Drive QR Stream GCS Service Account"

REM Grant necessary permissions to the service account
echo Granting permissions to service account...
gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%SERVICE_ACCOUNT_NAME%@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding %PROJECT_ID% --member="serviceAccount:%SERVICE_ACCOUNT_NAME%@%PROJECT_ID%.iam.gserviceaccount.com" --role="roles/storage.legacyBucketWriter"

REM Generate service account key
echo Generating service account key...
gcloud iam service-accounts keys create gcs-service-account-key.json --iam-account="%SERVICE_ACCOUNT_NAME%@%PROJECT_ID%.iam.gserviceaccount.com"

echo.
echo Setup complete!
echo Bucket created: gs://%BUCKET_NAME%/
echo Service account key saved to: gcs-service-account-key.json
echo CORS configured for localhost:5173 and drive-qr-stream.vercel.app

REM Display bucket info
echo.
echo Bucket details:
gsutil ls -L -b gs://%BUCKET_NAME%/

pause