import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { generateGoogleDriveEmbedUrl, processGoogleDriveUrl } from '@/lib/qrGenerator';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  isReelStyle?: boolean;
  autoPlay?: boolean;
}

export const VideoPlayer = ({ videoUrl, title, onVideoEnd, isReelStyle = false, autoPlay = true }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isGoogleDrive = videoUrl.includes('drive.google.com');
  const processedUrl = isGoogleDrive ? generateGoogleDriveEmbedUrl(videoUrl) : processGoogleDriveUrl(videoUrl);

  useEffect(() => {
    setIsLoading(true);
  }, [videoUrl]);

  // Add effect to auto-play when video is loaded
  useEffect(() => {
    if (!autoPlay) return;

    const playVideo = async () => {
      try {
        // For direct video files
        if (!isGoogleDrive && videoRef.current) {
          // Wait for video to be ready
          if (videoRef.current.readyState >= 2) {
            await videoRef.current.play();
          } else {
            videoRef.current.addEventListener('canplay', async () => {
              await videoRef.current?.play();
            }, { once: true });
          }
        }
        // For Google Drive iframe videos, autoplay is handled by the iframe parameters
      } catch (error) {
        console.log("Autoplay failed:", error);
      }
    };
    
    // Small delay to ensure video is ready
    const timer = setTimeout(playVideo, 500);
    return () => clearTimeout(timer);
  }, [videoUrl, autoPlay, isGoogleDrive]);

  // Handle iframe video end detection with improved timing
  useEffect(() => {
    if (!isGoogleDrive || !onVideoEnd) return;

    let timeoutId: NodeJS.Timeout;
    let loadTimer: NodeJS.Timeout;

    const handleIframeLoad = () => {
      // Remove any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Also clear the load timer
      if (loadTimer) {
        clearTimeout(loadTimer);
      }
      
      // Set loading to false immediately when iframe loads
      setIsLoading(false);
      
      // Set a timeout to simulate video end (since we can't detect iframe video end directly)
      // We'll use a more reasonable default of 30 seconds for video duration
      timeoutId = setTimeout(() => {
        onVideoEnd();
      }, 30000); // 30 seconds default
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      
      // Set a timeout to mark as loaded even if the load event doesn't fire
      loadTimer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }

    // Cleanup function
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (loadTimer) {
        clearTimeout(loadTimer);
      }
    };
  }, [isGoogleDrive, onVideoEnd, videoUrl]);

  return (
    <Card className={`glass-morphism shadow-card overflow-hidden ${isReelStyle ? 'border-0' : ''}`}>
      <div className={`relative bg-black ${isReelStyle ? 'aspect-[9/16]' : 'aspect-video'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {isGoogleDrive ? (
          <div className="video-iframe-container">
            <iframe
              ref={iframeRef}
              src={processedUrl}
              className="video-iframe"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                // Set loading to false when iframe loads
                setIsLoading(false);
              }}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onLoadedData={() => setIsLoading(false)}
              onEnded={() => {
                onVideoEnd?.();
              }}
              onError={() => setIsLoading(false)}
              playsInline
              webkit-playsinline="true"
            />
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