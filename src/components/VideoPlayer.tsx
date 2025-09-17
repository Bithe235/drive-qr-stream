import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { generateGoogleDriveEmbedUrl, processGoogleDriveUrl, generateMegaEmbedUrl } from '@/lib/qrGenerator';

// Function to transform Appwrite URLs for proper playback
export const transformAppwriteUrlForPlayback = (url: string): string => {
  // If it's already in the correct view format with project parameter, return as-is
  if (url.includes('/view?project=')) {
    return url;
  }
  
  // If it's a download URL, transform it to view URL with project parameter
  if (url.includes('/download')) {
    // Replace /download with /view and add project parameter
    const viewUrl = url.replace('/download', '/view');
    const projectParam = `project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    
    // Add project parameter
    if (viewUrl.includes('?')) {
      return `${viewUrl}&${projectParam}`;
    } else {
      return `${viewUrl}?${projectParam}`;
    }
  }
  
  // If it's a view URL but missing project parameter, add it
  if (url.includes('/view') && !url.includes('project=')) {
    const projectParam = `project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    
    if (url.includes('?')) {
      return `${url}&${projectParam}`;
    } else {
      return `${url}?${projectParam}`;
    }
  }
  
  // Return URL as-is if no transformation needed
  return url;
};

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  isReelStyle?: boolean;
  autoPlay?: boolean;
}

