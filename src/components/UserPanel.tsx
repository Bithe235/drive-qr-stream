import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { ThemeToggle } from './ThemeToggle';
import { getStoredQRCodes, downloadQRCode, QRCodeData, generateQRCode } from '@/lib/qrGenerator';
import { QrCode, Download, Play, Settings, ArrowLeft, Zap, Users, TrendingUp, Video, Music } from 'lucide-react';

interface UserPanelProps {
  onBackToLogin: () => void;
}

export const UserPanel = ({ onBackToLogin }: UserPanelProps) => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allReelsQR, setAllReelsQR] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState<boolean>(false);

  useEffect(() => {
    loadQRCodes();
    // Generate QR code for all reels folder
    generateAllReelsQR();
  }, []);

  const loadQRCodes = async () => {
    try {
      const codes = await getStoredQRCodes();
      setQrCodes(codes);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
    }
  };

  const generateAllReelsQR = async () => {
    setIsGeneratingQR(true);
    try {
      // Using the provided Google Drive folder link
      const folderUrl = "https://drive.google.com/drive/folders/1GQI87bJ5YqKH8cZMZPTtvbD4uuZfw2pD?usp=drive_link";
      const qrData = await generateQRCode(folderUrl, "All Reels Folder");
      setAllReelsQR(qrData.qrCodeDataUrl);
    } catch (error) {
      console.error("Failed to generate QR code for all reels:", error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleVideoEnd = () => {
    if (qrCodes.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % qrCodes.length);
    }
  };

  const currentVideo = qrCodes[currentVideoIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header with Glassmorphism */}
      <div className="glass-morphism sticky top-0 z-50 border-b border-border/50 px-4 py-4 bg-card">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-primary animate-glow-pulse">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="animate-slide-in-up">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                QR Reels Player
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{qrCodes.length} reels available</span>
                <TrendingUp className="h-4 w-4 ml-2" />
                <span>Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={onBackToLogin}
              className="modern-hover group"
            >
              <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left-Middle Section - All Reels Section (spanning more columns) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="glass-morphism shadow-card modern-hover animate-slide-in-up bg-card">
              <CardHeader className="text-center pb-3 bg-card">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  All Reels
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 bg-card">
                <div className="p-6 bg-card rounded-2xl border border-border/30 animate-shimmer">
                  {isGeneratingQR ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : allReelsQR ? (
                    <img 
                      src={allReelsQR} 
                      alt="All Reels QR Code"
                      className="h-32 w-32 mx-auto mb-4 rounded-lg color-palette-2xl"
                    />
                  ) : (
                    <QrCode className="h-32 w-32 mx-auto mb-4 text-primary animate-float color-palette-2xl" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    Scan to access all video content
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  <span>{qrCodes.length} reels available</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section - Video Player (Now Playing) */}
          <div className="lg:col-span-5 space-y-4">
            {currentVideo ? (
              <div className="space-y-4 animate-slide-in-up">
                {/* Reel-style container with increased size */}
                <div className="flex justify-center">
                  <div className="reel-container w-full max-w-md animate-glow-pulse">
                    <VideoPlayer
                      videoUrl={currentVideo.url}
                      title={currentVideo.title}
                      onVideoEnd={handleVideoEnd}
                      isReelStyle={true}
                    />
                  </div>
                </div>

              </div>
            ) : (
              <Card className="glass-morphism shadow-card bg-card">
                <CardContent className="flex items-center justify-center h-96 bg-card">
                  <div className="text-center animate-slide-in-up">
                    <div className="p-6 rounded-full bg-gradient-primary/10 mx-auto w-fit mb-6">
                      <Video className="h-16 w-16 text-primary animate-float" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Reels Available</h3>
                    <p className="text-muted-foreground">
                      No video content has been added yet. Contact admin to add reels.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Section - Current Reel and Queue */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-morphism shadow-card modern-hover animate-slide-in-up bg-card">
              <CardHeader className="text-center pb-3 bg-card">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Current Reel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 bg-card">
                {currentVideo ? (
                  <>
                    <div className="p-4 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30 animate-shimmer">
                      <img 
                        src={currentVideo.qrCodeDataUrl} 
                        alt={`QR Code for ${currentVideo.title}`}
                        className="w-32 h-32 mx-auto rounded-xl border border-border/50 animate-float color-palette-2xl"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{currentVideo.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <Video className="h-3 w-3" />
                        Created: {new Date(currentVideo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="animate-glow-pulse bg-gradient-primary text-primary-foreground">
                      <Play className="h-3 w-3 mr-1" />
                      Now Playing
                    </Badge>
                    <Button 
                      variant="outline" 
                      className="w-full modern-hover group"
                      onClick={() => downloadQRCode(currentVideo)}
                    >
                      <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Download QR
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30">
                    <QrCode className="h-32 w-32 mx-auto text-muted-foreground opacity-50 animate-float color-palette-2xl" />
                    <p className="text-sm text-muted-foreground mt-3">
                      No reel playing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Video Queue */}
            {qrCodes.length > 1 && (
              <Card className="glass-morphism shadow-card modern-hover bg-card">
                <CardHeader className="pb-3 bg-card">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Queue ({qrCodes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-card">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {qrCodes.map((qr, index) => (
                      <div 
                        key={qr.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-300 modern-hover ${
                          index === currentVideoIndex 
                            ? 'bg-gradient-primary/20 border border-primary/50 shadow-glow' 
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
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              Reel #{index + 1}
                            </div>
                          </div>
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