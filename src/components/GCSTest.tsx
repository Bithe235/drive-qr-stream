import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadVideo } from '@/lib/appwrite';

export const GCSTest = () => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading...');
    try {
      const url = await uploadVideo(file);
      setUploadedUrl(url);
      setUploadStatus('Upload successful!');
      console.log('Uploaded URL:', url);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Google Cloud Storage Test</h2>
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleFileUpload} 
        ref={fileInputRef}
        className="mb-4 hidden"
      />
      <Button onClick={() => fileInputRef.current?.click()}>
        Select Video File
      </Button>
      <div className="mt-4">
        <p>Status: {uploadStatus}</p>
        {uploadedUrl && (
          <div className="mt-4">
            <p className="font-medium">Uploaded URL:</p>
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
              {uploadedUrl}
            </a>
            <div className="mt-4">
              <p className="font-medium">Video Preview:</p>
              <video src={uploadedUrl} controls className="mt-2 max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};