export const VideoPlayer = ({ videoUrl, title, onVideoEnd, isReelStyle = false, autoPlay = true }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null); // Add error state
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isGoogleDrive = videoUrl.includes('drive.google.com');
  const isAppwriteVideo = videoUrl.includes('appwrite.io/v1/storage');
  const isMegaVideo = videoUrl.includes('mega.nz'); // Add Mega.nz detection
  const isIframeVideo = isGoogleDrive || isMegaVideo; // Define iframe video check early
  
  // Transform Appwrite URLs to use the view endpoint with project parameter for proper playback
  const processedUrl = isGoogleDrive 
    ? generateGoogleDriveEmbedUrl(videoUrl)
    : isAppwriteVideo
      ? transformAppwriteUrlForPlayback(videoUrl)
      : isMegaVideo
        ? generateMegaEmbedUrl(videoUrl) // Add Mega.nz URL processing
        : videoUrl;

  // Log the video URL for debugging
  useEffect(() => {
    console.log('VideoPlayer: videoUrl=', videoUrl);
    console.log('VideoPlayer: isGoogleDrive=', isGoogleDrive);
    console.log('VideoPlayer: isAppwriteVideo=', isAppwriteVideo);
    console.log('VideoPlayer: processedUrl=', processedUrl);
    setError(null); // Reset error when URL changes
  }, [videoUrl, isGoogleDrive, isAppwriteVideo, processedUrl]);

  useEffect(() => {
    setIsLoading(true);
    setError(null); // Reset error when URL changes
  }, [videoUrl]);

  // Handle volume changes for direct videos
  useEffect(() => {
    // Update condition to exclude iframe videos
    if (isIframeVideo || !videoRef.current) return;
    
    videoRef.current.volume = isMuted ? 0 : volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted, isIframeVideo]);

  // Simplified iframe loading handling with video end detection
  useEffect(() => {
    // Update condition to include Mega.nz videos
    if ((!isGoogleDrive && !isMegaVideo) || !onVideoEnd) return;

    const handleIframeLoad = () => {
      console.log('Iframe loaded successfully');
      setIsLoading(false);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
    }

    // Set a timeout to simulate video end (since we can't detect iframe video end directly)
    // Using a more reasonable default of 30 seconds for video duration
    timeoutRef.current = setTimeout(() => {
      console.log("Iframe video timeout reached, triggering next video");
      onVideoEnd();
    }, 30000); // 30 seconds default

    // Set a timeout to mark as loaded even if the load event doesn't fire
    loadTimerRef.current = setTimeout(() => {
      console.log('Iframe load timeout reached');
      setIsLoading(false);
    }, 3000);

    // Cleanup function
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
    };
  }, [isGoogleDrive, isMegaVideo, onVideoEnd, videoUrl]); // Add isMegaVideo to dependencies

  // Handle direct video playback (Appwrite videos or direct video URLs)
  useEffect(() => {
    // Update condition to exclude Mega.nz videos
    if (isGoogleDrive || isMegaVideo || !onVideoEnd) return;

    const video = videoRef.current;
    let loadTimeout: NodeJS.Timeout;
    
    if (video) {
      const handleVideoEnd = () => {
        console.log("Direct video ended, triggering next video");
        onVideoEnd();
      };

      const handleLoadedData = () => {
        console.log("Video loaded data successfully");
        setIsLoading(false);
        setError(null);
        // Clear the timeout when video loads successfully
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
      };

      const handleCanPlay = () => {
        console.log("Video can play");
        // Try to play the video automatically if autoplay is enabled
        if (autoPlay && video.paused) {
          video.play().catch(err => {
            console.log("Auto play failed:", err);
          });
        }
      };

      const handleCanPlayThrough = () => {
        console.log("Video can play through");
        setIsLoading(false);
        setError(null);
        // Clear the timeout when video loads successfully
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
      };

      const handleError = (e: any) => {
        console.error("Video error:", e);
        console.error("Video error code:", e.target?.error?.code);
        console.error("Video error message:", e.target?.error?.message);
        console.error("Video src:", e.target?.src);
        
        // Clear the timeout when an error occurs
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        
        // Set error state
        setError(`Video failed to load: ${e.target?.error?.message || 'Unknown error'}`);
        setIsLoading(false);
        
        // Try to reload the video once
        if (e.target?.error?.code === e.target?.error?.MEDIA_ERR_NETWORK) {
          console.log("Attempting to reload video due to network error");
          // Reset loading state and try again
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load();
            }
          }, 1000);
        }
      };

      const handleLoadStart = () => {
        console.log("Video load start");
        // Only set loading if we're not already in an error state
        if (!error) {
          setIsLoading(true);
        }
      };

      const handleLoadedMetadata = () => {
        console.log("Video loaded metadata");
      };

      // Set a timeout to prevent indefinite loading
      loadTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn("Video loading timeout - setting error state");
          setError("Video took too long to load");
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      // Add all event listeners
      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      // Cleanup
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
      };
    }
  }, [isGoogleDrive, isMegaVideo, onVideoEnd, videoUrl, autoPlay, error, isLoading]); // Add isMegaVideo to dependencies

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleMute = () => {
    // Update condition to exclude iframe videos (Google Drive and Mega.nz)
    if (isIframeVideo || !videoRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      setPreviousVolume(volume);
      setVolume(0);
    } else {
      setVolume(previousVolume || 1);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    // Update condition to exclude iframe videos
    if (isIframeVideo) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Failed to exit fullscreen:', err);
      });
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <Card className={`glass-morphism shadow-card overflow-hidden ${isReelStyle ? 'border-0' : ''}`}>
      <div 
        ref={containerRef}
        className={`relative bg-black ${isReelStyle ? 'aspect-[9/16]' : 'aspect-video'}`}
        onMouseEnter={showControlsTemporarily}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => {
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          setShowControls(false);
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="ml-4 text-white">Loading video...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center p-4 bg-black/70 rounded-lg max-w-md">
              <div className="text-red-500 font-semibold mb-2">Video Error</div>
              <div className="text-white text-sm mb-4">{error}</div>
              <div className="text-gray-300 text-xs">
                URL: {processedUrl.substring(0, 60)}{processedUrl.length > 60 ? '...' : ''}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 text-white border-white hover:bg-white hover:text-black"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {isIframeVideo ? (
          <div className="video-iframe-container">
            <iframe
              ref={iframeRef}
              src={processedUrl}
              className="video-iframe"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              onLoad={() => {
                // Set loading to false when iframe loads
                console.log('Iframe onLoad triggered');
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
              src={processedUrl}
              className="w-full h-full object-cover"
              onLoadedData={() => {
                console.log("Video onLoadedData triggered");
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error("Video onError triggered:", e);
                console.error("Video error details:", {
                  src: (e.target as HTMLVideoElement)?.src,
                  error: (e.target as HTMLVideoElement)?.error
                });
                setIsLoading(false);
              }}
              onCanPlay={() => {
                console.log("Video can play");
              }}
              onCanPlayThrough={() => {
                console.log("Video can play through");
              }}
              onLoadStart={() => {
                console.log("Video load start");
              }}
              onLoadedMetadata={() => {
                console.log("Video loaded metadata");
              }}
              playsInline
              webkit-playsinline="true"
              controls={false}
              autoPlay={autoPlay}
              muted={isMuted}
            />

          </>
        )}

        {/* Video Controls Overlay */}
        {!isIframeVideo && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  className="w-24"
                  onValueChange={handleVolumeChange}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {!isReelStyle && (
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isGoogleDrive ? 'Google Drive Video' : isMegaVideo ? 'Mega.nz Video' : isAppwriteVideo ? 'Appwrite Hosted Video' : 'Direct Video'}
          </p>
        </div>
      )}
    </Card>
  );
};