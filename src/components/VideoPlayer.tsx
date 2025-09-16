import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { processGoogleDriveUrl } from '@/lib/qrGenerator';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  isReelStyle?: boolean;
}

export const VideoPlayer = ({ videoUrl, title, onVideoEnd, isReelStyle = false }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isGoogleDrive = videoUrl.includes('drive.google.com');
  const processedUrl = processGoogleDriveUrl(videoUrl);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);
  }, [videoUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickTime = (clickX / width) * videoRef.current.duration;
      videoRef.current.currentTime = clickTime;
    }
  };

  return (
    <Card className={`glass-morphism shadow-card overflow-hidden ${isReelStyle ? 'border-0' : ''}`}>
      <div className={`relative bg-black ${isReelStyle ? 'aspect-[9/16]' : 'aspect-video'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {isGoogleDrive ? (
          <iframe
            ref={iframeRef}
            src={processedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            title={title}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onLoadedData={() => setIsLoading(false)}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                onVideoEnd?.();
              }}
              onError={() => setIsLoading(false)}
              playsInline
              webkit-playsinline="true"
            />
            
            {/* Enhanced Controls for Reel Style */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isReelStyle ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size={isReelStyle ? "sm" : "icon"}
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isPlaying ? <Pause className={`${isReelStyle ? 'h-4 w-4' : 'h-5 w-5'}`} /> : <Play className={`${isReelStyle ? 'h-4 w-4' : 'h-5 w-5'}`} />}
                </Button>
                
                <Button
                  variant="ghost"
                  size={isReelStyle ? "sm" : "icon"}
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX className={`${isReelStyle ? 'h-4 w-4' : 'h-5 w-5'}`} /> : <Volume2 className={`${isReelStyle ? 'h-4 w-4' : 'h-5 w-5'}`} />}
                </Button>

                <div 
                  className="flex-1 h-2 bg-white/30 rounded-full cursor-pointer backdrop-blur-sm"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-100 shadow-glow"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {!isReelStyle && (
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isGoogleDrive ? 'Google Drive Video' : 'Direct Video'}
          </p>
        </div>
      )}
    </Card>
  );
};