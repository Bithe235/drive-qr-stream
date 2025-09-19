import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode, saveQRCode, getStoredQRCodes, deleteQRCode, downloadQRCode, QRCodeData, uploadVideoAndGenerateQR } from '@/lib/qrGenerator';
import { QrCode, Upload, FileVideo, Download, Trash2, Server } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { compressVideoAdvanced, isCompressionSupported } from '@/lib/videoCompressorAdvanced';

// Define storage server options
type StorageServer = 'primary' | 'fallback1' | 'fallback2' | 'fallback3' | 'fallback4' | 'fallback5' | 'fallback6';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel = ({ onLogout }: AdminPanelProps) => {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ originalSize: number; compressedSize: number; ratio: number; time: number } | null>(null);
  const [compressionSupported, setCompressionSupported] = useState(true);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [selectedStorageServer, setSelectedStorageServer] = useState<StorageServer>('primary');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if storage server selection feature is enabled
  const isStorageServerSelectionEnabled = import.meta.env.VITE_ENABLE_STORAGE_SERVER_SELECTION === 'true';

  useEffect(() => {
    // Check if compression is supported
    setCompressionSupported(isCompressionSupported());
    
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      const codes = await getStoredQRCodes();
      setQrCodes(codes);
    } catch (error) {
      console.error('Error loading QR codes:', error);
      toast({
        title: "Load Error",
        description: "Failed to load QR codes",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setCompressionInfo(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setCompressionInfo(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file",
          variant: "destructive",
        });
      }
    }
  };

  // Add function to compress video
  const compressVideoFile = async (file: File): Promise<File> => {
    if (!compressionSupported) {
      console.log('Video compression not supported, uploading original file');
      return file;
    }
    
    setIsCompressing(true);
    try {
      console.log('Compressing video file:', file.name);
      
      // Compress the video with advanced compression
      const result = await compressVideoAdvanced(file, {
        quality: file.size > 20 * 1024 * 1024 ? 'low' : 'medium', // Use low quality for large files
        maxWidth: 1280,
        maxHeight: 720
      });
      
      // Create a new File object from the compressed blob
      const compressedFile = new File([result.blob], `compressed_${file.name}`, {
        type: 'video/mp4',
        lastModified: Date.now()
      });
      
      // Set compression info for display
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        ratio: result.compressionRatio,
        time: result.processingTime
      });
      
      console.log('Video compression completed:', {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        processingTime: result.processingTime
      });
      
      return compressedFile;
    } catch (error) {
      console.error('Error compressing video:', error);
      toast({
        title: "Compression Error",
        description: "Failed to compress video. Uploading original file.",
        variant: "destructive",
      });
      return file; // Return original file if compression fails
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile || !title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a title and select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Compress the video before uploading
      let fileToUpload = videoFile;
      if (videoFile.size > 5 * 1024 * 1024) { // Only compress if larger than 5MB
        console.log('Video is larger than 5MB, compressing...');
        fileToUpload = await compressVideoFile(videoFile);
      }
      
      // Upload video and generate QR code with progress tracking
      // Pass the selected storage server as an option only if the feature is enabled
      const qrData = await uploadVideoAndGenerateQR(
        fileToUpload, 
        title, 
        (progress) => {
          setUploadProgress(progress);
        }, 
        isStorageServerSelectionEnabled ? selectedStorageServer : undefined
      );
      await loadQRCodes();
      
      // Reset form
      setTitle('');
      setVideoFile(null);
      setCompressionInfo(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Video Uploaded & QR Generated",
        description: isStorageServerSelectionEnabled 
          ? `Video has been uploaded to ${selectedStorageServer} server and QR code generated successfully`
          : "Video has been uploaded and QR code generated successfully",
      });
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video or generate QR code. Please try again.",
        variant: "destructive",
      });
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string, fileUrl?: string) => {
    try {
      await deleteQRCode(id, fileUrl);
      await loadQRCodes();
      toast({
        title: "QR Code Deleted",
        description: "QR code has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Failed to delete QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (qrData: QRCodeData) => {
    downloadQRCode(qrData);
    toast({
      title: "Download Started",
      description: "QR code image is being downloaded",
    });
  };

  // Get server display name
  const getServerDisplayName = (server: StorageServer) => {
    switch (server) {
      case 'primary': return 'Primary Server';
      case 'fallback1': return 'First Fallback Server';
      case 'fallback2': return 'Second Fallback Server';
      case 'fallback3': return 'Third Fallback Server';
      case 'fallback4': return 'Fourth Fallback Server';
      case 'fallback5': return 'Fifth Fallback Server';
      case 'fallback6': return 'Sixth Fallback Server';
      default: return 'Primary Server';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <QrCode className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">QR Drive Admin Panel</h1>
              <p className="text-muted-foreground">Upload videos and generate QR codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Storage Server Selection Card - FOR TESTING ONLY */}
        {isStorageServerSelectionEnabled && (
          <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-500">
                <Server className="h-5 w-5" />
                Storage Server Selection (TESTING ONLY)
              </CardTitle>
              <CardDescription>
                Select which storage server to use for uploads. This feature is for testing purposes only and should be removed in production.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="storageServer" className="w-32">Storage Server:</Label>
                  <Select value={selectedStorageServer} onValueChange={(value: StorageServer) => setSelectedStorageServer(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select server" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary Server</SelectItem>
                      <SelectItem value="fallback1">First Fallback Server</SelectItem>
                      <SelectItem value="fallback2">Second Fallback Server</SelectItem>
                      <SelectItem value="fallback3">Third Fallback Server</SelectItem>
                      <SelectItem value="fallback4">Fourth Fallback Server</SelectItem>
                      <SelectItem value="fallback5">Fifth Fallback Server</SelectItem>
                      <SelectItem value="fallback6">Sixth Fallback Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Currently selected: <span className="font-medium">{getServerDisplayName(selectedStorageServer)}</span></p>
                  <p className="mt-1 text-yellow-500">⚠️ This is a testing feature only. Remove before production deployment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Video Card */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Video & Generate QR Code
            </CardTitle>
            <CardDescription>
              Upload a video file and automatically generate a QR code for it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="videoTitle">Video Title</Label>
              <Input
                id="videoTitle"
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input/50 border-border/50 focus:border-primary"
                required
              />
            </div>
            
            <div 
              className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {videoFile ? videoFile.name : "Drag & drop a video file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : "or click to browse files"}
                  </p>
                  {compressionInfo && (
                    <div className="text-sm text-green-500 mt-2">
                      Compressed: {((compressionInfo.originalSize - compressionInfo.compressedSize) / 1024 / 1024).toFixed(2)} MB saved 
                      ({compressionInfo.ratio * 100}% reduction)
                    </div>
                  )}
                </div>
                {videoFile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                      setCompressionInfo(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Remove File
                  </Button>
                )}
              </div>
            </div>
            
            {/* Show compression progress */}
            {isCompressing && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: '70%' }} // Simulate progress
                ></div>
              </div>
            )}
            
            {/* Show upload progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {isStorageServerSelectionEnabled 
                    ? `Uploading to ${getServerDisplayName(selectedStorageServer)}... ${uploadProgress}%`
                    : `Uploading... ${uploadProgress}%`}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleUploadVideo} 
              variant="premium" 
              size="lg" 
              className="w-full"
              disabled={isUploading || isCompressing || !videoFile}
            >
              {isCompressing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Compressing...
                </>
              ) : isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  {isStorageServerSelectionEnabled 
                    ? `Uploading to ${getServerDisplayName(selectedStorageServer)}...`
                    : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video & Generate QR
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* QR Codes Table */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              Generated QR Codes ({qrCodes.length})
            </CardTitle>
            <CardDescription>
              Manage your created QR codes and video content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No QR codes generated yet</p>
                <p className="text-sm">Upload your first video to generate a QR code</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qrCodes.map((qr) => (
                      <TableRow key={qr.id}>
                        <TableCell>
                          <img 
                            src={qr.qrCodeDataUrl} 
                            alt={`QR Code for ${qr.title}`}
                            className="w-16 h-16 rounded border border-border/50"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{qr.title}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {qr.url}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(qr.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(qr.url, '_blank')}
                              title="View Video"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(qr)}
                              title="Download QR Code"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(qr.id, qr.url)}
                              title="Delete QR Code"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};