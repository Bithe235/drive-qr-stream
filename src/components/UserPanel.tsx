import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { getStoredQRCodes, downloadQRCode, QRCodeData } from '@/lib/qrGenerator';
import { QrCode, Download, Play, Video } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface UserPanelProps {
  onBackToLogin: () => void;
}

export const UserPanel = ({ onBackToLogin }: UserPanelProps) => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  // Removed allReelsQR state since we're using a static image

  useEffect(() => {
    loadQRCodes();
    // Removed generateAllReelsQR call since we're using a static image
  }, []);

  const loadQRCodes = async () => {
    try {
      const codes = await getStoredQRCodes();
      setQrCodes(codes);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
    }
  };

  // Removed generateAllReelsQR function since we're using a static image

  const handleVideoEnd = () => {
    if (qrCodes.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % qrCodes.length);
    }
  };

  const currentVideo = qrCodes[currentVideoIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-4 bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-primary">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                QR Reels Player
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>{qrCodes.length} videos available</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={onBackToLogin}
            >
              Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Section - All Reels QR Code */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="shadow-card bg-card">
              <CardHeader className="text-center pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  All Videos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-card rounded-2xl border border-border/30">
                  {/* Use the static QR code image from public/qrfile folder */}
                  <img 
                    src="/qrfile/frame.png" 
                    alt="All Videos QR Code"
                    className="h-32 w-32 mx-auto mb-4 rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Scan to access all video content
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  <span>{qrCodes.length} videos available</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section - Video Player */}
          <div className="lg:col-span-5 space-y-4">
            {currentVideo ? (
              <div className="space-y-4">
                {/* Video Player */}
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <VideoPlayer
                      videoUrl={currentVideo.url}
                      title={currentVideo.title}
                      onVideoEnd={handleVideoEnd}
                      isReelStyle={true}
                    />
                  </div>
                </div>

                {/* Video Info */}
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">{currentVideo.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created: {new Date(currentVideo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="p-6 rounded-full bg-gradient-primary/10 mx-auto w-fit mb-6">
                      <Video className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Videos Available</h3>
                    <p className="text-muted-foreground">
                      No video content has been added yet. Contact admin to add videos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Section - Current Video QR and Queue */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="shadow-card">
              <CardHeader className="text-center pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Current Video
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {currentVideo ? (
                  <>
                    <div className="p-4 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30">
                      <img 
                        src={currentVideo.qrCodeDataUrl} 
                        alt={`QR Code for ${currentVideo.title}`}
                        className="w-32 h-32 mx-auto rounded-xl border border-border/50"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{currentVideo.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(currentVideo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                      <Play className="h-3 w-3 mr-1" />
                      Now Playing
                    </Badge>
                  </>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30">
                    <QrCode className="h-32 w-32 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-3">
                      No video playing
                    </p>
                  </div>
                )}
              </CardContent>

              {/* Video Queue */}
              {qrCodes.length > 1 && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Queue ({qrCodes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {qrCodes.map((qr, index) => (
                        <div 
                          key={qr.id}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${
                            index === currentVideoIndex 
                              ? 'bg-gradient-primary/20 border border-primary/50' 
                              : 'bg-muted/20 hover:bg-muted/30'
                          }`}
                          onClick={() => setCurrentVideoIndex(index)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              index === currentVideoIndex 
                                ? 'bg-gradient-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {index === currentVideoIndex ? <Play className="h-3 w-3" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{qr.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Video #{index + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};