"use client"
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Upload, Loader2, FileIcon, FolderIcon, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";

interface BackendResponse {
  status: number;
  message: string;
  data: string;
}

interface UploadResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  presignedUrl: string;
  backendResponse: BackendResponse;
  uploadSuccess: boolean;
  timestamp: string;
}

interface S3Object {
  key: string;
  lastModified: string;
  size: number;
}

const FileManager: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const [s3Objects, setS3Objects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadStatus('');
    setUploadResult(null);
    setError('');
  };

  const getPresignedUrl = async (fileName: string): Promise<BackendResponse> => {
    try {
      const response = await fetch(`http://localhost:3000/api/upload?key=${encodeURIComponent(fileName)}`);
      console.log("Response : ",response)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: BackendResponse = await response.json();
      
      if (result.status !== 200) {
        throw new Error(result.message || 'Failed to get presigned URL');
      }
      
      return result;
    } catch (err) {
      throw new Error(`Error getting presigned URL: ${(err as Error).message}`);
    }
  };

  const uploadFileToS3 = async (presignedUrl: string, file: File): Promise<boolean> => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      return response.ok;
    } catch (err) {
      throw new Error(`Error uploading file: ${(err as Error).message}`);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setUploadStatus('Getting presigned URL...');

    try {
      // Step 1: Get presigned URL from backend
      const presignedData = await getPresignedUrl(file.name);
      
      setUploadStatus('Uploading file...');

      // Step 2: Upload file using presigned URL
      const uploadSuccess = await uploadFileToS3(presignedData.data, file);

      if (uploadSuccess) {
        setUploadStatus('Upload completed successfully!');
        
        setUploadResult({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          presignedUrl: presignedData.data,
          backendResponse: presignedData,
          uploadSuccess: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error('Upload failed - received non-success response');
      }

    } catch (err) {
      setError((err as Error).message);
      setUploadStatus('');
    } finally {
      setUploading(false);
    }
  };

  const fetchS3Objects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/objects');
      const data = await response.json();
      if (data.status === 200) {
        setS3Objects(data.data);
      }
    } catch (error) {
      console.error('Error fetching S3 objects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchS3Objects();
  }, [uploadResult]); // Refresh when new file is uploaded

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetUploader = (): void => {
    setFile(null);
    setUploadStatus('');
    setUploadResult(null);
    setError('');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-medium">Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <input
                type="file"
                onChange={handleFileSelect}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-medium file:bg-secondary hover:file:bg-secondary/80"
                disabled={uploading}
              />
            </div>

            {/* File Info */}
            {file && (
              <div className="text-sm text-muted-foreground">
                <p>{file.name}</p>
                <p>{formatFileSize(file.size)}</p>
              </div>
            )}

            {/* Upload Button */}
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStatus}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>

            {/* Progress Bar during upload */}
            {uploading && (
              <Progress value={66} className="w-full" />
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {uploadResult && (
              <Alert>
                <AlertDescription className="space-y-2">
                  <p className="font-medium text-green-600">Upload Successful!</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadResult.fileName} ({formatFileSize(uploadResult.fileSize)})
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* S3 Files List Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">S3 Files</CardTitle>
            <Button variant="outline" size="icon" onClick={fetchS3Objects}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : s3Objects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files found in S3
              </div>
            ) : (
              <div className="space-y-2">
                {s3Objects.map((object) => (
                  <div
                    key={object.key}
                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                  >
                    {object.key.endsWith('/') ? (
                      <FolderIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{object.key}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(object.size)} • {new Date(object.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FileManager;