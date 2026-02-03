import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TrailerModal({ isOpen, onClose, movie }) {
  if (!movie?.trailer_url) return null;

  // Check if it's an iframe/embed URL or direct video
  const isIframeUrl = movie.trailer_url.includes('iframe') || 
                       movie.trailer_url.includes('embed') || 
                       movie.trailer_url.includes('youtube.com') ||
                       movie.trailer_url.includes('vimeo.com') ||
                       movie.trailer_url.includes('player.mediadelivery.net') ||
                       movie.trailer_url.includes('bunnycdn.com');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-black border-white/10">
        <div className="relative aspect-video">
          {isIframeUrl ? (
            <iframe
              src={movie.trailer_url}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${movie.title} - Trailer`}
            />
          ) : (
            <video
              src={movie.trailer_url}
              controls
              autoPlay
              className="w-full h-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}