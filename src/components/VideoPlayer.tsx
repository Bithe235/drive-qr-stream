import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { generateGoogleDriveEmbedUrl, processGoogleDriveUrl, generateMegaEmbedUrl } from '@/lib/qrGenerator';
import { getCachedVideoUrl } from '../lib/videoCache';

// Function to transform Appwrite URLs for proper playback
export const transformAppwriteUrlForPlayback = (url: string): string => {
  // If it's already in the correct view format with project parameter, return as-is
  if (url.includes('/view?project=')) {
    return url;
  }
  
  // Extract project ID from the URL if present
  let projectId = '68ca9e8e000ddba95beb'; // Default project ID
  
  // Try to extract project ID from URL parameters
  try {
    const urlObj1 = new URL(url, window.location.origin);
    if (urlObj1.searchParams.has('project')) {
      projectId = urlObj1.searchParams.get('project') || projectId;
    }
  } catch (e) {
    // If URL parsing fails, use default project ID
    console.warn('Failed to parse URL for project ID:', url);
  }
  
  // If it's a download URL, transform it to view URL with project parameter
  if (url.includes('/download')) {
    // Replace /download with /view and ensure project parameter
    let viewUrl = url.replace('/download', '/view');
    
    // Add or update project parameter
    try {
      const urlObj2 = new URL(viewUrl, window.location.origin);
      urlObj2.searchParams.set('project', projectId);
      return urlObj2.toString();
    } catch (e) {
      // If URL parsing fails, append project parameter manually
      return viewUrl.includes('?') 
        ? `${viewUrl}&project=${projectId}` 
        : `${viewUrl}?project=${projectId}`;
    }
  }
  
  // If it's a view URL but missing project parameter, add it
  if (url.includes('/view')) {
    try {
      const urlObj3 = new URL(url, window.location.origin);
      urlObj3.searchParams.set('project', projectId);
      return urlObj3.toString();
    } catch (e) {
      // If URL parsing fails, append project parameter manually
      return url.includes('?') 
        ? `${url}&project=${projectId}` 
        : `${url}?project=${projectId}`;
    }
  }
  
  // For other URLs, ensure they have the project parameter
  try {
    const urlObj4 = new URL(url, window.location.origin);
    urlObj4.searchParams.set('project', projectId);
    return urlObj4.toString();
  } catch (e) {
    // If URL parsing fails, append project parameter manually
    return url.includes('?') 
      ? `${url}&project=${projectId}` 
      : `${url}?project=${projectId}`;
  }
};

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onVideoEnd?: () => void;
  isReelStyle?: boolean;
  autoPlay?: boolean;
  videoId?: string; // Add videoId for caching
}

