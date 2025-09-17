import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode, saveQRCode, getStoredQRCodes, deleteQRCode, downloadQRCode, QRCodeData, uploadVideoAndGenerateQR } from '@/lib/qrGenerator';
import { QrCode, Upload, FileVideo, Download, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel = ({ onLogout }: AdminPanelProps) => {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
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
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file",
          variant: "destructive",
        });
      }
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
    try {
      // Upload video and generate QR code
      const qrData = await uploadVideoAndGenerateQR(videoFile, title);
      await loadQRCodes();
      
      // Reset form
      setTitle('');
      setVideoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Video Uploaded & QR Generated",
        description: "Video has been uploaded and QR code generated successfully",
      });
    } catch (error: any) {
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
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>

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
                </div>
                {videoFile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
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
            
            <Button 
              onClick={handleUploadVideo} 
              variant="premium" 
              size="lg" 
              className="w-full"
              disabled={isUploading || !videoFile}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Uploading...
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