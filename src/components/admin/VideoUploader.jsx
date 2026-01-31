import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';

export default function VideoUploader({ movieTitle, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', 'processing'

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Check file size (limit to 5GB for now)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      toast.error('Video file is too large. Maximum size is 5GB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', movieTitle || file.name);

      setUploadProgress(30);

      const { data } = await base44.functions.invoke('uploadVideoToBunny', formData);

      if (data.success) {
        setUploadProgress(100);
        setUploadStatus('success');
        toast.success('Video uploaded successfully! Processing will complete in a few minutes.');
        
        // Pass the video URL back to parent
        if (onUploadComplete) {
          onUploadComplete(data.video_url, data.videoId);
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer flex-1">
          <div className={`flex items-center justify-center gap-2 h-12 px-4 rounded-lg border-2 border-dashed transition-all ${
            isUploading 
              ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 cursor-not-allowed' 
              : 'border-white/20 hover:border-[#D4AF37] hover:bg-white/5'
          }`}>
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                <span className="text-sm font-medium">Uploading to Bunny.net...</span>
              </>
            ) : uploadStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">Upload Complete!</span>
              </>
            ) : uploadStatus === 'error' ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-500">Upload Failed</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-white/60" />
                <span className="text-sm font-medium text-white/80">Upload to Bunny.net Stream</span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
            disabled={isUploading}
          />
        </label>

        {uploadStatus === 'success' && (
          <Video className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
        )}
      </div>

      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-white/60 text-center">
            {uploadProgress < 100 
              ? `Uploading... ${uploadProgress}%` 
              : 'Processing video... This may take a few minutes.'}
          </p>
        </div>
      )}

      <p className="text-xs text-white/50">
        Supported formats: MP4, MOV, AVI, MKV. Max size: 5GB. Videos are automatically transcoded for optimal streaming.
      </p>
    </div>
  );
}