export const VideoPlayer = ({ videoUrl, title, onVideoEnd, isReelStyle = false, autoPlay = true, videoId }: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveVideoUrl, setEffectiveVideoUrl] = useState<string>(videoUrl); // Add state for effective URL
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isGoogleDrive = videoUrl.includes('drive.google.com');
  const isAppwriteVideo = videoUrl.includes('appwrite.io/v1/storage');
  const isMegaVideo = videoUrl.includes('mega.nz');
  const isIframeVideo = isGoogleDrive || isMegaVideo;
  
  // Transform Appwrite URLs to use the view endpoint with project parameter for proper playback
  const processedUrl = isGoogleDrive 
    ? generateGoogleDriveEmbedUrl(videoUrl)
    : isAppwriteVideo
      ? transformAppwriteUrlForPlayback(videoUrl)
      : isMegaVideo
        ? generateMegaEmbedUrl(videoUrl)
        : videoUrl;

  // Log the video URL for debugging
  useEffect(() => {
    console.log('VideoPlayer: videoUrl=', videoUrl);
    console.log('VideoPlayer: isGoogleDrive=', isGoogleDrive);
    console.log('VideoPlayer: isAppwriteVideo=', isAppwriteVideo);
    console.log('VideoPlayer: processedUrl=', processedUrl);
    setError(null); // Reset error when URL changes
  }, [videoUrl, isGoogleDrive, isAppwriteVideo, processedUrl]);

  // Handle caching for Appwrite videos
  useEffect(() => {
    const handleCaching = async () => {
      // Only cache Appwrite videos that have a videoId
      if (isAppwriteVideo && videoId) {
        try {
          console.log('Checking cache for video:', { videoId, processedUrl });
          const cachedUrl = await getCachedVideoUrl(videoId, processedUrl);
          if (cachedUrl) {
            console.log('Using cached video:', videoId, cachedUrl);
            setEffectiveVideoUrl(cachedUrl);
          } else {
            console.log('Using original video URL:', processedUrl);
            setEffectiveVideoUrl(processedUrl);
          }
        } catch (e) {
          console.error('Error handling video cache:', e);
          setEffectiveVideoUrl(processedUrl);
        }
      } else {
        setEffectiveVideoUrl(processedUrl);
      }
    };

    handleCaching();
  }, [videoUrl, isAppwriteVideo, videoId, processedUrl]);

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
    // Using a more reasonable default of 60 seconds for video duration
    timeoutRef.current = setTimeout(() => {
      console.log("Iframe video timeout reached, triggering next video");
      onVideoEnd();
    }, 60000); // 60 seconds default (increased from 30 seconds)

    // Set a timeout to mark as loaded even if the load event doesn't fire
    // Increased from 3 seconds to 10 seconds for slower connections
    loadTimerRef.current = setTimeout(() => {
      console.log('Iframe load timeout reached');
      setIsLoading(false);
    }, 10000); // 10 seconds (increased from 3 seconds)

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
    let retryCount = 0;
    const maxRetries = 2;
    
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
        
        // Try to reload the video if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Attempting to reload video (attempt ${retryCount}/${maxRetries})`);
          setError(`Video loading failed, retrying... (${retryCount}/${maxRetries})`);
          
          // Reset loading state and try again after a short delay
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load();
            }
          }, 1500);
          return;
        }
        
        // Set error state after max retries
        const errorMessage = e.target?.error?.message || 'Unknown error';
        setError(`Video failed to load after ${maxRetries} attempts: ${errorMessage}`);
        setIsLoading(false);
      };

      const handleLoadStart = () => {
        console.log("Video load start");
        // Only set loading if we're not already in an error state
        if (!error || retryCount > 0) {
          setIsLoading(true);
        }
      };

      const handleLoadedMetadata = () => {
        console.log("Video loaded metadata");
      };

      const handleStalled = () => {
        console.log("Video stalled");
      };

      const handleWaiting = () => {
        console.log("Video waiting for data");
      };

      // Set a longer timeout to prevent indefinite loading (increased from 10s to 30s)
      loadTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn("Video loading timeout - setting error state");
          setError("Video took too long to load (30 second timeout). This may be due to a slow network connection or a large file size.");
          setIsLoading(false);
        }
      }, 30000); // 30 second timeout (increased from 10 seconds)

      // Add all event listeners
      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('stalled', handleStalled);
      video.addEventListener('waiting', handleWaiting);

      // Cleanup
      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('stalled', handleStalled);
        video.removeEventListener('waiting', handleWaiting);
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        // Revoke blob URL to free memory
        if (effectiveVideoUrl !== videoUrl && effectiveVideoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(effectiveVideoUrl);
        }
      };
    }
  }, [isGoogleDrive, isMegaVideo, onVideoEnd, effectiveVideoUrl, autoPlay, error, isLoading, videoUrl]); // Add isMegaVideo to dependencies

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
              <div className="text-gray-300 text-xs mb-3">
                URL: {processedUrl.substring(0, 60)}{processedUrl.length > 60 ? '...' : ''}
              </div>
              <div className="text-gray-400 text-xs mb-4">
                {isAppwriteVideo 
                  ? "This may be due to a slow network connection, a large file size, or temporary server issues."
                  : "This may be due to network issues or the video source being unavailable."
                }
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
              src={effectiveVideoUrl} // Use the effective URL (cached or original)
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
            {videoId && isAppwriteVideo && ' (Cached)' // Show cached status
}
          </p>
        </div>
      )}
    </Card>
  );
};