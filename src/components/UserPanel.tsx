import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { getStoredQRCodes, downloadQRCode, QRCodeData } from '@/lib/qrGenerator';
import { QrCode, Download, Play, Settings, ArrowLeft } from 'lucide-react';

interface UserPanelProps {
  onBackToLogin: () => void;
}

export const UserPanel = ({ onBackToLogin }: UserPanelProps) => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allFilesQRData, setAllFilesQRData] = useState<string>('');

  useEffect(() => {
    const codes = getStoredQRCodes();
    setQrCodes(codes);
    
    // Generate QR code for all files download
    if (codes.length > 0) {
      const allUrls = codes.map(code => `${code.title}: ${code.url}`).join('\n');
      setAllFilesQRData(allUrls);
    }
  }, []);

  const handleVideoEnd = () => {
    if (qrCodes.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % qrCodes.length);
    }
  };

  const downloadAllFilesQR = async () => {
    if (allFilesQRData) {
      // Here you would generate and download a QR code containing all file information
      // For now, we'll download all individual QR codes
      qrCodes.forEach(qr => downloadQRCode(qr));
    }
  };

  const currentVideo = qrCodes[currentVideoIndex];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Play className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">QR Drive Player</h1>
              <p className="text-sm text-muted-foreground">
                {qrCodes.length} videos available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBackToLogin}>
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Section - Download All QR */}
          <div className="lg:col-span-3">
            <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card h-fit">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <QrCode className="h-5 w-5" />
                  All Files
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
                  <QrCode className="h-24 w-24 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Scan to download all video files
                  </p>
                </div>
                <Button 
                  variant="premium" 
                  className="w-full"
                  onClick={downloadAllFilesQR}
                  disabled={qrCodes.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download All QRs
                </Button>
                <div className="text-xs text-muted-foreground">
                  {qrCodes.length} files available
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section - Video Player */}
          <div className="lg:col-span-6">
            {currentVideo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Now Playing</h2>
                    <p className="text-muted-foreground">
                      Video {currentVideoIndex + 1} of {qrCodes.length}
                    </p>
                  </div>
                  {qrCodes.length > 1 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentVideoIndex((prev) => 
                          prev === 0 ? qrCodes.length - 1 : prev - 1
                        )}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentVideoIndex((prev) => 
                          (prev + 1) % qrCodes.length
                        )}
                      >
                        Next
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <VideoPlayer
                  videoUrl={currentVideo.url}
                  title={currentVideo.title}
                  onVideoEnd={handleVideoEnd}
                />
              </div>
            ) : (
              <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Videos Available</h3>
                    <p className="text-muted-foreground">
                      No video content has been added yet. Please contact the administrator to add videos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Section - Current QR Code */}
          <div className="lg:col-span-3">
            <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card h-fit">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <QrCode className="h-5 w-5" />
                  Current QR
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {currentVideo ? (
                  <>
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
                      <img 
                        src={currentVideo.qrCodeDataUrl} 
                        alt={`QR Code for ${currentVideo.title}`}
                        className="w-32 h-32 mx-auto rounded border border-border/50"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{currentVideo.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(currentVideo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="animate-pulse-glow">
                      Now Playing
                    </Badge>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => downloadQRCode(currentVideo)}
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
                    <QrCode className="h-32 w-32 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-3">
                      No video playing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Queue */}
            {qrCodes.length > 1 && (
              <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {qrCodes.map((qr, index) => (
                      <div 
                        key={qr.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          index === currentVideoIndex 
                            ? 'bg-primary/20 border border-primary/50' 
                            : 'bg-muted/20 hover:bg-muted/30'
                        }`}
                        onClick={() => setCurrentVideoIndex(index)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="text-sm truncate">{qr.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};