import QRCode from 'qrcode';

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
      id: Date.now().toString(),
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

export const saveQRCode = (qrData: QRCodeData): void => {
  const existingQRs = getStoredQRCodes();
  const updatedQRs = [...existingQRs, qrData];
  localStorage.setItem('qrCodes', JSON.stringify(updatedQRs));
};

export const getStoredQRCodes = (): QRCodeData[] => {
  try {
    const stored = localStorage.getItem('qrCodes');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing stored QR codes:', error);
    return [];
  }
};

export const deleteQRCode = (id: string): void => {
  const existingQRs = getStoredQRCodes();
  const updatedQRs = existingQRs.filter(qr => qr.id !== id);
  localStorage.setItem('qrCodes', JSON.stringify(updatedQRs));
};

export const downloadQRCode = (qrData: QRCodeData): void => {
  const link = document.createElement('a');
  link.download = `${qrData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
  link.href = qrData.qrCodeDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utility to extract Google Drive file ID and convert to direct video URL
export const processGoogleDriveUrl = (url: string): string => {
  const driveMatch = url.match(/drive\.google\.com.*[-\w]{25,}/);
  if (driveMatch) {
    const fileId = url.match(/[-\w]{25,}/)?.[0];
    if (fileId) {
      // Use embed URL with parameters for better scaling and fullscreen support
      return `https://drive.google.com/file/d/${fileId}/preview?usp=drivesdk&embed=true`;
    }
  }
  return url;
};

// New function to generate embed URL with autoplay support
export const generateGoogleDriveEmbedUrl = (url: string): string => {
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[0];
    // Simplified Google Drive embed URL without autoplay for better reliability
    return `https://drive.google.com/file/d/${fileId}/preview?usp=drivesdk&embed=true`;
  }
  return url;
};