import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { ThemeToggle } from './ThemeToggle';
import { getStoredQRCodes, downloadQRCode, QRCodeData } from '@/lib/qrGenerator';
import { QrCode, Download, Play, Settings, ArrowLeft, Zap, Users, TrendingUp, Video, Music, Heart, Share, MessageCircle, Bookmark } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-dark dark:bg-gradient-dark bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header with Glassmorphism */}
      <div className="glass-morphism sticky top-0 z-50 border-b border-border/50 px-4 py-4">
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
          {/* Left Section - Enhanced with modern icons */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-morphism shadow-card modern-hover animate-slide-in-up">
              <CardHeader className="text-center pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  All Reels
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30 animate-shimmer">
                  <QrCode className="h-20 w-20 mx-auto mb-4 text-primary animate-float" />
                  <p className="text-sm text-muted-foreground">
                    Scan to access all video content
                  </p>
                </div>
                <Button 
                  variant="premium" 
                  className="w-full group"
                  onClick={downloadAllFilesQR}
                  disabled={qrCodes.length === 0}
                >
                  <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Download All QRs
                  <Zap className="h-4 w-4 ml-1" />
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Video className="h-3 w-3" />
                  <span>{qrCodes.length} reels available</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats Card */}
            <Card className="glass-morphism shadow-card modern-hover">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Heart className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-sm font-semibold">1.2K</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Share className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-sm font-semibold">89</div>
                    <div className="text-xs text-muted-foreground">Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section - Reel-style Video Player */}
          <div className="lg:col-span-6">
            {currentVideo ? (
              <div className="space-y-4 animate-slide-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-primary animate-glow-pulse">
                      <Play className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Now Playing</h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Music className="h-4 w-4" />
                        <span>Reel {currentVideoIndex + 1} of {qrCodes.length}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs">LIVE</span>
                      </div>
                    </div>
                  </div>
                  {qrCodes.length > 1 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentVideoIndex((prev) => 
                          prev === 0 ? qrCodes.length - 1 : prev - 1
                        )}
                        className="modern-hover"
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
                        className="modern-hover"
                      >
                        Next
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Reel-style container */}
                <div className="flex justify-center">
                  <div className="reel-container w-full max-w-sm animate-glow-pulse">
                    <VideoPlayer
                      videoUrl={currentVideo.url}
                      title={currentVideo.title}
                      onVideoEnd={handleVideoEnd}
                      isReelStyle={true}
                    />
                  </div>
                </div>

                {/* Reel-style Action Buttons */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-6 p-4 glass-morphism rounded-2xl">
                    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto p-3 modern-hover">
                      <Heart className="h-5 w-5" />
                      <span className="text-xs">Like</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto p-3 modern-hover">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-xs">Comment</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto p-3 modern-hover">
                      <Share className="h-5 w-5" />
                      <span className="text-xs">Share</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto p-3 modern-hover">
                      <Bookmark className="h-5 w-5" />
                      <span className="text-xs">Save</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="glass-morphism shadow-card">
                <CardContent className="flex items-center justify-center h-96">
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

          {/* Right Section - Enhanced Current QR */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-morphism shadow-card modern-hover animate-slide-in-up">
              <CardHeader className="text-center pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-lg">
                  <div className="p-2 rounded-full bg-gradient-primary">
                    <QrCode className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Current Reel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {currentVideo ? (
                  <>
                    <div className="p-4 bg-gradient-to-br from-muted/30 to-accent/20 rounded-2xl border border-border/30 animate-shimmer">
                      <img 
                        src={currentVideo.qrCodeDataUrl} 
                        alt={`QR Code for ${currentVideo.title}`}
                        className="w-32 h-32 mx-auto rounded-xl border border-border/50 animate-float"
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
                    <QrCode className="h-32 w-32 mx-auto text-muted-foreground opacity-50 animate-float" />
                    <p className="text-sm text-muted-foreground mt-3">
                      No reel playing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Video Queue */}
            {qrCodes.length > 1 && (
              <Card className="glass-morphism shadow-card modern-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Queue ({qrCodes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
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