import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode, saveQRCode, getStoredQRCodes, deleteQRCode, downloadQRCode, QRCodeData } from '@/lib/qrGenerator';
import { QrCode, Plus, Download, Trash2, LogOut, Eye, Video } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel = ({ onLogout }: AdminPanelProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setQrCodes(getStoredQRCodes());
  }, []);

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and URL fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const qrData = await generateQRCode(url, title);
      saveQRCode(qrData);
      setQrCodes(getStoredQRCodes());
      setTitle('');
      setUrl('');
      
      toast({
        title: "QR Code Generated",
        description: "QR code has been successfully created and saved",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const handleDelete = (id: string) => {
    deleteQRCode(id);
    setQrCodes(getStoredQRCodes());
    toast({
      title: "QR Code Deleted",
      description: "QR code has been removed successfully",
    });
  };

  const handleDownload = (qrData: QRCodeData) => {
    downloadQRCode(qrData);
    toast({
      title: "Download Started",
      description: "QR code image is being downloaded",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    onLogout();
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
              <p className="text-muted-foreground">Manage your QR codes and video content</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* QR Generator Card */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate New QR Code
            </CardTitle>
            <CardDescription>
              Create QR codes for your video content. Supports Google Drive and direct video URLs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Video URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://drive.google.com/... or direct video URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-input/50 border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                variant="premium" 
                size="lg" 
                className="w-full md:w-auto"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* QR Codes Table */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
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
                <p className="text-sm">Create your first QR code above</p>
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
                              <Eye className="h-4 w-4" />
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
                              onClick={() => handleDelete(qr.id)}
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