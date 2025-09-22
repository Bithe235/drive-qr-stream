/**
 * QR Code Generation and Management
 * 
 * Developed by Fahad Akash
 * Game Developer | Cloud Engineer | Full Stack Developer
 * 
 * This module handles QR code generation, management, and integration
 * with the Appwrite backend for persistent storage of QR code data.
 * 
 * Features:
 * - QR code generation using the qrcode library
 * - Integration with Appwrite for data persistence
 * - Video URL processing and optimization
 * - Upload functionality with progress tracking
 */

import QRCode from 'qrcode';
import { saveQRCodeToAppwrite, getQRCodesFromAppwrite, deleteQRCodeFromAppwrite, uploadVideoWithProgress } from './appwrite';

// Define storage server options
export type StorageServer = 'primary' | 'fallback1' | 'fallback2' | 'fallback3' | 'fallback4' | 'fallback5' | 'fallback6';

export interface QRCodeData {
  id: string;
  title: string;
  url: string;
  qrCodeDataUrl: string;
  createdAt: string;
}

export const generateQRCode = async (url: string, title: string): Promise<QRCodeData> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    const qrData: QRCodeData = {
      id: Date.now().toString(), // This will be replaced by Appwrite's ID when saved
      title,
      url,
      qrCodeDataUrl,
      createdAt: new Date().toISOString()
    };

    return qrData;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Function to upload a video file and generate a QR code for it
export const uploadVideoAndGenerateQR = async (file: File, title: string, onProgress?: (progress: number) => void, storageServer?: StorageServer): Promise<QRCodeData> => {
  try {
    // Upload the video file with progress tracking
    // For now, we'll use the existing uploadVideoWithProgress function
    // In a more advanced implementation, we could modify this to use specific storage servers
    const videoUrl = await uploadVideoWithProgress(file, (progress) => {
      if (onProgress) {
        onProgress(progress);
      }
    }, storageServer);
    
    // Generate QR code for the video URL
    const qrData = await generateQRCode(videoUrl, title);
    
    // Save QR code data to Appwrite
    const savedQRData = await saveQRCodeToAppwrite(qrData);
    
    return savedQRData;
  } catch (error: any) {
    console.error('Error uploading video and generating QR code:', error);
    
    // Provide more user-friendly error messages
    if (error.message && error.message.includes('size')) {
      throw new Error(`Video upload failed: ${error.message}`);
    } else if (error.message) {
      throw new Error(`Failed to upload video or generate QR code: ${error.message}`);
    } else {
      throw new Error('Failed to upload video or generate QR code. Please try again or contact support.');
    }
  }
};

export const saveQRCode = async (qrData: QRCodeData): Promise<QRCodeData> => {
  try {
    const savedQRData = await saveQRCodeToAppwrite(qrData);
    return savedQRData;
  } catch (error) {
    console.error('Error saving QR code to Appwrite:', error);
    throw error;
  }
};

export const getStoredQRCodes = async (): Promise<QRCodeData[]> => {
  try {
    const qrCodes = await getQRCodesFromAppwrite();
    return qrCodes;
  } catch (error) {
    console.error('Error fetching QR codes from Appwrite:', error);
    return [];
  }
};

export const deleteQRCode = async (id: string, fileUrl?: string): Promise<void> => {
  try {
    await deleteQRCodeFromAppwrite(id, fileUrl);
  } catch (error) {
    console.error('Error deleting QR code from Appwrite:', error);
    throw error;
  }
};

export const downloadQRCode = (qrData: QRCodeData): void => {
  const link = document.createElement('a');
  link.download = `${qrData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
  link.href = qrData.qrCodeDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};