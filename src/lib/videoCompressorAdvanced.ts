// Advanced video compression using ffmpeg.wasm
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Compression options
export interface CompressionOptions {
  quality: 'low' | 'medium' | 'high'; // low = more compression, high = better quality
  maxWidth?: number;
  maxHeight?: number;
  bitrate?: string; // e.g., '1000k', '2000k'
  fps?: number; // target frames per second
}

// Compression result
export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number; // in milliseconds
}

// Global FFmpeg instance
let ffmpeg: FFmpeg | null = null;

/**
 * Initialize FFmpeg
 */
const initFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  console.log('[VideoCompressor] Initializing FFmpeg...');
  
  ffmpeg = new FFmpeg();
  
  // Load FFmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  console.log('[VideoCompressor] FFmpeg initialized');
  return ffmpeg;
};

/**
 * Compress a video file using ffmpeg.wasm
 */
export const compressVideoAdvanced = async (
  file: File,
  options: CompressionOptions = { quality: 'medium' }
): Promise<CompressionResult> => {
  const startTime = Date.now();
  
  console.log('[VideoCompressor] Starting video compression:', {
    fileName: file.name,
    originalSize: file.size,
    options
  });

  try {
    // Initialize FFmpeg
    const ffmpegInstance = await initFFmpeg();
    
    // Write input file to FFmpeg's file system
    await ffmpegInstance.writeFile('input.mp4', await fetchFile(file));
    
    // Determine compression parameters based on quality
    let videoParams = '';
    let audioParams = '';
    
    switch (options.quality) {
      case 'low':
        videoParams = '-b:v 500k -maxrate 500k -bufsize 1000k -vf scale=640:360';
        audioParams = '-b:a 64k';
        break;
      case 'medium':
        videoParams = '-b:v 1000k -maxrate 1000k -bufsize 2000k -vf scale=854:480';
        audioParams = '-b:a 96k';
        break;
      case 'high':
        videoParams = '-b:v 2000k -maxrate 2000k -bufsize 4000k -vf scale=1280:720';
        audioParams = '-b:a 128k';
        break;
    }
    
    // Add custom dimensions if specified
    if (options.maxWidth && options.maxHeight) {
      videoParams = `${videoParams} -vf scale=${options.maxWidth}:${options.maxHeight}`;
    }
    
    // Add custom bitrate if specified
    if (options.bitrate) {
      videoParams = `${videoParams} -b:v ${options.bitrate}`;
    }
    
    // Add custom FPS if specified
    if (options.fps) {
      videoParams = `${videoParams} -r ${options.fps}`;
    }
    
    // Run FFmpeg command
    console.log('[VideoCompressor] Running FFmpeg command...');
    await ffmpegInstance.exec([
      '-i', 'input.mp4',
      ...videoParams.split(' ').filter(Boolean),
      ...audioParams.split(' ').filter(Boolean),
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      '-movflags', '+faststart',
      'output.mp4'
    ]);
    
    // Read output file
    const outputData = await ffmpegInstance.readFile('output.mp4');
    
    // Convert to Blob
    const outputBlob = new Blob([outputData], { type: 'video/mp4' });
    
    // Calculate compression ratio
    const compressionRatio = parseFloat(((file.size - outputBlob.size) / file.size).toFixed(2));
    const processingTime = Date.now() - startTime;
    
    const result: CompressionResult = {
      blob: outputBlob,
      originalSize: file.size,
      compressedSize: outputBlob.size,
      compressionRatio,
      processingTime
    };

    console.log('[VideoCompressor] Video compression completed:', result);
    
    return result;
  } catch (error) {
    console.error('[VideoCompressor] Error during compression:', error);
    throw new Error(`Video compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if video compression is supported
 */
export const isCompressionSupported = (): boolean => {
  // Check for required browser features
  return typeof SharedArrayBuffer !== 'undefined' && 
         typeof WebAssembly !== 'undefined';
};

/**
 * Get video metadata using FFmpeg
 */
export const getVideoMetadata = async (file: File): Promise<{ duration: number; width: number; height: number; fps: number }> => {
  try {
    const ffmpegInstance = await initFFmpeg();
    
    // Write input file to FFmpeg's file system
    await ffmpegInstance.writeFile('input.mp4', await fetchFile(file));
    
    // Run FFprobe command to get metadata
    await ffmpegInstance.exec([
      '-i', 'input.mp4',
      '-show_entries', 'format=duration:stream=width,height,r_frame_rate',
      '-select_streams', 'v:0',
      '-of', 'json',
      'metadata.json'
    ]);
    
    // Read metadata file
    const metadataData = await ffmpegInstance.readFile('metadata.json');
    const metadataArray = new Uint8Array(metadataData as ArrayBuffer);
    const metadataText = new TextDecoder().decode(metadataArray);
    const metadata = JSON.parse(metadataText);
    
    // Parse metadata
    const duration = parseFloat(metadata.format.duration) || 0;
    const width = parseInt(metadata.streams[0].width) || 0;
    const height = parseInt(metadata.streams[0].height) || 0;
    
    // Parse FPS from r_frame_rate (format: "numerator/denominator")
    const fpsString = metadata.streams[0].r_frame_rate || '0/1';
    const [num, den] = fpsString.split('/').map(Number);
    const fps = den ? num / den : 0;
    
    return { duration, width, height, fps };
  } catch (error) {
    console.error('[VideoCompressor] Error getting video metadata:', error);
    throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};